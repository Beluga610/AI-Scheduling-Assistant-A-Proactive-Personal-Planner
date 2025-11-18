// src/agents/AIAgents.ts
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.DEEPSEEK_API_KEY;

if (!apiKey) {
    console.error("❌ FATAL ERROR: DEEPSEEK_API_KEY not found! Check backend/.env file");
} else {
    console.log(`✅ DeepSeek API Key loaded: ${apiKey.substring(0, 5)}...`);
}

const client = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: apiKey || 'sk-invalid-key',
});

interface AgentResult {
    intent: 'chat' | 'create_event';
    replyMessage: string;
    eventData?: {
        title: string;
        start: Date;
        end: Date;
        allDay: boolean;
    };
}

export async function processUserMessage(prompt: string): Promise<AgentResult> {
    console.log("🤖 AI received instruction:", prompt);

    // 1. (FIX #1) Use .toString() to include the timezone
    const now = new Date();
    const localTime = now.toString(); // CRITICAL: This produces "Tue Nov 18 2025 00:05:35 GMT+0800 (Singapore Standard Time)"

    // 2. (FIX #2) Strengthen the system prompt with strict rules
    const systemPrompt = `
    You are an intelligent scheduling assistant. Your goal is to parse user input and return strict JSON.
    
    # Key Rules
    1.  The current time is: ${localTime}. Use this timezone (GMT+0800) as the baseline for all relative times (like "tomorrow").
    2.  If the user says "PM" (e.g., "3 PM"), use 12-hour addition (e.g., 15:00).
    3.  If the user says "evening" or "night" (e.g., "8 PM"), use 12-hour addition (e.g., 20:00).
    4.  If the user only provides a start time (e.g., "coffee at 3"), assume a default duration of 1 hour.
    5.  If the user's intent is to create a schedule, the intent must be 'create_event'.
    6.  All returned times (start and end) must be complete ISO 8601 strings including the timezone.
    7.  If a new event request conflicts with an existing one, you must first state the specific clash and ask the user for a resolution (e.g., reschedule, cancel, or overlap).

    # JSON Output Format (Must follow strictly)
    {
      "intent": "chat" | "create_event",
      "replyMessage": "A natural language confirmation for the user",
      "eventData": {
        "title": "Event Title",
        "start": "YYYY-MM-DDTHH:MM:SS+08:00",
        "end": "YYYY-MM-DDTHH:MM:SS+08:00",
        "allDay": false
      }
    }
  `;

    try {
        const completion = await client.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt }
            ],
            model: "deepseek-chat",
            temperature: 0.1,
            response_format: { type: "json_object" }
        });

        const content = completion.choices[0].message.content;
        if (!content) throw new Error("Empty response");

        // 3. (FIX #3) Add debug log to see the raw AI response
        console.log("🤖 AI Raw JSON Response:", content);

        const result = JSON.parse(content);

        if (result.intent === 'create_event' && result.eventData) {
            return {
                intent: 'create_event',
                replyMessage: result.replyMessage,
                eventData: {
                    title: result.eventData.title,
                    start: new Date(result.eventData.start), // Convert to Date object
                    end: new Date(result.eventData.end),     // Convert to Date object
                    allDay: result.eventData.allDay || false
                }
            };
        }

        return {
            intent: 'chat',
            replyMessage: result.replyMessage
        };

    } catch (error) {
        console.error("❌ LLM Call Failed:", error);
        return {
            intent: 'chat',
            replyMessage: "Sorry, I'm having trouble connecting to my brain. Please check the backend logs."
        };
    }
}

// Keep old interface for compatibility
export async function splitTaskUsingLLM(task: string) { return []; }