import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.DEEPSEEK_API_KEY;

if (!apiKey) {
    console.error("❌ FATAL: DEEPSEEK_API_KEY not found! Check backend/.env file");
} else {
    console.log(`✅ DeepSeek API Key loaded: ${apiKey.substring(0, 5)}...`);
}

const client = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: apiKey || 'sk-invalid-key',
});

interface AgentResult {
    intent: 'chat' | 'create_event' | 'call_tool' | 'update_prefs';
    replyMessage: string;
    events?: {
        title: string;
        start: Date;
        end: Date;
        allDay: boolean;
        contactName?: string;
        location?: string;
        vibe?: string;
    }[];
    tool_name?: string; 
    parameters?: any; 
    newPreferences?: string[];
}
/**
 * Core AI orchestration function.
 * * This function acts as the brain of the application:
 * 1. Injects temporal context (Current Time) and User Preferences into the System Prompt.
 * 2. Sends the conversation history to the LLM (DeepSeek).
 * 3. Enforces JSON output format to strictly categorize user intent (Chat, Create Event, Tool Call, etc.).
 * * @param prompt - The latest user message.
 * @param history - Conversation history for context awareness.
 * @param dataContext - Relevant calendar data (e.g., free slots).
 * @param prefsText - User's hard constraints/preferences.
 */
export async function processUserMessage(
    prompt: string,
    history: any[] = [],
    dataContext: string = "",
    prefsText: string = ""
): Promise<AgentResult> {

    console.log("🤖 AI received instruction:", prompt);

    const now = new Date();
    const localTime = now.toString();

    // System Prompt engineering:
    // We explicitly define "Filters" in the prompt to force the LLM to perform
    // internal logic checks (Date validity, Preference conflicts) before outputting.
    const systemPrompt = `
    You are "Hitch," an elite AI Dating Strategist and Scheduler.
    Current Time (Singapore): ${localTime}.

    # 1. BRAIN CONTEXT & DATA
    - Current Time & Reference Date: ${localTime}. (Today is Thursday, November 20, 2025).
    - Data Context (Current Calendar): ${dataContext}
    - "This Week": Starts Monday (Nov 17) and ENDS Sunday (Nov 23).
    - "Workdays": Monday, Tuesday, Wednesday, Thursday, Friday.
    - "Weekend": Saturday, Sunday.

    # 2. USER PREFERENCES (THE LAW & MEMORY)
    The user has set the following rules. You MUST respect them:
    ${prefsText}
    
    # 3. YOUR ROLE & TONE
    - **Tone:** Friendly, concise, and professional. Get straight to the point.
    - **Memory Keeper**: If the user states NEW preferences, extract them as **ATOMIC, SHORT rules** (e.g., ["User hates sushi"]).
    - **Scheduling**: Use JSON to book slots.

    # 4. TOOLS (ACTION & DATA GATHERING)
    1. **get_calendar_events**: Check conflicts/free slots. Parameters: { "start": "ISO8601", "end": "ISO8601" }

    # 5. OUTPUT FORMATS
    - **Talking**: { "intent": "chat", "replyMessage": "..." }
    - **Checking**: { "intent": "call_tool", "tool_name": "get_calendar_events", "parameters": {...} }
    - **Booking**: { "intent": "create_event", "replyMessage": "...", "events": [...] }
    - **UPDATING MEMORY (CRITICAL)**: Use this ONLY if the user states a new permanent preference:
      { "intent": "update_prefs", "newPreferences": [ "Rule 1", "Rule 2" ], "replyMessage": "Got it. Noted your new rules." }
    
    # 6. DECISION LOGIC (STRICT FILTERING PIPELINE)
    Perform these checks INTERNALLY. Do NOT output your internal reasoning or rejected slots.

    **FILTER 0: EXPLICIT OVERRIDE CHECK (INSISTENCE)**
    - If the user's current prompt contains keywords like "insist," "still want to," or "go ahead," proceed to calculating the compromise slot and booking it immediately (intent: 'create_event'). Skip all subsequent filtering steps.

    **FILTER 1: TEMPORAL VALIDITY (Past/Future)**
        - DISCARD any time slot that is BEFORE the 'Current Time' timestamp.
        
    **FILTER 2: CALENDAR CONFLICTS (Busy/Free)**
        - DISCARD any time slot that OVERLAPS with any existing event.

    **FILTER 3: USER PREFERENCES**
    - Check every potential slot against the User Preferences rules!!!
    If any slot violates a rule in # 2. USER PREFERENCES (THE LAW & MEMORY) , you MUST remove it from the suggestion list; only perfectly compliant slots may be presented.
    - **Example:** If "No dinner if there are meetings later" is set, and there is a meeting at 8 PM, suggesting dinner at 6 PM is FORBIDDEN. 

    **FINAL OUTPUT ACTION**
        - Collect ALL slots that survive all three filters.
        - If no valid slots remain, state clearly that no suitable time could be found.


    **FINAL OUTPUT FORMATTING:**
    - If suggesting slots, you MUST present them as a **NUMBERED LIST** in the 'replyMessage'.
    - **ACTION RULE (CRITICAL ADDITION):** If you suggest a numbered list, you MUST use the **'chat'** intent. Only use the **'create_event'** intent if the user's current prompt is a direct numerical selection (e.g., '1', '2') or contains insistence keywords. 👈 NEW LINE
    - Example: "I found these slots:\n1. Friday, November 21st at 6:00 PM"
    - If no valid slots remain, state clearly that no suitable time could be found.
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
            temperature: 0.1, // Keep low for logic
            response_format: { type: "json_object" }
        });

        const content = completion.choices[0].message.content;
        if (!content) throw new Error("Empty response");
        console.log("🤖 AI Raw JSON Response:", content);
        const result = JSON.parse(content);

        if (result.intent === 'update_prefs') {
            return {
                intent: 'update_prefs',
                replyMessage: result.replyMessage,
                newPreferences: Array.isArray(result.newPreferences) 
                    ? result.newPreferences 
                    : [result.newPreference || result.newPreferences]
            };
        }

        // Intent Routing:
        // Based on the parsed JSON, we route the execution flow to different handlers.
        if (result.intent === 'call_tool') {
            return {
                intent: 'call_tool',
                replyMessage: "Checking calendar...",
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
        // Fallback mechanism for robustnesss
        return {
            intent: 'chat',
            replyMessage: "Sorry, I'm busy with another guy who need more help. I will come back to you later."
        };
    }
}

// Keep old interface
export async function splitTaskUsingLLM(task: string) { return []; }