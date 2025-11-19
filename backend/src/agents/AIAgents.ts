// src/agents/AIAgents.ts
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();
const apiKey = process.env.DEEPSEEK_API_KEY;
if (!apiKey) { console.error("FATAL: DEEPSEEK_API_KEY not found!"); }
const client = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: apiKey || 'sk-invalid-key',
});

interface AgentResult {
    intent: 'chat' | 'create_event' | 'call_tool';
    replyMessage: string;
    events?: {
        title: string;
        start: Date;
        end: Date;
        allDay: boolean;
    }[];
    tool_name?: string; 
    parameters?: any; 
}
export async function processUserMessage(
    prompt: string,
    history: any[] = []
): Promise<AgentResult> {

    console.log("AI received instruction:", prompt);
    const now = new Date();
    const localTime = now.toString();

    const systemPrompt = `
    You are an intelligent scheduling assistant. Your goal is to parse user input and return strict JSON.
    Current time is: ${localTime}.

    # TOOLS
    You have one tool:
    1.  **get_calendar_events**:
        -   Description: Fetches the user's existing calendar events to find free time.
        -   When to use: Call this BEFORE suggesting a time if the user's request is vague (e.g., "schedule dinner," "find a time").
        -   Parameters: { "start": "ISO8601_string", "end": "ISO8601_string" } (e.g., for the next 7 days).
    
    # BEHAVIOR RULES
    0.  **CRITICAL: CONFLICT CHECK**
        -   When you receive data from 'get_calendar_events', you MUST look at the 'start' and 'end' of every existing event.
        -   **Do NOT** suggest a time that overlaps with an existing event.
        -   Example: If an event exists from 18:00 to 20:00, you CANNOT suggest 19:00. You must suggest 20:00 or later.
        -   If the user asks for "evening" but 7 PM is taken, look for 8 PM or 9 PM.

    1.  **Suggesting Times:**When you find free slots after calling 'get_calendar_events', do NOT write a paragraph. You MUST present them as a numbered list in 'replyMessage'.
        Example Format:
        "I found these free slots for [Activity]:\n
        1. Tuesday 19th at 7:00 PM\n
        2. Wednesday 20th at 8:00 PM\n
        Please reply with the number (e.g., '1') to book."

    2.  **Booking by Number:** If the user replies with a number (e.g., "1", "2", "option 1"), you MUST:
        - Look at the *previous* assistant message in the history to see what "Option 1" was.
        - Generate the 'create_event' JSON for that specific time.

    3.  **Time Handling:**
        - Use the current time (${localTime}) as the baseline.
        - If the user says "PM", use 12-hour addition.
        - All JSON times must be ISO 8601 strings including the timezone.

    # OUTPUT FORMAT
    -   If you need to call a tool, return ONLY JSON:
        { "intent": "call_tool", "tool_name": "get_calendar_events", "parameters": { "start": "...", "end": "..." } }
    -   If you have received tool results, return a final JSON:
        { "intent": "chat", "replyMessage": "...", "events": [...] }
    - If you have enough information to book, return:
      { 
        "intent": "create_event", 
        "replyMessage": "I've scheduled the date...", 
        "events": [
          {
            "title": "String (e.g. 'Dinner with Jack')",
            "start": "ISO8601",
            "end": "ISO8601",
            "allDay": false,
            "contactName": "String (Extracted Name)",
            "location": "String (Optional)",  
            "vibe": "String (Optional)"          
          }
        ]
      }
  `;

    const messages: any[] = [
        { role: "system", content: systemPrompt }
    ];
    messages.push(...history);
    messages.push({ role: "user", content: prompt });

    try {
        const completion = await client.chat.completions.create({
            messages: messages,
            model: "deepseek-chat",
            temperature: 0.1,
            response_format: { type: "json_object" }
        });

        const content = completion.choices[0].message.content;
        if (!content) throw new Error("Empty response");

        console.log("AI Raw JSON Response:", content);
        const result = JSON.parse(content);

        if (result.intent === 'call_tool') {
            return {
                intent: 'call_tool',
                replyMessage: "AI is requesting data...",
                tool_name: result.tool_name,
                parameters: result.parameters,
            };
        }

        if (result.intent === 'create_event' && result.events && Array.isArray(result.events)) {
            return {
                intent: 'create_event',
                replyMessage: result.replyMessage,
                events: result.events.map((e: any) => ({
                    title: e.title,
                    start: new Date(e.start),
                    end: new Date(e.end),
                    allDay: e.allDay || false,
                    contactName: e.contactName || null,
                    location: e.location || null,
                    vibe: e.vibe || "General"
                }))
            };
        }
        return {
            intent: 'chat',
            replyMessage: result.replyMessage
        };

    } catch (error) {
        console.error("LLM Call Failed:", error);
        return {
            intent: 'chat',
            replyMessage: "Sorry, I'm busy with another guy who need more help. I will come back to you later."
        };
    }
}

// Keep old interface for compatibility
export async function splitTaskUsingLLM(task: string) { return []; }