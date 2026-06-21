const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false // disabled to allow inline scripts if any
}));
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000 // generous limit to avoid breaking the prototype unexpectedly
});
app.use(limiter);
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Initialize SQLite database
const db = new sqlite3.Database('./co2_challenge.db');

// Create tables
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    internship_start_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Habits table
  db.run(`CREATE TABLE IF NOT EXISTS habits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    co2_savings_per_action REAL NOT NULL,
    unit TEXT NOT NULL,
    category TEXT NOT NULL
  )`);

  // User habits (selected habits per user)
  db.run(`CREATE TABLE IF NOT EXISTS user_habits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    habit_id INTEGER,
    selected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (habit_id) REFERENCES habits (id)
  )`);

  // Daily logs
  db.run(`CREATE TABLE IF NOT EXISTS daily_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    habit_id INTEGER,
    date TEXT NOT NULL,
    quantity REAL DEFAULT 1,
    co2_saved REAL,
    notes TEXT,
    logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (habit_id) REFERENCES habits (id)
  )`);

  // Insert default habits with CO₂ savings data
  const defaultHabits = [
    { name: 'Cycling instead of driving', description: 'Replace car commute with bicycle', co2_savings: 0.21, unit: 'km', category: 'Transport' },
    { name: 'Walking instead of driving', description: 'Replace car commute with walking', co2_savings: 0.21, unit: 'km', category: 'Transport' },
    { name: 'Public transport instead of car', description: 'Use bus/train instead of personal vehicle', co2_savings: 0.15, unit: 'km', category: 'Transport' },
    { name: 'Skip single-use plastic', description: 'Avoid plastic bags, bottles, containers', co2_savings: 0.05, unit: 'item', category: 'Waste' },
    { name: 'Plant-based meal', description: 'Choose vegetarian/vegan meal over meat', co2_savings: 2.5, unit: 'meal', category: 'Food' },
    { name: 'Local/organic food', description: 'Choose locally sourced or organic food', co2_savings: 0.3, unit: 'meal', category: 'Food' },
    { name: 'Switch off devices', description: 'Turn off lights, electronics when not in use', co2_savings: 0.02, unit: 'hour', category: 'Energy' },
    { name: 'Reduce heating/cooling', description: 'Lower thermostat by 1°C or use less AC', co2_savings: 0.1, unit: 'hour', category: 'Energy' },
    { name: 'Shorter shower', description: 'Reduce shower time by 2 minutes', co2_savings: 0.15, unit: 'shower', category: 'Water' },
    { name: 'Reusable water bottle', description: 'Use reusable bottle instead of buying bottled water', co2_savings: 0.05, unit: 'bottle', category: 'Waste' }
  ];

  const stmt = db.prepare('INSERT OR IGNORE INTO habits (name, description, co2_savings_per_action, unit, category) VALUES (?, ?, ?, ?, ?)');
  defaultHabits.forEach(habit => {
    stmt.run(habit.name, habit.description, habit.co2_savings, habit.unit, habit.category);
  });
  stmt.finalize();
});

// API Routes

// Get all available habits
app.get('/api/habits', (req, res) => {
  db.all('SELECT * FROM habits ORDER BY category, name', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Create new user
app.post('/api/users', (req, res) => {
  const { name, email, internship_start_date } = req.body;
  
  // First check if user already exists (by name or email)
  let checkQuery = 'SELECT * FROM users WHERE name = ?';
  let checkParams = [name];
  
  if (email && email.trim() !== '') {
    checkQuery = 'SELECT * FROM users WHERE name = ? OR email = ?';
    checkParams = [name, email];
  }
  
  db.get(checkQuery, checkParams, (err, existingUser) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (existingUser) {
      // User already exists
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
    
    // No duplicate found, create new user
    db.run('INSERT INTO users (name, email, internship_start_date) VALUES (?, ?, ?)', 
      [name, email, internship_start_date], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, name, email, internship_start_date });
    });
  });
});

// Get all users
app.get('/api/users', (req, res) => {
  db.all('SELECT * FROM users ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Select habits for user
app.post('/api/users/:userId/habits', (req, res) => {
  const userId = req.params.userId;
  const { habitIds } = req.body;
  
  // First, clear existing selections
  db.run('DELETE FROM user_habits WHERE user_id = ?', [userId], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Insert new selections
    const stmt = db.prepare('INSERT INTO user_habits (user_id, habit_id) VALUES (?, ?)');
    habitIds.forEach(habitId => {
      stmt.run(userId, habitId);
    });
    stmt.finalize((err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Habits selected successfully' });
    });
  });
});

// Get user's selected habits
app.get('/api/users/:userId/habits', (req, res) => {
  const userId = req.params.userId;
  
  db.all(`
    SELECT h.*, uh.selected_at 
    FROM habits h 
    JOIN user_habits uh ON h.id = uh.habit_id 
    WHERE uh.user_id = ? 
    ORDER BY h.category, h.name
  `, [userId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Log daily action
app.post('/api/logs', (req, res) => {
  const { user_id, habit_id, date, quantity, notes } = req.body;
  
  // Get CO₂ savings for this habit
  db.get('SELECT co2_savings_per_action FROM habits WHERE id = ?', [habit_id], (err, habit) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    const co2_saved = habit.co2_savings_per_action * (quantity || 1);
    
    db.run(`
      INSERT INTO daily_logs (user_id, habit_id, date, quantity, co2_saved, notes) 
      VALUES (?, ?, ?, ?, ?, ?)
    `, [user_id, habit_id, date, quantity || 1, co2_saved, notes], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ 
        id: this.lastID, 
        co2_saved,
        message: 'Action logged successfully' 
      });
    });
  });
});

// Get user's logs
app.get('/api/users/:userId/logs', (req, res) => {
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
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get dashboard data
app.get('/api/dashboard', (req, res) => {
  const { startDate, endDate } = req.query;
  
  // Get total CO₂ saved
  let co2Query = 'SELECT SUM(co2_saved) as total_co2_saved FROM daily_logs';
  let co2Params = [];
  
  if (startDate && endDate) {
    co2Query += ' WHERE date BETWEEN ? AND ?';
    co2Params.push(startDate, endDate);
  }
  
  db.get(co2Query, co2Params, (err, co2Result) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Get user statistics
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
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // Get habit statistics
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
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        
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

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve the export page
app.get('/export', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'export.html'));
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`CO₂ Footprint Challenge Server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to access the application`);
  });
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Database connection closed.');
    process.exit(0);
  });
});

module.exports = app;
