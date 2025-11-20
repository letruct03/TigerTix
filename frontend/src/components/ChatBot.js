/**
 * ChatBot.js - Natural language booking assistant
 * Placeholder component - integrate with your LLM service
 */

import { useAuth } from '../contexts/authContext';
import { API_ENDPOINTS } from '../config/api';
import React, { useState, useRef, useEffect } from 'react';
import './ChatBot.css';

const ChatBot = ({ onEventsFetch }) => {
  const [isTTSActive, setIsTTSActive] = useState(true); 
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
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Browser does not support SpeechRecognition");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInputMessage(transcript);
    };
    recognition.onend = () => {
      setIsRecording(false);
    };
    recognitionRef.current = recognition;
  }, []);
  useEffect(() => {
    if (!messages.length) return;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.type === "bot" && typeof lastMessage.text === "string") {
      const utterance = new SpeechSynthesisUtterance(lastMessage.text);
      utterance.lang = "en-US";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  }, [messages]);
  useEffect(() => {
  if (!isTTSActive || !messages.length) return;
  const lastBotMessage = [...messages].reverse().find(msg => msg.type === 'bot');
  if (!lastBotMessage) return;
  const utterance = new SpeechSynthesisUtterance(lastBotMessage.text);
  utterance.lang = "en-US";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  }, [messages, isTTSActive]);
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

const [isRecording, setIsRecording] = useState(false);
const recognitionRef = useRef(null);

  useEffect(() => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.warn("Browser does not support SpeechRecognition");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = true;
  recognition.continuous = true;

  recognition.onresult = (event) => {
    let transcript = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    setInputMessage(transcript);
  };

  recognition.onend = () => {
    setIsRecording(false);
  };

  recognitionRef.current = recognition;
}, []);

const toggleMic = () => {
  const recognition = recognitionRef.current;

  if (!recognition) {
    alert("Speech recognition not supported in this browser");
    return;
  }

  if (!isRecording) {
    recognition.start();
    setIsRecording(true);
  } else {
    recognition.stop();
    setIsRecording(false);
  }
};
const [ttsEnabled, setTtsEnabled] = useState(true);

const speakText = (text) => {
  if (!ttsEnabled) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 1;
  utterance.pitch = 1;

  window.speechSynthesis.cancel(); // stop previous speech
  window.speechSynthesis.speak(utterance);
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
        <button
          onClick={toggleMic}
          className={isRecording ? "mic-button recording" : "mic-button"}
          aria-label="Voice input"
        >
        🎤
        </button>
        <button
          onClick={() => {
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
            }
            setIsTTSActive(prev => !prev)}
          }
          className={isTTSActive ? "tts-button active" : "tts-button"}
          aria-label={isTTSActive ? "Disable TTS" : "Enable TTS"}
        >
          🔊
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
