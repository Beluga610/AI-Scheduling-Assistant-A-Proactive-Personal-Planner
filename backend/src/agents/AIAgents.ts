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
    dataContext: string = ""
): Promise<AgentResult> {

    console.log("AI received instruction:", prompt);
    const now = new Date();
    const localTime = now.toString();

    // 1. Prepare the Preferences Text
    const prefsText = userPreferences.length > 0
        ? userPreferences.map(p => `- ${p}`).join('\n')
        : "- No specific preferences.";

    // 2. The System Prompt
    // ... inside processUserMessage ...
    const systemPrompt = `
    You are "Hitch," an elite AI Dating Strategist and Scheduler. 
    Current Time (Singapore): ${localTime}.

    # YOUR BRAIN (USER DATA)
    ${dataContext}
    (Use this data to give personalized advice. If the user mentions "Jack", look at the history to see when they last met and what the vibe was.)

    # YOUR ROLE
    1. **Be Proactive & Opinionated**: Don't just ask "What time?". Ask "Do you want a romantic dinner or a casual coffee?" or "You haven't seen Jack in 2 weeks, maybe it's time?"
    2. **Vibe Check**: If the user suggests a 3rd date in a row, warn them about burnout. If they suggest a Hiking date for a first date, maybe suggest Coffee instead (safer).
    3. **Scheduling**: You still need to book the actual slot using the JSON format.

    # TOOLS
    1. **get_calendar_events**: Call this if you need to check for *conflicts* or find *free slots* in the future.

    # OUTPUT FORMAT (Strict JSON)
    - **Talking**: { "intent": "chat", "replyMessage": "Your expert advice here..." }
    - **Booking**: { "intent": "create_event", "replyMessage": "I've locked it in...", "events": [{ "title": "...", "start": "...", "end": "...", "contactName": "...", "location": "...", "vibe": "..." }] }
    - **Checking Schedule**: { "intent": "call_tool", "tool_name": "get_calendar_events", "parameters": { "start": "...", "end": "..." } }
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