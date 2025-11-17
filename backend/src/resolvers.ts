import { GraphQLError } from 'graphql';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import Task from './models/Task.js';
import CalendarEvent from './models/CalendarEvent.js';
import { splitTaskUsingLLM, processUserMessage } from './agents/AIAgents.js';

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
                tasksFromLLM.map(async (taskData: any) => {
                    const task = new Task({
                        ...(taskData as Record<string, any>),
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
            if (task.owner.toString() !== user._id) throw new Error('Not authorized');

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
        },

        // -----------------
        // 日历事件 CRUD
        // -----------------

        createEvent: async (_: any, args: any, context: any) => {
            const user = checkAuth(context);

            const event = new CalendarEvent({
                title: args.title,
                start: args.start,
                end: args.end,
                allDay: args.allDay || false,
                owner: user._id,
            });

            const saved = await event.save();
            return toGraphql(saved);
        },

        updateEvent: async (_: any, args: any, context: any) => {
            const user = checkAuth(context);

            const { id, ...updates } = args;
            const ev = await CalendarEvent.findById(id);

            if (!ev) throw new Error("Event not found");
            if (ev.owner.toString() !== user._id)
                throw new Error("Not authorized");

            Object.assign(ev, updates);

            const saved = await ev.save();
            return toGraphql(saved);
        },

        deleteEvent: async (_: any, { id }: any, context: any) => {
            const user = checkAuth(context);

            const ev = await CalendarEvent.findById(id);
            if (!ev) throw new Error("Event not found");
            if (ev.owner.toString() !== user._id)
                throw new Error("Not authorized");

            await CalendarEvent.findByIdAndDelete(id);
            return true;
        },

        // 2. 新增：实现 chatWithAI Resolver
        chatWithAI: async (_: any, { prompt }: { prompt: string }, context: any) => {
            // A. 鉴权：确保只有登录用户能调用
            const user = checkAuth(context);

            // B. 调用 AI Agent 分析意图
            const { intent, eventData, replyMessage } = await processUserMessage(prompt);

            // C. 如果 AI 决定创建日程，则写入数据库
            if (intent === 'create_event' && eventData) {
                const newEvent = new CalendarEvent({
                    ...eventData,
                    owner: user._id // 关键：绑定给当前登录的用户
                });
                await newEvent.save();
                console.log(`✅ AI 为用户 ${user.name} 自动创建了日程:`, newEvent.title);
            }

            // D. 获取该用户最新的所有日程 (为了让前端日历自动刷新)
            // 这一步很关键，实现了“聊天 -> 自动更新日历”的闭环
            const latestEvents = await CalendarEvent.find({ owner: user._id });
            
            // 🔥 [新增日志] 打印查到的数据，确认是否包含新日程，并检查时区
            console.log(`📤 [后端] 准备返回 ${latestEvents.length} 个事件给前端`);
            if (latestEvents.length > 0) {
                // 打印最后一个事件（通常是最新创建的），看看它的 start 时间
                const lastEvent = latestEvents[latestEvents.length - 1];
                console.log(`🕒 [后端] 最新事件: "${lastEvent.title}"`);
                console.log(`   开始时间 (DB原始值): ${lastEvent.start}`);
            }

            // E. 返回符合 Schema 定义的数据
            return {
                message: replyMessage,
                latestEvents: latestEvents.map(toGraphql) // 别忘了用 toGraphql 转换格式
            };
        },
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