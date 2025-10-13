import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/events')
      .then((response) => response.json())
      .then((data) => setEvents(data))
      .catch((err) => console.error(err));
    }, []);

  const getTicket = (eventID) => {
    fetch('http://localhost:5000/api/events/:id/purchase',
    {
      method: "POST", 
      body: JSON.stringify({
        eventId: eventID
      }),
      
    })
    alert(`Ticket Successfully Purchased for event ${eventID}`)
      .catch((err) => console.error(err));
  };

  return (
    <div className="App">
      <h1>Clemson Campus Events</h1>
      <ul>
        {events.map((event) => (
          <li key={event.id}>
            {event.name} - {event.date}{' '}
            <button aria-label="Purchase Ticket" onClick={() => getTicket(event.id)}>Purchase</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;