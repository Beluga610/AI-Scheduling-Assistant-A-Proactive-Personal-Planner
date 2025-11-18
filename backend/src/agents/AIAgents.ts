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
    }[];
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
    1.  The current time is: ${localTime}. Use this timezone (GMT+0800) as the baseline.
    2.  If the user says "PM" (e.g., "3 PM"), use 12-hour addition (e.g., 15:00).
    3.  If the user provides multiple tasks, create multiple event objects.
    4.  If the user only provides a start time, assume a default duration of 1 hour.
    5.  If the intent involves scheduling, set intent to 'create_event'.
    6.  All times must be ISO 8601 strings including the timezone.

    # JSON Output Format (Must follow strictly)
    {
      "intent": "chat" | "create_event",
      "replyMessage": "A natural language confirmation summarizing what was scheduled",
      "events": [
        {
          "title": "Event 1 Title",
          "start": "YYYY-MM-DDTHH:MM:SS+08:00",
          "end": "YYYY-MM-DDTHH:MM:SS+08:00",
          "allDay": false
        },
        {
          "title": "Event 2 Title",
          "start": "...",
          "end": "...",
          "allDay": false
        }
      ]
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

        if (result.intent === 'create_event' && result.events && Array.isArray(result.events)) {
            return {
                intent: 'create_event',
                replyMessage: result.replyMessage,
                events: result.events.map((e: any) => ({
                    title: e.title,
                    start: new Date(e.start),
                    end: new Date(e.end),
                    allDay: e.allDay || false
                }))
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