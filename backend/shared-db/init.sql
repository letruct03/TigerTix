-- TigerTix Database Schema
-- Creates the necessary tables for the TigerTix event management system
-- Both admin-service and client-service will connect to this shared database

-- Events table: stores all event information
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    description TEXT,
    location TEXT,
    category TEXT,
    total_tickets INTEGER NOT NULL DEFAULT 0,
    available_tickets INTEGER NOT NULL DEFAULT 0,
    price REAL NOT NULL DEFAULT 0.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tickets table: stores ticket purchase records
CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    user_email TEXT NOT NULL,
    purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    quantity INTEGER NOT NULL DEFAULT 1,
    total_price REAL NOT NULL DEFAULT 0.0,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Create index for faster event lookups
CREATE INDEX IF NOT EXISTS idx_event_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_ticket_event ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_ticket_email ON tickets(user_email);