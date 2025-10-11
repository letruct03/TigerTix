import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/events', {
      method: "GET",
    })
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .catch((err) => console.error(err));
    }, []);

  const purchaseTicket = (eventName) => {
    fetch('http://localhost:5000/api/events/:id/purchase',
    {
      method: "POST",
    })
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .catch((err) => console.error(err));
  };

  return (
    <div className="App">
      <h1>Clemson Campus Events</h1>
      <ul>
        {events.map((event) => (
          <li key={event.id}>
            {event.name} - {event.date}{' '}
            <button onClick={() => purchaseTicket(event.name)}>Buy Ticket</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;