const sqlite3 = require('sqlite3').verbose();

// Initialize SQLite database
const dbPath = process.env.NODE_ENV === 'test' ? ':memory:' : './co2_challenge.db';
const db = new sqlite3.Database(dbPath);

/**
 * Handle database errors safely without leaking internal structure
 * @param {Object} res - Express response object
 * @param {Error} err - Database error object
 */
const handleDbError = (res, err) => {
  console.error('[DB Error]:', err.message);
  res.status(500).json({ error: 'Internal server error' });
};

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

  // Performance indices
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_name ON users(name)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_user_habits_user_id ON user_habits(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON daily_logs(user_id, date)`);

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

module.exports = { db, handleDbError };
