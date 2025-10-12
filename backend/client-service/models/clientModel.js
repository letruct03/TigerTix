const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../shared-db/database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err){
        console.error("Error opening database:", err.message);
    }
    else{
        console.log("Connected to the shared SQLite database with client-services");
    }
});


class clientModel{
    static getAllEvents(){
        return new Promise((resolve, reject) => {
            const eventDB = 'SELECT * FROM events ORDER BY date ASC'
            db.all(eventDB,[],(err,rows) => {
                if(err){
                    reject(err);
                }
                else{
                    resolve(rows);
                }

            });
        });
    }
    static purchaseTicket(eventID){
        return new Promise((resolve, reject) => {
            const eventDB = 'SELECT available_tickets FROM events WHERE id = ?';
            db.get(eventDB, [eventID], (err,row) => {
                if(err){
                    reject(err);
                    return;
                }
                if(!row){
                    reject(new Error('Event not found'));
                    return;
                }
                if(row.available_tickets <= 0){
                    reject(new Error('No tickets available'));
                }
                const updateEvent  = 'UPDATE events SET available_tickets = available_tickets - 1 WHERE id = ?'
                db.run(updateEvent, [eventID], function(err){
                    if(err){
                        reject(err);
                        return;
                    }
                    if(this.changes === 0){
                        reject(new Error('Event not found'));
                        return;
                    }
                    clientModel.getEventByID(eventID)
                        .then(updatedEvent => resolve(updatedEvent))
                        .catch(err => reject(err));
                });
            });
        });
    }
}

module.exports = clientModel;