import { GraphQLError } from 'graphql';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import Task from './models/Task.js';
import CalendarEvent from './models/CalendarEvent.js';
import { splitTaskUsingLLM } from './agents/AIAgents.js';

// --- 1. DTO Helper (The "Bridge") ---
// This converts raw Mongoose documents into clean GraphQL objects.
// It solves the "Cannot return null for id" error permanently.
const toGraphql = (doc: any) => {
    if (!doc) return null;

    // Convert Mongoose Document to Plain JavaScript Object
    const obj = doc.toObject ? doc.toObject() : doc;

    // Replace _id with id
    return {
        ...obj,
        id: obj._id ? obj._id.toString() : obj.id, // Handle both cases safely
    };
};

// --- 2. Auth Helper ---
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
        // --- Health Check ---
        ping: () => 'pong',

        // --- User Queries ---
        me: async (_: any, __: any, context: any) => {
            const user = checkAuth(context);
            const foundUser = await User.findById(user._id);
            return toGraphql(foundUser);
        },

        users: async () => {
            const users = await User.find({});
            return users.map(toGraphql); 
        },

        // --- Data Queries ---
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
        // --- AUTHENTICATION ---
        register: async (_: any, { input }: any) => {
            const { name, email, password } = input;

            const existingUser = await User.findOne({ email });
            if (existingUser) {
                throw new GraphQLError('User already exists with this email', {
                    extensions: { code: 'BAD_USER_INPUT' },
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const newUser = new User({
                name,
                email,
                password: hashedPassword
            });
            const res = await newUser.save();

            const token = jwt.sign(
                { userId: res._id.toString(), email: res.email },
                process.env.JWT_SECRET || 'mysecretkey123',
                { expiresIn: '2h' }
            );

            // Use helper for consistency
            return {
                token,
                user: toGraphql(res)
            };
        },

        login: async (_: any, { input }: any) => {
        const { email, name } = input;

        const user = await User.findOne({ email });
        if (!user) {
            throw new GraphQLError("User not found", {
            extensions: { code: "BAD_USER_INPUT" },
            });
        }

        if (name && user.name !== name) {
            throw new GraphQLError("Name and email do not match", {
            extensions: { code: "BAD_USER_INPUT" },
            });
        }

        //
        const token = jwt.sign(
            { userId: user._id.toString(), email: user.email },
            process.env.JWT_SECRET || "mysecretkey123",
            { expiresIn: "2h" }
        );

        return {
            token,
            user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            },
        };
        },


        // --- CORE FEATURES ---
        createTask: async (_: any, { input }: any, context: any) => {
            const user = checkAuth(context);

            const newTask = new Task({
                ...input,
                status: 'TODO',
                owner: user._id
            });
            const res = await newTask.save();
            return toGraphql(res);
        },

        splitTask: async (_: any, { prompt }: { prompt: string }, context: any) => {
            const user = checkAuth(context);
            console.log(`splitTask: Processing for user ${user._id}`);

            // 1. Call AI Logic
            const tasksFromLLM = await splitTaskUsingLLM(prompt);

            // 2. Save all to DB
            const savedTasks = await Promise.all(
                tasksFromLLM.map(async (taskData) => {
                    const task = new Task({
                        ...taskData,
                        status: 'TODO',
                        owner: user._id
                    });
                    const saved = await task.save();
                    return toGraphql(saved); // 👈 Map each one individually
                })
            );

            return savedTasks;
        },

        syncTaskToCalendar: async (_: any, { taskId }: { taskId: string }, context: any) => {
            const user = checkAuth(context);

            // 1. Fetch Task
            const task = await Task.findById(taskId);
            if (!task) throw new Error('Task not found');
            if (task.owner.toString() !== user.id) throw new Error('Not authorized');

            // 2. Create Mock Event (Placeholder for Google Sync)
            const mockEventData = {
                title: task.title,
                start: task.dueDate || new Date(),
                end: task.dueDate || new Date(Date.now() + 3600 * 1000), // 1 hour duration
                allDay: false,
                sourceTask: task.id,
                owner: user._id
            };

            // 3. Save Event
            const calendarEvent = new CalendarEvent(mockEventData);
            const res = await calendarEvent.save();
            return toGraphql(res);
        }
    },

    // --- FIELD RESOLVERS (Relationships) ---
    User: {
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