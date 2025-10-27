import React, { useEffect, useState } from 'react';
import ChatBot from './components/ChatBot';
import './App.css';

function App() {
  const [events, setEvents] = useState([]);
  const [showChatBot, setShowChatBot] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = () => {
    fetch('http://localhost:6001/api/events')
      .then(response => response.json())
      .then(data => {
        console.log("Fetched events:", data);
        if (Array.isArray(data)) setEvents(data);
        else if (Array.isArray(data.data)) setEvents(data.data);
      })
      .catch(err => console.error("Error fetching events:", err));
  };

  const getTicket = (id) => {
    fetch(`http://localhost:6001/api/events/${id}/purchase`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventID: id
      }),
    })
      .then((res) => {
        console.log("Fetch response status:", res.status);
        if (!res.ok) {
          throw new Error(`Failed to purchase ticket. Status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("Server response:", data);
        alert(`Ticket successfully purchased for event ${id}!`);
        fetchEvents();
      })
      .catch((err) => {
        console.error("Error purchasing ticket:", err);
        alert("Could not purchase ticket. Please try again.");
      });
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🎫 TigerTix - Clemson Events</h1>
        <p className="subtitle">Your gateway to campus events</p>
      </header>

      <nav className="view-toggle">
        <button
          className={showChatBot ? 'active' : ''}
          onClick={() => setShowChatBot(true)}
          aria-pressed={showChatBot}
        >
          💬 Chat Assistant
        </button>
        <button
          className={!showChatBot ? 'active' : ''}
          onClick={() => setShowChatBot(false)}
          aria-pressed={!showChatBot}
        >
          📋 Browse Events
        </button>
      </nav>

      <main>
        {showChatBot ? (
          <ChatBot />
        ) : (
          <div className="events-list">
            <h2>Available Events</h2>
            {events.length === 0 ? (
              <p className="no-events">No events available at the moment.</p>
            ) : (
              <ul>
                {events.map((event) => (
                  <li key={event.id} className="event-card">
                    <div className="event-info">
                      <h3>{event.name}</h3>
                      <p className="event-date">📅 {event.date}</p>
                      {event.location && (
                        <p className="event-location">📍 {event.location}</p>
                      )}
                      {event.description && (
                        <p className="event-description">{event.description}</p>
                      )}
                      <div className="event-details">
                        <span className="event-price">💵 ${event.price}</span>
                        <span className="event-tickets">
                          🎟️ {event.available_tickets} / {event.total_tickets} available
                        </span>
                      </div>
                    </div>
                    <button
                      aria-label={`Purchase ticket for ${event.name}`}
                      aria-live="polite"
                      onClick={() => getTicket(event.id)}
                      disabled={event.available_tickets === 0}
                      className={event.available_tickets === 0 ? 'sold-out' : ''}
                    >
                      {event.available_tickets === 0 ? 'Sold Out' : 'Purchase'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </main>

      <footer className="App-footer">
        <p>© 2025 TigerTix - Clemson University</p>
        <p className="sprint-info">Sprint 2: LLM-Driven Booking</p>
      </footer>
    </div>
  );
}

export default App;
