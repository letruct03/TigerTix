/**
 * ChatBot.js - Natural language booking assistant
 * Placeholder component - integrate with your LLM service
 */

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_ENDPOINTS } from '../config/api';
import './ChatBot.css';

const ChatBot = ({ onEventsFetch }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: `Hello ${user?.firstName}! 👋 I'm your TigerTix booking assistant. I can help you discover events and book tickets using natural language. Try saying "Show me available events" or "Book 2 tickets for [event name]"`,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Add user message to chat
    const userMessage = {
      type: 'user',
      text: inputMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      // Call LLM service to parse intent
      const response = await fetch(API_ENDPOINTS.llm.parse, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputMessage })
      });

      if (!response.ok) {
        throw new Error('Failed to process message');
      }

      const data = await response.json();

      // Add bot response
      const botMessage = {
        type: 'bot',
        text: data.message || 'I understand your request.',
        timestamp: new Date(),
        data: data
      };

      setMessages(prev => [...prev, botMessage]);

      // If intent is show_events, display events
      if (data.intent === 'show_events' && data.events) {
        const eventsMessage = {
          type: 'events',
          events: data.events,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, eventsMessage]);
      }

      // If booking needs confirmation, add confirmation button
      if (data.needs_confirmation && data.event_id) {
        const confirmMessage = {
          type: 'confirmation',
          event_id: data.event_id,
          event_name: data.event_name,
          tickets: data.tickets || 1,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, confirmMessage]);
      }

    } catch (error) {
      console.error('ChatBot error:', error);
      const errorMessage = {
        type: 'bot',
        text: '❌ Sorry, I encountered an error. Please try again or browse events manually.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const confirmBooking = async (eventId, eventName, tickets) => {
    setLoading(true);

    try {
      const response = await fetch(API_ENDPOINTS.llm.confirmBooking, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_id: eventId,
          tickets: tickets
        })
      });

      if (!response.ok) {
        throw new Error('Booking failed');
      }

      const data = await response.json();

      const successMessage = {
        type: 'bot',
        text: `✅ ${data.message}\n\nYour booking details:\n🎫 ${tickets} ticket(s) for ${eventName}\n💵 Total: $${data.booking?.total_price || 0}\n🎟️ Remaining tickets: ${data.booking?.remaining_tickets || 0}`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, successMessage]);

      // Refresh events list
      if (onEventsFetch) {
        onEventsFetch();
      }

    } catch (error) {
      console.error('Booking error:', error);
      const errorMessage = {
        type: 'bot',
        text: '❌ Sorry, the booking failed. The event may be sold out or an error occurred. Please try again or contact support.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <h2>🤖 TigerTix Assistant</h2>
        <p>Powered by AI - Ask me anything about events!</p>
      </div>

      <div className="chatbot-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.type}`}>
            {msg.type === 'bot' && <span className="message-avatar">🤖</span>}
            {msg.type === 'user' && <span className="message-avatar">👤</span>}
            
            <div className="message-content">
              {msg.type === 'events' ? (
                <div className="events-list-chat">
                  <p><strong>Available Events:</strong></p>
                  {msg.events.map(event => (
                    <div key={event.id} className="event-item-chat">
                      <p><strong>{event.name}</strong></p>
                      <p>📅 {new Date(event.date).toLocaleDateString()}</p>
                      <p>💵 {event.price === 0 ? 'FREE' : `$${event.price}`}</p>
                      <p>🎟️ {event.available_tickets} tickets available</p>
                    </div>
                  ))}
                </div>
              ) : msg.type === 'confirmation' ? (
                <div className="confirmation-box">
                  <p><strong>Confirm Booking:</strong></p>
                  <p>Event: {msg.event_name}</p>
                  <p>Tickets: {msg.tickets}</p>
                  <button
                    className="confirm-button"
                    onClick={() => confirmBooking(msg.event_id, msg.event_name, msg.tickets)}
                    disabled={loading}
                  >
                    ✓ Confirm Booking
                  </button>
                </div>
              ) : (
                <p>{msg.text}</p>
              )}
              
              <span className="message-time">
                {msg.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="message bot">
            <span className="message-avatar">🤖</span>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="chatbot-input">
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message... (e.g., 'Show me events' or 'Book 2 tickets for [event]')"
          rows="2"
          disabled={loading}
          aria-label="Chat message input"
        />
        <button
          onClick={sendMessage}
          disabled={loading || !inputMessage.trim()}
          aria-label="Send message"
        >
          {loading ? '⏳' : '📤'}
        </button>
      </div>

      <div className="chatbot-suggestions">
        <p>Try these:</p>
        <button onClick={() => setInputMessage('Show me available events')}>
          📋 Show Events
        </button>
        <button onClick={() => setInputMessage('What events are happening this week?')}>
          📅 This Week
        </button>
        <button onClick={() => setInputMessage('Show me free events')}>
          💵 Free Events
        </button>
      </div>
    </div>
  );
};

export default ChatBot;
