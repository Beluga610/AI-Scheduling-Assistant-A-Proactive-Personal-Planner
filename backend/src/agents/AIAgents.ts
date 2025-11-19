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
    history: any[] = [],
    userPreferences: string[] = []
): Promise<AgentResult> {

    console.log("🤖 AI received instruction:", prompt);

    const now = new Date();
    const localTime = now.toString();

    // 1. Prepare the Preferences Text
    const prefsText = userPreferences.length > 0
        ? userPreferences.map(p => `- ${p}`).join('\n')
        : "- No specific preferences.";

    // 2. The System Prompt
    // ... inside processUserMessage ...
    const systemPrompt = `
    You are an intelligent scheduling assistant. Your goal is to parse user input and return strict JSON.
    Current time is: ${localTime}. (Today is Wednesday, November 19, 2025, 13:36)

    # 1. USER PREFERENCES (THE "LAW")
    The user has set the following rules. You MUST respect them when suggesting times:
    ${prefsText}

    # 2. DATE & RANGE DEFINITIONS (CRITICAL)
    - "This Week": The period starts Monday (Nov 17) and ENDS Sunday (Nov 23).
    - When asked for "this week" or "this Monday through Friday," DO NOT suggest any dates after Sunday, Nov 23rd.
    - "Workdays": Monday, Tuesday, Wednesday, Thursday, Friday.
    - "Weekend": Saturday, Sunday.

    # 3. TONE AND STYLE (CRITICAL FOR UX)
    - Your language must be friendly, concise, and easy to read.
    - NEVER write overly formal language. Get straight to the point.
    - If you are suggesting available time slots, you MUST present them as a **NUMBERED LIST** in the 'replyMessage'.
    - Example: 
      "I found these slots:
      1. Friday, November 21st at 6:00 PM"

    # 4. TOOLS
    You have one tool: 'get_calendar_events'. Parameters: { "start": "ISO8601", "end": "ISO8601" }

    # 5. DECISION LOGIC (STRICT FILTERING PIPELINE)
    Perform these checks INTERNALLY. Do NOT output your internal reasoning or rejected slots.

    **FILTER 0: EXPLICIT OVERRIDE CHECK (INSISTENCE)**
    if the user is DIRECTLY confirming a time YOU previously rejected:
    - Temporarily **DISABLE FILTER 3 (USER PREFERENCES)** for this single turn.
    - You MUST still obey FILTER 1 (Temporal Validity) and FILTER 2 (Calendar Conflicts).
    - If you are forcing an event, ensure the 'replyMessage' confirms that the preference rule was bypassed.

    **FILTER 1: TEMPORAL VALIDITY (Past/Future)**
    - DISCARD any time slot that is BEFORE the 'Current time is:' timestamp.
    - For the event requested (e.g., Dinner), the *entire* duration must be in the future. **Monday and Tuesday are in the past and MUST be discarded.**

    **FILTER 2: CALENDAR CONFLICTS (Busy/Free)**
    - The tool output returns **BUSY** times. You must infer the **FREE** times.
    - DISCARD any time slot that **OVERLAPS** with any existing event returned by 'get_calendar_events'.
    - If a day (e.g., Friday) is NOT listed in the calendar output, it is **COMPLETELY FREE**.

    **FILTER 3: USER PREFERENCES (The Anti-Pattern)**
    - Apply the specific rules from Section #1.
    - **Anti-Pattern:** If "No dinner before meetings" is set, and there is a meeting at 8 PM, suggesting dinner at 6 PM is FORBIDDEN. DISCARD it.

    **FINAL OUTPUT:**
    - Collect ALL slots that survive all three filters.
    - If no valid slots remain, state clearly that no suitable time could be found.

    # OUTPUT FORMAT
    - Tool Call: { "intent": "call_tool", "tool_name": "get_calendar_events", "parameters": { ... } }
    - Final Answer: { "intent": "chat" | "create_event", "replyMessage": "...", "events": [...] }
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

        if (result.intent === 'call_tool') {
            return {
                intent: 'call_tool',
                replyMessage: "Checking calendar...",
                tool_name: result.tool_name,
                parameters: result.parameters,
            };
        }

        if (result.intent === 'create_event' && result.events) {
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
        return { intent: 'chat', replyMessage: "Error processing request." };
    }
}

// Keep old interface
export async function splitTaskUsingLLM(task: string) { return []; }