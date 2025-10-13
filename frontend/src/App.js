import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetch('http://localhost:6001/api/events')
      .then(response => response.json())
      .then(data => setEvents(data))
      .then(data => console.log(data));
    }, []);

  const getTicket = (id) => {
    fetch('http://localhost:6001/api/events/:id/purchase',
    {
      method: "POST", 
      body: JSON.stringify({
        eventID: id
      }),
      
    })
    alert(`Ticket Successfully Purchased for event ${id}`)
      .catch((err) => console.error(err));
  };

  return (
    <div className="App">
      <h1>Clemson Campus Events</h1>
      <ul>
        {events.map((event) => (
          <li key={event.id}>
            <p>{event.name} - {event.date}{' '}</p>
            <button aria-label="Purchase Ticket" aria-live='polite' 
              onClick={() => getTicket(event.id)}>Purchase</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;