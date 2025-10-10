/**
 * setup.js - Database initialization script
 * Creates database tables if they don't exist on server startup
 * Executed when the admin-service starts to ensure the database is ready
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Path to shared database
const DB_PATH = path.join(__dirname, '../shared-db/database.sqlite');
const INIT_SQL_PATH = path.join(__dirname, '../shared-db/init.sql');

/**
 * Initialize the database by running the init.sql script
 * @returns {Promise<void>} Resolves when database is initialized
 * @throws {Error} If database initialization fails
 */
const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    // Ensure shared-db directory exists
    const dbDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      console.log('✓ Created shared-db directory');
    }

    // Create database connection
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('✗ Failed to connect to database:', err.message);
        return reject(err);
      }
      console.log('✓ Connected to SQLite database');
    });

    // Read and execute init.sql
    try {
      const initSQL = fs.readFileSync(INIT_SQL_PATH, 'utf8');
      
      // Execute the SQL script
      db.exec(initSQL, (err) => {
        if (err) {
          console.error('✗ Failed to execute init.sql:', err.message);
          db.close();
          return reject(err);
        }
        
        console.log('✓ Database schema initialized successfully');
        
        // Close the database connection
        db.close((closeErr) => {
          if (closeErr) {
            console.error('✗ Error closing database:', closeErr.message);
            return reject(closeErr);
          }
          console.log('✓ Database connection closed');
          resolve();
        });
      });
    } catch (readErr) {
      console.error('✗ Failed to read init.sql:', readErr.message);
      db.close();
      reject(readErr);
    }
  });
};

module.exports = { initializeDatabase, DB_PATH };