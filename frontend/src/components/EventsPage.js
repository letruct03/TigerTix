/**
 * EventsPage.js - Main events page with ChatBot and browse views
 * Integrates authentication for ticket purchases
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_ENDPOINTS, authenticatedFetch } from '../config/api';
import ChatBot from './ChatBot';
import './EventsPage.css';

const EventsPage = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showChatBot, setShowChatBot] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(API_ENDPOINTS.events);
      
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setEvents(data);
      } else if (Array.isArray(data.data)) {
        setEvents(data.data);
      } else {
        setEvents([]);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const purchaseTicket = async (eventId, eventName) => {
    try {
      const response = await authenticatedFetch(
        API_ENDPOINTS.purchaseTicket(eventId),
        {
          method: 'POST',
          body: JSON.stringify({ eventID: eventId })
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to purchase ticket');
      }

      const data = await response.json();
      
      alert(`🎉 Ticket successfully purchased for ${eventName}!`);
      
      // Refresh events to update available tickets
      fetchEvents();
      
      return data;
    } catch (err) {
      console.error('Error purchasing ticket:', err);
      alert(`❌ ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading events...</p>
      </div>
    );
  }

  return (
    <div className="events-page">
      <div className="page-header">
        <h1>Welcome back, {user?.firstName}! 👋</h1>
        <p>Discover and book tickets for amazing Clemson events</p>
      </div>

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

      <div className="events-content">
        {showChatBot ? (
          <ChatBot onEventsFetch={fetchEvents} />
        ) : (
          <div className="events-list">
            <h2>Available Events</h2>
            
            {error && (
              <div className="error-message" role="alert">
                <p>⚠️ {error}</p>
                <button onClick={fetchEvents} className="retry-button">
                  🔄 Retry
                </button>
              </div>
            )}
            
            {events.length === 0 && !error ? (
              <p className="no-events">No events available at the moment.</p>
            ) : (
              <ul className="events-grid">
                {events.map((event) => (
                  <li key={event.id} className="event-card">
                    <div className="event-info">
                      <h3>{event.name}</h3>
                      
                      <div className="event-meta">
                        <p className="event-date">
                          📅 {new Date(event.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        
                        {event.location && (
                          <p className="event-location">
                            📍 {event.location}
                          </p>
                        )}
                        
                        {event.category && (
                          <span className="event-category">
                            {event.category}
                          </span>
                        )}
                      </div>

                      {event.description && (
                        <p className="event-description">{event.description}</p>
                      )}

                      <div className="event-details">
                        <span className="event-price">
                          💵 {event.price === 0 ? 'FREE' : `$${event.price}`}
                        </span>
                        <span className="event-tickets">
                          🎟️ {event.available_tickets} / {event.total_tickets} available
                        </span>
                      </div>
                    </div>

                    <button
                      aria-label={`Purchase ticket for ${event.name}`}
                      onClick={() => purchaseTicket(event.id, event.name)}
                      disabled={event.available_tickets === 0}
                      className={event.available_tickets === 0 ? 'sold-out' : ''}
                    >
                      {event.available_tickets === 0 ? '❌ Sold Out' : '🎫 Purchase Ticket'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsPage;
