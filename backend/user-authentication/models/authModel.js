/**
 * authModel.js - Authentication service data layer
 * Handles all database operations for user authentication and token management
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../shared-db/database.sqlite');

/**
 * Get database connection
 * @returns {Object} SQLite database connection
 */
const getDbConnection = () => {
  return new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('Database connection error:', err.message);
    }
  });
};

/**
 * Create a new user account
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} Newly created user
 */
const createUser = (userData) => {
  return new Promise((resolve, reject) => {
    const db = getDbConnection();
    
    const { email, password_hash, first_name, last_name, role } = userData;

    // Check if email already exists
    db.get(
      'SELECT id FROM users WHERE email = ?',
      [email],
      (err, existingUser) => {
        if (err) {
          db.close();
          return reject(err);
        }

        if (existingUser) {
          db.close();
          return reject(new Error('Email already registered'));
        }

        // Insert new user
        const sql = `
          INSERT INTO users (email, password_hash, first_name, last_name, role)
          VALUES (?, ?, ?, ?, ?)
        `;

        db.run(sql, [email, password_hash, first_name, last_name, role || 'user'], function(err) {
          if (err) {
            db.close();
            return reject(err);
          }

          const userId = this.lastID;

          // Retrieve the newly created user
          db.get(
            'SELECT id, email, first_name, last_name, role, is_verified, created_at FROM users WHERE id = ?',
            [userId],
            (selectErr, user) => {
              db.close();
              
              if (selectErr) {
                return reject(selectErr);
              }
              
              console.log(`✓ User created with ID: ${userId}`);
              resolve(user);
            }
          );
        });
      }
    );
  });
};

/**
 * Find user by email
 * @param {string} email - User email
 * @param {boolean} includePassword - Whether to include password hash
 * @returns {Promise<Object|null>} User object or null
 */
const findUserByEmail = (email, includePassword = false) => {
  return new Promise((resolve, reject) => {
    const db = getDbConnection();
    
    const fields = includePassword 
      ? 'id, email, password_hash, first_name, last_name, role, is_verified, is_active, last_login'
      : 'id, email, first_name, last_name, role, is_verified, is_active, last_login';
    
    const sql = `SELECT ${fields} FROM users WHERE email = ? AND is_active = 1`;
    
    db.get(sql, [email], (err, user) => {
      db.close();
      
      if (err) {
        return reject(err);
      }
      
      resolve(user || null);
    });
  });
};

/**
 * Find user by ID
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} User object or null
 */
const findUserById = (userId) => {
  return new Promise((resolve, reject) => {
    const db = getDbConnection();
    
    const sql = `
      SELECT id, email, first_name, last_name, role, is_verified, is_active, created_at, last_login
      FROM users 
      WHERE id = ? AND is_active = 1
    `;
    
    db.get(sql, [userId], (err, user) => {
      db.close();
      
      if (err) {
        return reject(err);
      }
      
      resolve(user || null);
    });
  });
};

/**
 * Update user's last login timestamp
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
const updateLastLogin = (userId) => {
  return new Promise((resolve, reject) => {
    const db = getDbConnection();
    
    const sql = 'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?';
    
    db.run(sql, [userId], function(err) {
      db.close();
      
      if (err) {
        return reject(err);
      }
      
      resolve(true);
    });
  });
};

/**
 * Store refresh token in database
 * @param {number} userId - User ID
 * @param {string} token - Refresh token
 * @param {Date} expiresAt - Expiration date
 * @returns {Promise<Object>} Token record
 */
const storeRefreshToken = (userId, token, expiresAt) => {
  return new Promise((resolve, reject) => {
    const db = getDbConnection();
    
    const sql = `
      INSERT INTO refresh_tokens (user_id, token, expires_at)
      VALUES (?, ?, ?)
    `;
    
    db.run(sql, [userId, token, expiresAt.toISOString()], function(err) {
      if (err) {
        db.close();
        return reject(err);
      }

      const tokenId = this.lastID;

      db.get(
        'SELECT * FROM refresh_tokens WHERE id = ?',
        [tokenId],
        (selectErr, tokenRecord) => {
          db.close();
          
          if (selectErr) {
            return reject(selectErr);
          }
          
          resolve(tokenRecord);
        }
      );
    });
  });
};

/**
 * Find refresh token
 * @param {string} token - Refresh token
 * @returns {Promise<Object|null>} Token record or null
 */
const findRefreshToken = (token) => {
  return new Promise((resolve, reject) => {
    const db = getDbConnection();
    
    const sql = `
      SELECT * FROM refresh_tokens 
      WHERE token = ? 
      AND revoked = 0 
      AND datetime(expires_at) > datetime('now')
    `;
    
    db.get(sql, [token], (err, tokenRecord) => {
      db.close();
      
      if (err) {
        return reject(err);
      }
      
      resolve(tokenRecord || null);
    });
  });
};

/**
 * Revoke a refresh token
 * @param {string} token - Refresh token to revoke
 * @returns {Promise<boolean>} Success status
 */
const revokeRefreshToken = (token) => {
  return new Promise((resolve, reject) => {
    const db = getDbConnection();
    
    const sql = 'UPDATE refresh_tokens SET revoked = 1 WHERE token = ?';
    
    db.run(sql, [token], function(err) {
      db.close();
      
      if (err) {
        return reject(err);
      }
      
      resolve(true);
    });
  });
};

/**
 * Revoke all refresh tokens for a user
 * @param {number} userId - User ID
 * @returns {Promise<number>} Number of tokens revoked
 */
const revokeAllUserTokens = (userId) => {
  return new Promise((resolve, reject) => {
    const db = getDbConnection();
    
    const sql = 'UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ? AND revoked = 0';
    
    db.run(sql, [userId], function(err) {
      db.close();
      
      if (err) {
        return reject(err);
      }
      
      resolve(this.changes);
    });
  });
};

/**
 * Clean up expired tokens (maintenance function)
 * @returns {Promise<number>} Number of tokens deleted
 */
const cleanupExpiredTokens = () => {
  return new Promise((resolve, reject) => {
    const db = getDbConnection();
    
    const sql = `
      DELETE FROM refresh_tokens 
      WHERE datetime(expires_at) < datetime('now')
      OR revoked = 1
    `;
    
    db.run(sql, [], function(err) {
      db.close();
      
      if (err) {
        return reject(err);
      }
      
      console.log(`✓ Cleaned up ${this.changes} expired/revoked tokens`);
      resolve(this.changes);
    });
  });
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  updateLastLogin,
  storeRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  cleanupExpiredTokens
};
