/**
 * adminModel.js - Admin service data layer
 * Handles all database operations for event management
 * Connects to the shared SQLite database and provides methods for creating, reading, updating, and deleting events
 */

const sqlite3 = require('sqlite3').verbose();
const { DB_PATH } = require('../setup');

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
 * Create a new event in the database
 * @param {Object} eventData - Event information
 * @param {string} eventData.name - Event name
 * @param {string} eventData.date - Event date (YYYY-MM-DD format)
 * @param {string} eventData.description - Event description
 * @param {string} eventData.location - Event location
 * @param {string} eventData.category - Event category
 * @param {number} eventData.total_tickets - Total number of tickets
 * @param {number} eventData.price - Ticket price
 * @returns {Promise<Object>} Newly created event with id
 */
const createEvent = (eventData) => {
  return new Promise((resolve, reject) => {
    const db = getDbConnection();
    
    const {
      name,
      date,
      description = '',
      location = '',
      category = 'General',
      total_tickets,
      price = 0.0
    } = eventData;

    // SQL query to insert new event
    const sql = `
      INSERT INTO events (
        name, date, description, location, category, 
        total_tickets, available_tickets, price
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Available tickets initially equals total tickets
    const params = [
      name,
      date,
      description,
      location,
      category,
      total_tickets,
      total_tickets, // available_tickets
      price
    ];

    db.run(sql, params, function(err) {
      if (err) {
        console.error('Error creating event:', err.message);
        db.close();
        return reject(err);
      }

      // Retrieve the newly created event
      const eventId = this.lastID;
      
      db.get(
        'SELECT * FROM events WHERE id = ?',
        [eventId],
        (selectErr, row) => {
          db.close();
          
          if (selectErr) {
            console.error('Error retrieving created event:', selectErr.message);
            return reject(selectErr);
          }
          
          console.log(`✓ Event created with ID: ${eventId}`);
          resolve(row);
        }
      );
    });
  });
};

/**
 * Get all events from the database
 * @returns {Promise<Array>} Array of all events
 */
const getAllEvents = () => {
  return new Promise((resolve, reject) => {
    const db = getDbConnection();
    
    const sql = 'SELECT * FROM events ORDER BY date ASC';
    
    db.all(sql, [], (err, rows) => {
      db.close();
      
      if (err) {
        console.error('Error fetching events:', err.message);
        return reject(err);
      }
      
      resolve(rows);
    });
  });
};

/**
 * Get a single event by ID
 * @param {number} id - Event ID
 * @returns {Promise<Object|null>} Event object or null if not found
 */
const getEventById = (id) => {
  return new Promise((resolve, reject) => {
    const db = getDbConnection();
    
    const sql = 'SELECT * FROM events WHERE id = ?';
    
    db.get(sql, [id], (err, row) => {
      db.close();
      
      if (err) {
        console.error('Error fetching event:', err.message);
        return reject(err);
      }
      
      resolve(row || null);
    });
  });
};

/**
 * Update an existing event
 * @param {number} id - Event ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated event object
 */
const updateEvent = (id, updates) => {
  return new Promise((resolve, reject) => {
    const db = getDbConnection();
    
    // Build dynamic UPDATE query based on provided fields
    const allowedFields = [
      'name', 'date', 'description', 'location',
      'category', 'total_tickets', 'price'
    ];
    
    const fieldsToUpdate = Object.keys(updates).filter(
      key => allowedFields.includes(key)
    );
    
    if (fieldsToUpdate.length === 0) {
      db.close();
      return reject(new Error('No valid fields to update'));
    }
    
    // Create SET clause and values array
    const setClause = fieldsToUpdate.map(field => `${field} = ?`).join(', ');
    const values = fieldsToUpdate.map(field => updates[field]);
    values.push(id); // Add id for WHERE clause
    
    const sql = `
      UPDATE events 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    db.run(sql, values, function(err) {
      if (err) {
        console.error('Error updating event:', err.message);
        db.close();
        return reject(err);
      }
      
      if (this.changes === 0) {
        db.close();
        return reject(new Error('Event not found'));
      }
      
      // Retrieve updated event
      db.get('SELECT * FROM events WHERE id = ?', [id], (selectErr, row) => {
        db.close();
        
        if (selectErr) {
          console.error('Error retrieving updated event:', selectErr.message);
          return reject(selectErr);
        }
        
        console.log(`✓ Event ${id} updated successfully`);
        resolve(row);
      });
    });
  });
};

/**
 * Delete an event from the database
 * @param {number} id - Event ID
 * @returns {Promise<boolean>} True if deleted successfully
 */
const deleteEvent = (id) => {
  return new Promise((resolve, reject) => {
    const db = getDbConnection();
    
    const sql = 'DELETE FROM events WHERE id = ?';
    
    db.run(sql, [id], function(err) {
      db.close();
      
      if (err) {
        console.error('Error deleting event:', err.message);
        return reject(err);
      }
      
      if (this.changes === 0) {
        return reject(new Error('Event not found'));
      }
      
      console.log(`✓ Event ${id} deleted successfully`);
      resolve(true);
    });
  });
};

module.exports = {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent
};