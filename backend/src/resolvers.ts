import { User } from './models/User';
import { Task } from './models/Task';
import { CalendarEvent } from './models/CalendarEvent';
import { hashPassword, comparePassword, createJWT } from './utils/auth';
import { splitTaskWithLLM } from './agents/AIAgents';
import { createGoogleCalendarEvent } from './services/googleCalendar';
import { Context }_ from './types'; // 引入上下文类型

// 模拟用户ID
const MOCK_USER_ID = 'mock-user-id-123';
const MOCK_USER_EMAIL = 'user@example.com';

export const resolvers = {
  Query: {
    // 获取当前用户信息
    me: (parent: any, args: any, context: Context) => {
      // TODO: 真实实现 - 从 context 中返回 user
      if (!context.user) {
        console.log('me: 用户未认证');
        // throw new Error('未认证');
        return null; // 调试阶段返回 null
      }
      console.log('me: 返回模拟用户', context.user._id);
      return {
        id: context.user._id,
        email: context.user.email,
        name: '模拟用户',
      };
    },

    // 获取用户任务
    userTasks: (parent: any, { userId }: { userId: string }, context: Context) => {
      // TODO: 真实实现 - 检查权限并从数据库查询
      console.log('userTasks: 查询用户', userId);
      return [
        {
          id: 'task-1',
          title: '已存在的任务1',
          description: '这是一个模拟任务',
          dueDate: new Date().toISOString(),
          status: 'TODO',
          owner: { id: userId, email: MOCK_USER_EMAIL },
        },
      ];
    },

    // 获取用户日历事件
    userCalendarEvents: (parent: any, { userId }: { userId: string }, context: Context) => {
      // TODO: 真实实现 - 从数据库查询
      console.log('userCalendarEvents: 查询用户', userId);
      return [
        {
          id: 'event-1',
          title: '日历事件1',
          start: new Date().toISOString(),
          end: new Date(Date.now() + 3600 * 1000).toISOString(),
          allDay: false,
        },
      ];
    },
  },

  Mutation: {
    // 用户注册
    register: async (parent: any, { input }: { input: any }) => {
      // TODO: 真实实现 - 哈希密码, 创建用户, 生成JWT
      // const hashedPassword = await hashPassword(input.password);
      // const user = new User({ ...input, password: hashedPassword });
      // await user.save();
      // const token = createJWT(user.id);
      
      console.log('register: 模拟注册', input.email);
      const mockUser = {
        id: MOCK_USER_ID,
        email: input.email,
        name: input.name,
      };
      const mockToken = createJWT(mockUser.id); // 使用模拟函数
      
      return { token: mockToken, user: mockUser };
    },

    // 用户登录
    login: async (parent: any, { input }: { input: any }) => {
      // TODO: 真实实现 - 查找用户, 验证密码, 生成JWT
      // const user = await User.findOne({ email: input.email });
      // if (!user) throw new Error('用户不存在');
      // const isValid = await comparePassword(input.password, user.password);
      // if (!isValid) throw new Error('密码错误');
      // const token = createJWT(user.id);
      
      console.log('login: 模拟登录', input.email);
      const mockUser = {
        id: MOCK_USER_ID,
        email: input.email,
        name: '模拟登录用户',
      };
      const mockToken = createJWT(mockUser.id); // 使用模拟函数
      
      return { token: mockToken, user: mockUser };
    },

    // LLM 拆分任务
    splitTask: async (parent: any, { prompt }: { prompt: string }, context: Context) => {
      // TODO: 真实实现 - 确保用户已登录
      // if (!context.user) throw new Error('需要登录');
      
      // (修改) 移除 ?. 语法 (Node 10 兼容)
      const userId = (context.user && context.user._id) ? context.user._id : MOCK_USER_ID;
      const userEmail = (context.user && context.user.email) ? context.user.email : MOCK_USER_EMAIL;
      
      console.log('splitTask: 收到拆分请求', prompt);
      
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
      
      // 3. 返回模拟的、已保存的任务（添加ID和owner）
      const mockSavedTasks = tasksFromLLM.map((task, index) => ({
        ...task,
        id: `gen-task-${index}-${Date.now()}`,
        status: 'TODO',
        // (修改) 移除 ?. 语法 (Node 10 兼容)
        owner: { id: userId, email: userEmail },
      }));

      console.log('splitTask: LLM 模拟返回', mockSavedTasks.length, '个任务');
      return mockSavedTasks;
    },

    // 同步任务到日历
    syncTaskToCalendar: async (parent: any, { taskId }: { taskId: string }, context: Context) => {
        // TODO: 真实实现 - 检查权限
        // if (!context.user) throw new Error('需要登录');

        // 1. TODO: 从数据库查找任务
        // const task = await Task.findById(taskId);
        // if (!task) throw new Error('任务不存在');
        const mockTask = {
          id: taskId,
          title: '要同步的任务',
          description: '任务描述',
          dueDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString()
        };
        
        // 2. TODO: 调用日历服务 (例如 Google Calendar)
        // const eventData = await createGoogleCalendarEvent(mockTask);

        // 3. TODO: 将创建的事件保存到我们的数据库
        // const calendarEvent = new CalendarEvent({
        //   ...eventData,
        //   sourceTask: task.id
        // });
        // await calendarEvent.save();
        
        console.log('syncTaskToCalendar: 模拟同步任务', taskId);
        const mockEvent = {
            id: `event-from-${taskId}`,
            title: mockTask.title,
            start: mockTask.dueDate,
            end: mockTask.dueDate, // 假设是全天事件或1小时
            allDay: true,
            sourceTask: mockTask
        };

        return mockEvent;
    }
  },

  // -----------------
  // 关系解析 (Resolvers for relations)
  // -----------------
  
  // TODO: 为 Task.owner, User.tasks 等实现真实的关系解析
  // (这些在 Mongoose 中可以通过 .populate() 自动处理，
  //  但在 GraphQL 解析器中显式定义更清晰)
  
  Task: {
    owner: (parent: any, args: any, context: Context) => {
      // parent 是 Task 对象
      // TODO: 真实实现 - 查询 Task 的 owner
      // return User.findById(parent.owner);
      console.log('Task.owner: 解析 owner', parent.owner.id);
      return parent.owner; // 模拟数据中已包含 owner
    }
  },

  User: {
    tasks: (parent: any, args: any, context: Context) => {
      // parent 是 User 对象
      // TODO: 真实实现 - 查询该 User 的所有 Task
      // return Task.find({ owner: parent.id });
      console.log('User.tasks: 解析用户', parent.id, '的任务');
      return []; // 调试：暂时返回空，避免无限循环
    },
    calendarEvents: (parent: any, args: any, context: Context) => {
      // parent 是 User 对象
      // TODO: 真实实现 - 查询该 User 的所有 CalendarEvent
      // return CalendarEvent.find({ ... });
      console.log('User.calendarEvents: 解析用户', parent.id, '的日历');
      return []; // 调试：暂时返回空
    }
  }
};

