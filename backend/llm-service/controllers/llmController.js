/**
 * llmController.js - LLM service controller
 * Handles input for ticket booking
 */

import fetch from "node-fetch";
globalThis.fetch = fetch;
const OpenAI = require("openai");
const llmModel = require('../models/llmModel');
require('dotenv').config();


/* Initialize client */

const openai = new OpenAI({ apiKey: "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"});

/* Parse input and extract booking intent */
const parseBookingIntent = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be a non-empty string'
      });
    }

    /* Check for keyword-based fallback first */
    const fallbackResult = await keywordFallback(message);
    if (fallbackResult) {
      return res.status(200).json(fallbackResult);
    }

    /* If no API key, return error */
    if (!openai.apiKey && !process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'LLM service not configured. Please set OPENAI_API_KEY environment variable.',
        fallback: 'Use commands like: "show events", "book 2 tickets for [event name]", "list events"'
      });
    }

    /* Get available events from database */
    const availableEvents = await llmModel.getAvailableEvents();

    /* Create system prompt for the LLM */
    const systemPrompt = `You are a ticket booking assistant for TigerTix at Clemson University. 
You can only help with:
1. Greeting users
2. Showing available events
3. Parsing ticket booking requests
4. Confirming bookings

Available events:
${availableEvents.map(e => `- ${e.name} (ID: ${e.id}, Available: ${e.available_tickets} tickets, Price: $${e.price}, Date: ${e.date})`).join('\n')}

When a user wants to book tickets, extract:
- Event name or ID
- Number of tickets (default to 1 if not specified)
- Intent (greeting, show_events, book_tickets, confirm, other)

Respond with ONLY a valid JSON object in this exact format:
{
  "intent": "greeting" | "show_events" | "book_tickets" | "confirm" | "other",
  "event_name": "exact event name from list above or null",
  "event_id": number or null,
  "tickets": number or null,
  "message": "friendly response to user",
  "needs_confirmation": boolean
}

Rules:
- For greetings: intent="greeting", message with welcome
- For "show events" requests: intent="show_events", include events in message
- For booking requests: intent="book_tickets", extract event and ticket count, needs_confirmation=true
- If event not found in available list, set event_id=null and explain in message
- If unclear request, ask for clarification
- Be friendly and concise`;

    /* Call API */
     const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
       { role: "system", content: systemPrompt },
       { role: "user", content: message }
      ],
      max_tokens: 1024
     });

    /* Extract JSON from response */
    const responseText = response.choices[0].message.content;
    let parsedResponse;

    try {
      /* Try to parse the entire response as JSON */
      parsedResponse = JSON.parse(responseText);
    } catch (parseError) {
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || 
                       responseText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        console.error('Failed to parse LLM response:', responseText);
        return res.status(500).json({
          success: false,
          error: 'Could not parse booking intent. Please try rephrasing.',
          fallback: 'Try: "show events" or "book 2 tickets for [event name]"'
        });
      }
    }

    /* Validate the parsed response */
    if (!parsedResponse.intent) {
      return res.status(500).json({
        success: false,
        error: 'Invalid response format from LLM',
        fallback: 'Try: "show events" or "book tickets for [event name]"'
      });
    }

    /* Add available events to show_events */
    if (parsedResponse.intent === 'show_events') {
      parsedResponse.events = availableEvents;
    }

    /* Return structured response */
    res.status(200).json({
      success: true,
      ...parsedResponse
    });

  } catch (error) {
    console.error('Error in parseBookingIntent:', error);
    
    if (error.status === 401) {
      return res.status(500).json({
        success: false,
        error: 'Invalid API key configuration',
        fallback: 'Use keyword commands: "show events", "book tickets"'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to process your request. Please try again.',
      fallback: 'Try: "show events" or "book 2 tickets for [event name]"'
    });
  }
};

/* Keyword-based fallback for common commands */
const keywordFallback = async (message) => {
  const lowerMessage = message.toLowerCase().trim();
  const events = await llmModel.getAvailableEvents();

  /* Greeting patterns */
  if (/^(hi|hello|hey|greetings|good\s+(morning|afternoon|evening))/.test(lowerMessage)) {
    return {
      success: true,
      intent: 'greeting',
      message: 'Hello! Welcome to TigerTix. I can help you view available events and book tickets. Try saying "show events" to see what\'s available!',
      event_name: null,
      event_id: null,
      tickets: null,
      needs_confirmation: false
    };
  }

  /* Show events patterns */
  if (/(show|list|view|display|see|what).*(event|ticket|available)|(event|ticket).*(show|list|view|available)/i.test(lowerMessage)) {
    return {
      success: true,
      intent: 'show_events',
      message: 'Here are the available events:',
      events,
      event_name: null,
      event_id: null,
      tickets: null,
      needs_confirmation: false
    };
  }

  return null;
};

/* Confirm and execute booking */
const confirmBooking = async (req, res) => {
  try {
    const { event_id, tickets } = req.body;

    /* Validate input */
    if (!event_id || !tickets) {
      return res.status(400).json({
        success: false,
        error: 'event_id and tickets are required'
      });
    }

    const eventId = parseInt(event_id, 10);
    const ticketCount = parseInt(tickets, 10);

    if (isNaN(eventId) || isNaN(ticketCount) || ticketCount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid event_id or ticket count'
      });
    }

    /* Execute booking with transaction */
    const result = await llmModel.confirmBooking(eventId, ticketCount);

    res.status(200).json({
      success: true,
      message: `Successfully booked ${ticketCount} ticket(s) for ${result.event_name}!`,
      booking: result
    });

  } catch (error) {
    console.error('Error in confirmBooking:', error);

    if (error.message === 'Event not found') {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    if (error.message.includes('Not enough tickets')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to complete booking. Please try again.'
    });
  }
};

/* Get chat history/context */
const getAvailableEvents = async (req, res) => {
  try {
    const events = await llmModel.getAvailableEvents();
    
    res.status(200).json({
      success: true,
      count: events.length,
      events
    });
  } catch (error) {
    console.error('Error in getAvailableEvents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch events'
    });
  }
};

module.exports = {
  parseBookingIntent,
  confirmBooking,
  getAvailableEvents
};
