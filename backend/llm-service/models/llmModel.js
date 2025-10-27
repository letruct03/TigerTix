/**
 * llmModel.js - LLM service data layer
 * Handles database operations for LLM-driven booking with transaction safety
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../../shared-db/database.sqlite');

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
 * Get all events with available tickets
 * @returns {Promise<Array>} Array of events with available tickets > 0
 */
const getAvailableEvents = () => {
  return new Promise((resolve, reject) => {
    const db = getDbConnection();
    
    const sql = `
      SELECT id, name, date, description, location, category, 
             total_tickets, available_tickets, price
      FROM events 
      WHERE available_tickets > 0 
      ORDER BY date ASC
    `;
    
    db.all(sql, [], (err, rows) => {
      db.close();
      
      if (err) {
        console.error('Error fetching available events:', err.message);
        return reject(err);
      }
      
      resolve(rows);
    });
  });
};

/**
 * Get event by ID
 * @param {number} eventId - Event ID
 * @returns {Promise<Object|null>} Event object or null
 */
const getEventById = (eventId) => {
  return new Promise((resolve, reject) => {
    const db = getDbConnection();
    
    const sql = 'SELECT * FROM events WHERE id = ?';
    
    db.get(sql, [eventId], (err, row) => {
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
 * Search events by name
 * @param {string} eventName - Event name to search for
 * @returns {Promise<Array>} Array of matching events
 */
const searchEventsByName = (eventName) => {
  return new Promise((resolve, reject) => {
    const db = getDbConnection();
    
    const sql = `
      SELECT * FROM events 
      WHERE LOWER(name) LIKE LOWER(?) 
      AND available_tickets > 0
      ORDER BY date ASC
    `;
    
    /* Add wildcards for matching */
    const searchPattern = `%${eventName}%`;
    
    db.all(sql, [searchPattern], (err, rows) => {
      db.close();
      
      if (err) {
        console.error('Error searching events:', err.message);
        return reject(err);
      }
      
      resolve(rows);
    });
  });
};

/**
 * Confirm booking with transaction safety
 * This prevents overselling by using SQLite transactions
 * @param {number} eventId - Event ID
 * @param {number} ticketCount - Number of tickets to book
 * @returns {Promise<Object>} Booking confirmation with updated event
 */
const confirmBooking = (eventId, ticketCount) => {
  return new Promise((resolve, reject) => {
    const db = getDbConnection();
    
    db.serialize(() => {
      
      /* BEGIN TRANSACTION */
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) {
          console.error('Error starting transaction:', err.message);
          db.close();
          return reject(err);
        }
        
        /* Check current ticket availability */
        db.get(
          'SELECT * FROM events WHERE id = ?',
          [eventId],
          (selectErr, event) => {
            if (selectErr) {
              console.error('Error fetching event:', selectErr.message);
              db.run('ROLLBACK', () => db.close());
              return reject(selectErr);
            }
            
            if (!event) {
              db.run('ROLLBACK', () => db.close());
              return reject(new Error('Event not found'));
            }
            
            /* Check if enough tickets available */
            if (event.available_tickets < ticketCount) {
              db.run('ROLLBACK', () => db.close());
              return reject(
                new Error(`Not enough tickets available. Only ${event.available_tickets} tickets remaining.`)
              );
            }
            
            /* Update ticket count */
            db.run(
              'UPDATE events SET available_tickets = available_tickets - ? WHERE id = ?',
              [ticketCount, eventId],
              function(updateErr) {
                if (updateErr) {
                  console.error('Error updating tickets:', updateErr.message);
                  db.run('ROLLBACK', () => db.close());
                  return reject(updateErr);
                }
                
                if (this.changes === 0) {
                  db.run('ROLLBACK', () => db.close());
                  return reject(new Error('Failed to update ticket count'));
                }
                
                /* Get updated event data */
                db.get(
                  'SELECT * FROM events WHERE id = ?',
                  [eventId],
                  (finalSelectErr, updatedEvent) => {
                    if (finalSelectErr) {
                      console.error('Error fetching updated event:', finalSelectErr.message);
                      db.run('ROLLBACK', () => db.close());
                      return reject(finalSelectErr);
                    }
                    
                    /* COMMIT TRANSACTION */
                    db.run('COMMIT', (commitErr) => {
                      db.close();
                      
                      if (commitErr) {
                        console.error('Error committing transaction:', commitErr.message);
                        return reject(commitErr);
                      }
                      
                      console.log(`✓ Booking confirmed: ${ticketCount} ticket(s) for event ${eventId}`);
                      
                      resolve({
                        event_id: updatedEvent.id,
                        event_name: updatedEvent.name,
                        event_date: updatedEvent.date,
                        tickets_booked: ticketCount,
                        remaining_tickets: updatedEvent.available_tickets,
                        total_price: (parseFloat(updatedEvent.price) * ticketCount).toFixed(2)
                      });
                    });
                  }
                );
              }
            );
          }
        );
      });
    });
  });
};

module.exports = {
  getAvailableEvents,
  getEventById,
  searchEventsByName,
  confirmBooking
};
