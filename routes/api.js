const express = require('express');
const router = express.Router();
const { db, handleDbError } = require('../db/database');
const {
  handleValidationErrors,
  validateUserCreation,
  validateHabitSelection,
  validateLogEntry,
  validateDateRange,
  validateUserIdParam
} = require('../middleware/validation');

// Simple in-memory cache for habits
let habitsCache = null;

/**
 * @route GET /api/habits
 * @desc Get all available sustainable habits
 */
router.get('/habits', (req, res) => {
  if (habitsCache) {
    return res.json(habitsCache);
  }
  db.all('SELECT * FROM habits ORDER BY category, name', (err, rows) => {
    if (err) return handleDbError(res, err);
    habitsCache = rows;
    res.json(rows);
  });
});

/**
 * @route POST /api/users
 * @desc Create a new user profile
 */
router.post('/users', validateUserCreation, handleValidationErrors, (req, res) => {
  const { name, email, internship_start_date } = req.body;
  
  // First check if user already exists (by name or email)
  let checkQuery = 'SELECT * FROM users WHERE name = ?';
  let checkParams = [name];
  
  if (email && email.trim() !== '') {
    checkQuery = 'SELECT * FROM users WHERE name = ? OR email = ?';
    checkParams = [name, email];
  }
  
  db.get(checkQuery, checkParams, (err, existingUser) => {
    if (err) return handleDbError(res, err);
    
    if (existingUser) {
      if (existingUser.name === name && existingUser.email === email) {
        res.status(409).json({ 
          error: 'A profile with this name and email already exists.',
          type: 'duplicate_both'
        });
      } else if (existingUser.name === name) {
        res.status(409).json({ 
          error: 'A profile with this name already exists. Please choose a different name.',
          type: 'duplicate_name'
        });
      } else if (existingUser.email === email) {
        res.status(409).json({ 
          error: 'A profile with this email already exists. Please use a different email.',
          type: 'duplicate_email'
        });
      }
      return;
    }
    
    db.run('INSERT INTO users (name, email, internship_start_date) VALUES (?, ?, ?)', 
      [name, email, internship_start_date], function(err) {
      if (err) return handleDbError(res, err);
      res.status(201).json({ id: this.lastID, name, email, internship_start_date });
    });
  });
});

/**
 * @route GET /api/users
 * @desc Get all users
 */
router.get('/users', (req, res) => {
  db.all('SELECT * FROM users ORDER BY created_at DESC', (err, rows) => {
    if (err) return handleDbError(res, err);
    res.json(rows);
  });
});

/**
 * @route POST /api/users/:userId/habits
 * @desc Assign selected habits to a user
 */
router.post('/users/:userId/habits', validateHabitSelection, handleValidationErrors, (req, res) => {
  const userId = req.params.userId;
  const { habitIds } = req.body;
  
  db.run('DELETE FROM user_habits WHERE user_id = ?', [userId], (err) => {
    if (err) return handleDbError(res, err);
    
    const stmt = db.prepare('INSERT INTO user_habits (user_id, habit_id) VALUES (?, ?)');
    habitIds.forEach(habitId => {
      stmt.run(userId, habitId);
    });
    stmt.finalize((err) => {
      if (err) return handleDbError(res, err);
      res.status(201).json({ message: 'Habits selected successfully' });
    });
  });
});

/**
 * @route GET /api/users/:userId/habits
 * @desc Get specific user's selected habits
 */
router.get('/users/:userId/habits', validateUserIdParam, handleValidationErrors, (req, res) => {
  const userId = req.params.userId;
  
  db.all(`
    SELECT h.*, uh.selected_at 
    FROM habits h 
    JOIN user_habits uh ON h.id = uh.habit_id 
    WHERE uh.user_id = ? 
    ORDER BY h.category, h.name
  `, [userId], (err, rows) => {
    if (err) return handleDbError(res, err);
    res.json(rows);
  });
});

/**
 * @route POST /api/logs
 * @desc Log a new daily sustainable action
 */
router.post('/logs', validateLogEntry, handleValidationErrors, (req, res) => {
  const { user_id, habit_id, date, quantity, notes } = req.body;
  
  db.get('SELECT co2_savings_per_action FROM habits WHERE id = ?', [habit_id], (err, habit) => {
    if (err) return handleDbError(res, err);
    
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    
    const co2_saved = habit.co2_savings_per_action * (quantity || 1);
    
    db.run(`
      INSERT INTO daily_logs (user_id, habit_id, date, quantity, co2_saved, notes) 
      VALUES (?, ?, ?, ?, ?, ?)
    `, [user_id, habit_id, date, quantity || 1, co2_saved, notes], function(err) {
      if (err) return handleDbError(res, err);
      res.status(201).json({ 
        id: this.lastID, 
        co2_saved,
        message: 'Action logged successfully' 
      });
    });
  });
});

/**
 * @route GET /api/users/:userId/logs
 * @desc Get all logged actions for a user within an optional date range
 */
router.get('/users/:userId/logs', [...validateUserIdParam, ...validateDateRange], handleValidationErrors, (req, res) => {
  const userId = req.params.userId;
  const { startDate, endDate } = req.query;
  
  let query = `
    SELECT dl.*, h.name as habit_name, h.unit, h.category 
    FROM daily_logs dl 
    JOIN habits h ON dl.habit_id = h.id 
    WHERE dl.user_id = ?
  `;
  let params = [userId];
  
  if (startDate && endDate) {
    query += ' AND dl.date BETWEEN ? AND ?';
    params.push(startDate, endDate);
  }
  
  query += ' ORDER BY dl.date DESC, dl.logged_at DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) return handleDbError(res, err);
    res.json(rows);
  });
});

/**
 * @route GET /api/dashboard
 * @desc Get aggregated dashboard statistics within an optional date range
 */
router.get('/dashboard', validateDateRange, handleValidationErrors, (req, res) => {
  const { startDate, endDate } = req.query;
  
  let co2Query = 'SELECT SUM(co2_saved) as total_co2_saved FROM daily_logs';
  let co2Params = [];
  
  if (startDate && endDate) {
    co2Query += ' WHERE date BETWEEN ? AND ?';
    co2Params.push(startDate, endDate);
  }
  
  db.get(co2Query, co2Params, (err, co2Result) => {
    if (err) return handleDbError(res, err);
    
    let userQuery = `
      SELECT u.id, u.name, SUM(dl.co2_saved) as total_co2_saved, COUNT(dl.id) as total_actions
      FROM users u 
      LEFT JOIN daily_logs dl ON u.id = dl.user_id
    `;
    let userParams = [];
    
    if (startDate && endDate) {
      userQuery += ' AND dl.date BETWEEN ? AND ?';
      userParams.push(startDate, endDate);
    }
    
    userQuery += ' GROUP BY u.id, u.name ORDER BY total_co2_saved DESC';
    
    db.all(userQuery, userParams, (err, userStats) => {
      if (err) return handleDbError(res, err);
      
      let habitQuery = `
        SELECT h.name, h.category, SUM(dl.co2_saved) as total_co2_saved, COUNT(dl.id) as total_actions
        FROM habits h 
        LEFT JOIN daily_logs dl ON h.id = dl.habit_id
      `;
      let habitParams = [];
      
      if (startDate && endDate) {
        habitQuery += ' AND dl.date BETWEEN ? AND ?';
        habitParams.push(startDate, endDate);
      }
      
      habitQuery += ' GROUP BY h.id, h.name, h.category ORDER BY total_co2_saved DESC';
      
      db.all(habitQuery, habitParams, (err, habitStats) => {
        if (err) return handleDbError(res, err);
        
        res.json({
          total_co2_saved: co2Result.total_co2_saved || 0,
          total_users: userStats.length,
          total_actions: userStats.reduce((sum, user) => sum + (user.total_actions || 0), 0),
          user_stats: userStats,
          habit_stats: habitStats
        });
      });
    });
  });
});

module.exports = router;
