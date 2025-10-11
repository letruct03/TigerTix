const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../shared-db/database.sqlite', database.sqlite);

class clientModel{
    static getAllEvents(){
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM events ORDER BY date ASC'
        }
    }
}