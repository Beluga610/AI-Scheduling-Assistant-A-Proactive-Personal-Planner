import { GraphQLError } from 'graphql';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import Task from './models/Task.js';
import CalendarEvent from './models/CalendarEvent.js';
import { processUserMessage, splitTaskUsingLLM } from './agents/AIAgents.js';

// Helper to format Mongoose documents for GraphQL response
const toGraphql = (doc: any) => {
    if (!doc) return null;
    const obj = doc.toObject ? doc.toObject() : doc;
    return {
        ...obj,
        id: obj._id ? obj._id.toString() : obj.id,
    };
};

// Middleware-like authentication check
const checkAuth = (context: any) => {
    if (!context.user) {
        throw new GraphQLError('You must be logged in to do that.', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }
    return context.user;
};

export const resolvers = {
    Query: {
        ping: () => 'pong',
        me: async (_: any, __: any, context: any) => {
            const user = checkAuth(context);
            const foundUser = await User.findById(user._id);
            return toGraphql(foundUser);
        },

        users: async () => {
            const users = await User.find({});
            return users.map(toGraphql);
        },

        userTasks: async (_: any, { userId }: { userId: string }) => {
            const tasks = await Task.find({ owner: userId });
            return tasks.map(toGraphql);
        },

        userCalendarEvents: async (_: any, { userId }: { userId: string }) => {
            const events = await CalendarEvent.find({ owner: userId });
            return events.map(toGraphql);
        },

        tasks: async (_: any, { ownerId }: { ownerId?: string }) => {
            const filter = ownerId ? { owner: ownerId } : {};
            const tasks = await Task.find(filter);
            return tasks.map(toGraphql);
        },

        events: async (_: any, { ownerId }: { ownerId?: string }) => {
            const filter = ownerId ? { owner: ownerId } : {};
            const events = await CalendarEvent.find(filter);
            return events.map(toGraphql);
        }
    },

    Mutation: {
        register: async (_: any, { input }: any) => {
            const { name, email, password } = input;
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                throw new GraphQLError('User already exists', { extensions: { code: 'BAD_USER_INPUT' } });
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = new User({ name, email, password: hashedPassword });
            const res = await newUser.save();
            const token = jwt.sign({ userId: res._id.toString(), email: res.email }, process.env.JWT_SECRET || 'mysecretkey123', { expiresIn: '30d' });
            return { token, user: toGraphql(res) };
        },

        login: async (_: any, { input }: any) => {
            const { email, name } = input;
            const user = await User.findOne({ email });
            if (!user) {
                throw new GraphQLError("User not found", { extensions: { code: "BAD_USER_INPUT" } });
            }
            const token = jwt.sign({ userId: user._id.toString(), email: user.email }, process.env.JWT_SECRET || "mysecretkey123", { expiresIn: "30d" });
            return { token, user: toGraphql(user) };
        },

        updatePreferences: async (_: any, { preferences }: { preferences: string[] }, context: any) => {
            const user = checkAuth(context);
            const updatedUser = await User.findByIdAndUpdate(
                user._id,
                { preferences },
                { new: true }
            );
            return toGraphql(updatedUser);
        },

        createTask: async (_: any, { input }: any, context: any) => {
            const user = checkAuth(context);
            const newTask = new Task({ ...input, status: 'TODO', owner: user._id });
            const res = await newTask.save();
            return toGraphql(res);
        },

        createEvent: async (_: any, args: any, context: any) => {
            const user = checkAuth(context);
            const event = new CalendarEvent({ ...args, owner: user._id });
            const saved = await event.save();
            return toGraphql(saved);
        },

        updateEvent: async (_: any, args: any, context: any) => {
            const user = checkAuth(context);
            const { id, ...updates } = args;
            const ev = await CalendarEvent.findById(id);
            if (!ev) throw new Error("Event not found");
            if (ev.owner.toString() !== user._id) throw new Error("Not authorized");
            Object.assign(ev, updates);
            const saved = await ev.save();
            return toGraphql(saved);
        },

        deleteEvent: async (_: any, { id }: any, context: any) => {
            const user = checkAuth(context);
            const ev = await CalendarEvent.findById(id);
            if (!ev) throw new Error("Event not found");
            if (ev.owner.toString() !== user._id) throw new Error("Not authorized");
            await CalendarEvent.findByIdAndDelete(id);
            return true;
        },

        splitTask: async (_: any, { prompt }: { prompt: string }, context: any) => {
            const user = checkAuth(context);
            const tasksFromLLM = await splitTaskUsingLLM(prompt);
            return [];
        },

        syncTaskToCalendar: async (_: any, { taskId }: { taskId: string }, context: any) => {
            return null;
        },
        
        /**
         * Main Integration Hub: Chat with AI
         * * This resolver acts as the bridge between:
         * 1. Frontend Chat UI (input prompt)
         * 2. Database (fetching user context, history, and preferences)
         * 3. AI Agent Service (logic processing)
         * 4. Calendar Tools (executing scheduling actions)
         */
        chatWithAI: async (_: any, { prompt, history }: { prompt: string, history: any[] }, context: any) => {
            const userCtx = checkAuth(context);
            console.log("DEBUG: 1. ChatWithAI called");
            const user = await User.findById(userCtx._id);
            if (!user) throw new Error("User not found");
            // 1. Prepare User Preferences
            // Fetches dynamic preferences stored in DB to personalize the AI persona.
            if (!user.preferences) user.preferences = [];
            const prefsString = user.preferences.length > 0 
                ? user.preferences.map((p: string) => `- ${p}`).join('\n')
                : "No specific preferences.";
            console.log("DEBUG: 2. Current Prefs:", prefsString);
            
            // 2. Prepare Contextual Memory
            // Fetches recent calendar events (past 30 days, future 7 days) to give the AI "memory" of the user's life.
            const conversationHistory = history || [];
            
            const today = new Date();
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(today.getDate() - 30);
            const sevenDaysLater = new Date(today);
            sevenDaysLater.setDate(today.getDate() + 7);

            const recentEvents = await CalendarEvent.find({
                owner: user._id,
                start: { $gte: thirtyDaysAgo, $lte: sevenDaysLater }
            }).sort({ start: 1 }); 
            
            let memoryString = "Here is the user's recent dating history:\n";
            if (recentEvents.length === 0) {
                memoryString += "(No recent dates found. User is single or new.)\n";
            } else {
                recentEvents.forEach(evt => {
                    const dateStr = new Date(evt.start).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                    const isPast = new Date(evt.end) < today;
                    const status = isPast ? "[PAST]" : "[UPCOMING]";
                    if (evt.contactName || evt.vibe) {
                         memoryString += `- ${status} ${dateStr}: "${evt.title}" with ${evt.contactName || 'Unknown'} @ ${evt.location || 'TBD'} (${evt.vibe || 'General'})\n`;
                    }
                });
            }
            memoryString += "\nUse this history to give context-aware advice. Do NOT list these events unless asked.";
            
            // 3. Invoke AI Agent
            // Passes the constructed context to the AI service.
            let aiResponse = await processUserMessage(prompt, conversationHistory, memoryString, prefsString);
            
            // Store interaction in transient history for the current session
            conversationHistory.push({ role: "user", content: prompt });
            conversationHistory.push({ role: "assistant", content: JSON.stringify(aiResponse) });

            // 4. Handle AI Intents
            // Case A: AI detects a new user preference -> Update DB
            if (aiResponse.intent === 'update_prefs' && aiResponse.newPreferences) {
                if (user) {
                    if (!Array.isArray(user.preferences)) {
                        user.preferences = [];
                    }
                    for (const pref of aiResponse.newPreferences) {
                        if (!user.preferences.includes(pref)) {
                            user.preferences.push(pref);
                        }
                    }
                    user.markModified('preferences');
                    await user.save();
                }
            }
            // Case B: AI needs to check calendar availability (Tool Call)
            if (aiResponse.intent === 'call_tool' && aiResponse.tool_name === 'get_calendar_events') {
                console.log(`AI is calling tool: ${aiResponse.tool_name}`);
                const events = await CalendarEvent.find({
                    owner: userCtx._id,
                    start: { $gte: new Date() }
                });
                console.log(`🔍 Resolver found ${events.length} future events.`);

                // Format dates to Human-Readable Singapore Time for the AI to understand
                const readableSchedule = events.map(e => {
                    const startStr = new Date(e.start).toLocaleString('en-US', {
                        timeZone: 'Asia/Singapore',
                        weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false
                    });
                    const endStr = new Date(e.end).toLocaleString('en-US', {
                        timeZone: 'Asia/Singapore',
                        hour: '2-digit', minute: '2-digit', hour12: false
                    });
                    return `- Busy: "${e.title}" from [${startStr}] to [${endStr}]`;
                }).join("\n");
                // Re-prompt the AI with the tool output
                const toolResponseMessage = {
                    role: "user",
                    content: `Here is the user's existing schedule (in Singapore Time):\n${readableSchedule}\n\nPlease analyze this schedule to find free slots. DO NOT overlap with these times.`
                };
                conversationHistory.push(toolResponseMessage);

                // Recursive call to process the tool output
                aiResponse = await processUserMessage(toolResponseMessage.content, conversationHistory, memoryString, prefsString);
            }

            // Case C: AI wants to book a meeting (Create Event)
            let finalMessage = aiResponse.replyMessage;
            if (aiResponse.intent === 'create_event' && aiResponse.events && aiResponse.events.length > 0) {
                console.log(`AI wants to create ${aiResponse.events.length} event(s)`);
                for (const event of aiResponse.events) {
                    // Conflict Detection (Double-check before writing to DB)
                    const proposedStart = new Date(event.start);
                    const proposedEnd = new Date(event.end);
                    const conflictingEvent = await CalendarEvent.findOne({
                        owner: userCtx._id,
                        $or: [
                            { start: { $lt: proposedEnd, $gte: proposedStart } },
                            { end: { $gt: proposedStart, $lte: proposedEnd } },
                            { start: { $lte: proposedStart }, end: { $gte: proposedEnd } }
                        ]
                    });
                    if (conflictingEvent) {
                        finalMessage = `Sorry, I couldn't schedule "${event.title}" because it conflicts with your existing event: "${conflictingEvent.title}".`;
                        break;
                    } else {
                        const newEvent = new CalendarEvent({ ...event, owner: userCtx._id });
                        await newEvent.save();
                        console.log(`AI created event: ${newEvent.title}`);
                    }
                }
            }
            // Return latest state to Frontend for real-time UI update
            const latestEvents = await CalendarEvent.find({ owner: userCtx._id });
            return {
                message: finalMessage,
                latestEvents: latestEvents.map(toGraphql)
            };
        },
    },

    User: {
        preferences: (parent: any) => {
            return parent.preferences || [];
        },
        tasks: async (parent: any) => {
            const tasks = await Task.find({ owner: parent.id || parent._id });
            return tasks.map(toGraphql);
        },
        calendarEvents: async (parent: any) => {
            const events = await CalendarEvent.find({ owner: parent.id || parent._id });
            return events.map(toGraphql);
        }
    },
    Task: {
        owner: async (parent: any) => {
            const user = await User.findById(parent.owner);
            return toGraphql(user);
        }
    },
    CalendarEvent: {
        sourceTask: async (parent: any) => {
            if (!parent.sourceTask) return null;
            const task = await Task.findById(parent.sourceTask);
            return toGraphql(task);
        }
    }
};