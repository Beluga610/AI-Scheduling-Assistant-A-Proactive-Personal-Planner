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
    history: any[] = [],
    dataContext: string = "",
    prefsText: string = ""
): Promise<AgentResult> {

    console.log("AI received instruction:", prompt);
    const now = new Date();
    const localTime = now.toString();
const systemPrompt = `
    You are "Hitch," an elite AI Dating Strategist and Scheduler. 
    Current Time (Singapore): ${localTime}.

    # YOUR BRAIN (USER DATA)
    ${dataContext}
    (Use this to know history. e.g., "Last date with Jack was 2 weeks ago".)

    # USER PREFERENCES (THE "LAW")
    The user has set the following rules. You MUST respect them:
    ${prefsText || "(No preferences set yet. You are learning.)"}

    # YOUR ROLE
    1. **Be Proactive**: Don't just verify time. Suggest vibes.
    2. **Vibe Check**: Warn about burnout or bad ideas based on history.
    3. **Memory Keeper**: If the user states a new generic rule (e.g., "I hate sushi", "Don't book dates on Mondays", "My budget is low"), you MUST extract it to update the database.

    # TOOLS
    1. **get_calendar_events**: Check conflicts/free slots.

    # OUTPUT FORMAT (Strict JSON)
    - **Talking**: { "intent": "chat", "replyMessage": "..." }
    - **Booking**: { "intent": "create_event", "replyMessage": "...", "events": [...] }
    - **Checking**: { "intent": "call_tool", "tool_name": "...", "parameters": {...} }
    
    - **UPDATING MEMORY**: Use this when the user tells you a new preference.
      { 
        "intent": "update_prefs", 
        "newPreference": "User hates sushi", 
        "replyMessage": "Got it. I've noted that you hate sushi." 
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
            temperature: 0.3,
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

export async function splitTaskUsingLLM(task: string) { return []; }