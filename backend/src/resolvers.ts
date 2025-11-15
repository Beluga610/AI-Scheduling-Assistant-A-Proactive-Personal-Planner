import { IResolvers } from "apollo-server-express";
import User from "./models/User";
import Task from "./models/Task";
import CalendarEvent from "./models/CalendarEvent";
import { splitTaskUsingLLM } from "./agents/AIAgents";

// 假设的上下文类型和模拟函数/常量，为了让代码完整
interface Context {
    user?: { _id: string; email: string };
}
const MOCK_USER_ID = "u-mock";
const MOCK_USER_EMAIL = "mock@example.com";
const createJWT = (id: string) => `mock-jwt-for-${id}`;
const splitTaskWithLLM = async (prompt: string) => {
    console.log(`调用 LLM 分析: ${prompt}`);
    return [
        { title: `拆分任务1 (来自: ${prompt})`, description: "LLM生成" },
        { title: `拆分任务2 (来自: ${prompt})`, description: "LLM生成" },
    ];
};

export const resolvers: IResolvers = {
    Query: {
        ping: () => {
            return "pong"; // simple health check
        },
        users: async () => {
            try {
                const users = await User.find().limit(10).lean().exec();
                if (users && users.length > 0) return users;
                return [{ _id: "u1", name: "Alice", email: "alice@example.com" }];
            } catch (err) {
                console.error("Failed to fetch users:", err);
                return [{ _id: "u1", name: "Alice", email: "alice@example.com" }];
            }
        },
        tasks: async (_parent, { ownerId }) => {
            // TODO: implement proper filter by ownerId
            // return mock tasks so frontend can render
            const fromDb = await Task.find(ownerId ? { owner: ownerId } : {})
                .limit(10)
                .lean()
                .exec()
                .catch(() => null);
            if (fromDb && fromDb.length) return fromDb;
            return [
                {
                    id: "t1",
                    title: "Write project spec",
                    description: "Draft first version",
                    owner: {
                        id: "u1",
                        name: "Alice",
                        email: "alice@example.com",
                    },
                },
            ];
        },
        events: async (_p, { ownerId }) => {
            // TODO: implement owner filter and real calendar provider integration
            const fromDb = await CalendarEvent.find()
                .limit(10)
                .lean()
                .exec()
                .catch(() => null);
            if (fromDb && fromDb.length) return fromDb;
            return [
                {
                    id: "e1",
                    title: "Mock meeting",
                    start: "2025-11-03T10:00:00+08:00",
                    end: "2025-11-03T11:00:00+08:00",
                    providerId: "gcal_abc",
                },
            ];
        },
    },
    Mutation: {
        createTask: async (_p, { input }) => {
            // TODO: implement validation and persist to DB
            // Return a simulated created task
            const created = await Task.create({
                title: input.title,
                description: input.description,
                owner: input.ownerId,
            }).catch(() => null);
            if (created) return created;
            return { id: "t-new", title: input.title, description: input.description };
        },

        // 用户登录
        login: async (parent: any, { input }: { input: any }) => {
            // TODO: 真实实现 - 查找用户, 验证密码, 生成JWT
            // const user = await User.findOne({ email: input.email });
            // if (!user) throw new Error('用户不存在');
            // const isValid = await comparePassword(input.password, user.password);
            // if (!isValid) throw new Error('密码错误');
            // const token = createJWT(user.id);

            console.log("login: 模拟登录", input.email);
            const mockUser = {
                id: MOCK_USER_ID,
                email: input.email,
                name: "模拟登录用户",
            };
            const mockToken = createJWT(mockUser.id); // 使用模拟函数

            return { token: mockToken, user: mockUser };
        },

        // LLM 拆分任务
        splitTask: async (
            parent: any,
            { prompt }: { prompt: string },
            context: Context
        ) => {
            // TODO: 真实实现 - 确认用户已登录
            // if (!context.user) throw new Error('需要登录');
            const userId = context.user?._id || MOCK_USER_ID;

            console.log("splitTask: 收到拆分请求", prompt);

            // 1. 调用 AI Agent
            const tasksFromLLM = await splitTaskWithLLM(prompt);

            // 2. TODO: 真实实现 - 将任务保存到数据库
            // const savedTasks = await Promise.all(
            //   tasksFromLLM.map(taskData => {
            //     const task = new Task({
            //       ...taskData,
            //       status: 'TODO',
            //       owner: userId
            //     });
            //     return task.save();
            //   })
            // );

            // 3. 返回模拟的"已保存"任务（带上ID和owner）
            const mockSavedTasks = tasksFromLLM.map((task, index) => ({
                ...task,
                id: `gen-task-${index}-${Date.now()}`,
                status: "TODO",
                owner: { id: userId, email: context.user?.email || MOCK_USER_EMAIL },
            }));

            console.log(
                "splitTask: LLM 模拟返回",
                mockSavedTasks.length,
                "个任务"
            );
            return mockSavedTasks;
        },

        // 同步任务到日历
        syncTaskToCalendar: async (
            parent: any,
            { taskId }: { taskId: string },
            context: Context
        ) => {
            // TODO: 真实实现 - 鉴权
            // if (!context.user) throw new Error('需要登录');

            // 1. TODO: 从数据库查找任务
            // const task = await Task.findById(taskId);
            // if (!task) throw new Error('任务不存在');
            const mockTask = {
                id: taskId,
                title: "要同步的任务",
                description: "任务描述",
                dueDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
            };

            // 2. TODO: 调用日历服务 (例如 Google Calendar)
            // const eventData = await createGoogleCalendarEvent(mockTask);

            // 3. TODO: 将日历事件信息保存到我们的数据库
            // const calendarEvent = new CalendarEvent({
            //   ...eventData,
            //   sourceTask: task.id
            // });
            // await calendarEvent.save();

            console.log("syncTaskToCalendar: 模拟同步日历", taskId);
            const mockEvent = {
                id: `event-from-${taskId}`,
                title: mockTask.title,
                start: mockTask.dueDate,
                end: mockTask.dueDate, // 模拟是全天事件
                allDay: true,
                sourceTask: mockTask,
            };

            return mockEvent;
        },
    },

    // -----------------
    // 关系解析 (Resolvers for relations)
    // -----------------

    // TODO: 为 Task.owner, User.tasks 等实现真实的关系解析
    // (这些在 Mongoose 中可能通过 .populate() 自动处理
    //   但在 GraphQL 中需要显式解析)

    Task: {
        owner: (parent: any, args: any, context: Context) => {
            // parent 是 Task 对象
            // TODO: 真实实现 - 查询 Task 的 owner
            // return User.findById(parent.owner);
            console.log("Task.owner: 解析 owner", parent.owner.id);
            return parent.owner; // 模拟数据已包含 owner
        },
    },

    User: {
        tasks: (parent: any, args: any, context: Context) => {
            // parent 是 User 对象
            // TODO: 真实实现 - 查询该 User 的所有 Task
            // return Task.find({ owner: parent.id });
            console.log("User.tasks: 查询用户", parent.id, "的任务");
            return []; // 注意：暂时返回空，避免无限循环
        },
        calendarEvents: (parent: any, args: any, context: Context) => {
            // parent 是 User 对象
            // TODO: 真实实现 - 查询该 User 的所有 CalendarEvent
            // return CalendarEvent.find({ ... });
            console.log("User.calendarEvents: 查询用户", parent.id, "的日历");
            return []; // 注意：暂时返回空
        },
    },
};