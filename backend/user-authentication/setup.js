/**
 * setup.js - Authentication service database initialization
 * Creates database tables and ensures auth database is ready
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Path to authentication database (separate from events database)
const AUTH_DB_PATH = path.join(__dirname, '../database/auth.sqlite');
const INIT_SQL_PATH = path.join(__dirname, '../database/init-auth.sql');

/**
 * Initialize the authentication database
 * @returns {Promise<void>} Resolves when database is initialized
 * @throws {Error} If database initialization fails
 */
const initializeAuthDatabase = () => {
  return new Promise((resolve, reject) => {
    // Ensure database directory exists
    const dbDir = path.dirname(AUTH_DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      console.log('✓ Created database directory');
    }

    // Create database connection
    const db = new sqlite3.Database(AUTH_DB_PATH, (err) => {
      if (err) {
        console.error('✗ Failed to connect to auth database:', err.message);
        return reject(err);
      }
      console.log('✓ Connected to authentication database');
    });

    // Read and execute init-auth.sql
    try {
      const initSQL = fs.readFileSync(INIT_SQL_PATH, 'utf8');
      
      // Execute the SQL script
      db.exec(initSQL, (err) => {
        if (err) {
          console.error('✗ Failed to execute init-auth.sql:', err.message);
          db.close();
          return reject(err);
        }
        
        console.log('✓ Authentication database schema initialized');
        
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
      console.error('✗ Failed to read init-auth.sql:', readErr.message);
      db.close();
      reject(readErr);
    }
  });
};

module.exports = { initializeAuthDatabase, AUTH_DB_PATH };
