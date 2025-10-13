import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetch('http://localhost:6001/api/events')
      .then(response => response.json())
      .then(data => {
        console.log("Fetched events:", data);
        if (Array.isArray(data)) setEvents(data);
        else if (Array.isArray(data.data)) setEvents(data.data);
      })
      .catch(err => console.error("Error fetching events:", err));
  }, []);

  const getTicket = (id) => {
    fetch(`http://localhost:6001/api/events/${id}/purchase`,
    {
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
    })
    .catch((err) => {
      console.error("Error purchasing ticket:", err);
      alert("Could not purchase ticket. Please try again.");
    });
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