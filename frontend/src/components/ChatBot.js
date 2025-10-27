import React, { useState, useEffect, useRef } from 'react';
import './ChatBot.css';

/**
 * ChatBot Component
 * LLM-driven interface for ticket booking
 * Implements the 5 allowed chatbot tasks
 */
function ChatBot() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! Welcome to TigerTix. I can help you view available events and book tickets. Try saying "show events" or "book tickets for [event name]".',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(null);
  const messagesEndRef = useRef(null);

  /* Auto-scroll to bottom when new messages arrive */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* Send message to LLM service */
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');

    /* Add user message to chat */
    const newUserMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      /* Call LLM parse endpoint */
      const response = await fetch('http://localhost:7001/api/llm/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });

      const data = await response.json();

      if (!data.success) {
        /* Handle error */
        const errorMessage = {
          role: 'assistant',
          content: data.error || 'Sorry, I could not understand that. Please try again.',
          timestamp: new Date()
        };
        
        if (data.fallback) {
          errorMessage.content += `\n\n${data.fallback}`;
        }
        
        setMessages(prev => [...prev, errorMessage]);
        setIsLoading(false);
        return;
      }

      /* Handle different intents */
      if (data.intent === 'greeting') {
        /* Task 1: Greeting the user */
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message,
          timestamp: new Date()
        }]);
      } 
      else if (data.intent === 'show_events') {
        /* Task 2: Showing events with available tickets */
        let eventsList = data.message;
        
        if (data.events && data.events.length > 0) {
          eventsList += '\n\n';
          data.events.forEach(event => {
            eventsList += `📅 **${event.name}**\n`;
            eventsList += `   Date: ${event.date}\n`;
            eventsList += `   Available: ${event.available_tickets} tickets\n`;
            eventsList += `   Price: $${event.price}\n`;
            if (event.location) eventsList += `   Location: ${event.location}\n`;
            eventsList += '\n';
          });
          eventsList += 'To book tickets, say something like "book 2 tickets for [event name]"';
        } else {
          eventsList += '\n\nNo events with available tickets at the moment.';
        }
        
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: eventsList,
          timestamp: new Date(),
          events: data.events
        }]);
      } 
      else if (data.intent === 'book_tickets') {
        if (data.event_id && data.tickets) {
          /* Task 3: Showing the chatbot is going to book a specific ticket */
          /* Task 4: Ask for confirmation */
          setPendingBooking({
            event_id: data.event_id,
            event_name: data.event_name,
            tickets: data.tickets
          });
          
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: data.message,
            timestamp: new Date(),
            needsConfirmation: true,
            bookingData: {
              event_id: data.event_id,
              event_name: data.event_name,
              tickets: data.tickets
            }
          }]);
        } else {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: data.message || 'Could not find that event. Please try again or say "show events" to see available options.',
            timestamp: new Date()
          }]);
        }
      }
      else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message,
          timestamp: new Date()
        }]);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  /* Confirm booking after user clicks confirmation button */
  const handleConfirmBooking = async (bookingData) => {
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:7001/api/llm/confirm-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: bookingData.event_id,
          tickets: bookingData.tickets
        })
      });

      const data = await response.json();

      if (data.success) {
        /* Task 5: Confirming that the ticket is booked */
        const confirmMessage = {
          role: 'assistant',
          content: `✓ ${data.message}\n\n` +
                   `Event: ${data.booking.event_name}\n` +
                   `Tickets: ${data.booking.tickets_booked}\n` +
                   `Total: $${data.booking.total_price}\n` +
                   `Remaining tickets: ${data.booking.remaining_tickets}`,
          timestamp: new Date(),
          isSuccess: true
        };
        setMessages(prev => [...prev, confirmMessage]);
        setPendingBooking(null);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `❌ ${data.error}\n\nPlease try again or say "show events" to see available options.`,
          timestamp: new Date(),
          isError: true
        }]);
      }

    } catch (error) {
      console.error('Error confirming booking:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Failed to confirm booking. Please try again.',
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  /* Cancel pending booking */
  const handleCancelBooking = () => {
    setPendingBooking(null);
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: 'Booking cancelled. Let me know if you\'d like to book something else!',
      timestamp: new Date()
    }]);
  };

  /* Handle Enter key press */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <h2>🎫 TigerTix Booking Assistant</h2>
        <p className="chatbot-subtitle">Book tickets using natural language</p>
      </div>

      <div className="chatbot-messages" role="log" aria-live="polite" aria-label="Chat messages">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`message ${msg.role}`}
            role="article"
            aria-label={`${msg.role === 'user' ? 'Your message' : 'Assistant message'}`}
          >
            <div className="message-content">
              {msg.content.split('\n').map((line, i) => (
                <React.Fragment key={i}>
                  {line.startsWith('**') && line.endsWith('**') ? (
                    <strong>{line.slice(2, -2)}</strong>
                  ) : (
                    line
                  )}
                  {i < msg.content.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))}
            </div>
            
            {msg.needsConfirmation && msg.bookingData && (
              <div className="confirmation-buttons">
                <button 
                  onClick={() => handleConfirmBooking(msg.bookingData)}
                  className="confirm-button"
                  disabled={isLoading}
                  aria-label={`Confirm booking ${msg.bookingData.tickets} tickets for ${msg.bookingData.event_name}`}
                >
                  ✓ Confirm Booking
                </button>
                <button 
                  onClick={handleCancelBooking}
                  className="cancel-button"
                  disabled={isLoading}
                  aria-label="Cancel booking"
                >
                  ✗ Cancel
                </button>
              </div>
            )}
            
            <span className="message-time">
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        
        {isLoading && (
          <div className="message assistant loading" role="status" aria-live="polite">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="chatbot-input-container">
        <label htmlFor="chatbot-input" className="sr-only">Type your message</label>
        <textarea
          id="chatbot-input"
          className="chatbot-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message... (e.g., 'show events' or 'book 2 tickets for Jazz Night')"
          disabled={isLoading}
          rows="2"
          aria-label="Message input"
        />
        <button 
          onClick={handleSendMessage} 
          className="send-button"
          disabled={isLoading || !inputValue.trim()}
          aria-label="Send message"
        >
          Send
        </button>
      </div>

      <div className="chatbot-help">
        <details>
          <summary>Need help?</summary>
          <ul>
            <li>Say "show events" to see available events</li>
            <li>Say "book 2 tickets for [event name]" to book tickets</li>
            <li>You'll be asked to confirm before any booking is made</li>
          </ul>
        </details>
      </div>
    </div>
  );
}

export default ChatBot;
