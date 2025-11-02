import { IResolvers } from "apollo-server-express";
import User from "./models/User";
import Task from "./models/Task";
import CalendarEvent from "./models/CalendarEvent";
import { splitTaskUsingLLM } from "./agents/AIAgents";

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
      const fromDb = await Task.find(ownerId ? { owner: ownerId } : {}).limit(10).lean().exec().catch(() => null);
      if (fromDb && fromDb.length) return fromDb;
      return [
        { id: "t1", title: "Write project spec", description: "Draft first version", owner: { id: "u1", name: "Alice", email: "alice@example.com" } }
      ];
    },
    events: async (_p, { ownerId }) => {
      // TODO: implement owner filter and real calendar provider integration
      const fromDb = await CalendarEvent.find().limit(10).lean().exec().catch(() => null);
      if (fromDb && fromDb.length) return fromDb;
      return [
        { id: "e1", title: "Mock meeting", start: "2025-11-03T10:00:00+08:00", end: "2025-11-03T11:00:00+08:00", providerId: "gcal_abc" }
      ];
    }
  },
  Mutation: {
    createTask: async (_p, { input }) => {
      // TODO: implement validation and persist to DB
      // Return a simulated created task
      const created = await Task.create({ title: input.title, description: input.description, owner: input.ownerId }).catch(() => null);
      if (created) return created;
      return { id: "t-new", title: input.title, description: input.description };
    },

    // �û���¼
    login: async (parent: any, { input }: { input: any }) => {
      // TODO: ��ʵʵ�� - �����û�, ��֤����, ����JWT
      // const user = await User.findOne({ email: input.email });
      // if (!user) throw new Error('�û�������');
      // const isValid = await comparePassword(input.password, user.password);
      // if (!isValid) throw new Error('�������');
      // const token = createJWT(user.id);
      
      console.log('login: ģ���¼', input.email);
      const mockUser = {
        id: MOCK_USER_ID,
        email: input.email,
        name: 'ģ���¼�û�',
      };
      const mockToken = createJWT(mockUser.id); // ʹ��ģ�⺯��
      
      return { token: mockToken, user: mockUser };
    },

    // LLM �������
    splitTask: async (parent: any, { prompt }: { prompt: string }, context: Context) => {
      // TODO: ��ʵʵ�� - ȷ���û��ѵ�¼
      // if (!context.user) throw new Error('��Ҫ��¼');
      const userId = context.user?._id || MOCK_USER_ID;
      
      console.log('splitTask: �յ��������', prompt);
      
      // 1. ���� AI Agent
      const tasksFromLLM = await splitTaskWithLLM(prompt);
      
      // 2. TODO: ��ʵʵ�� - �����񱣴浽���ݿ�
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
      
      // 3. ����ģ��ġ��ѱ������������ID��owner��
      const mockSavedTasks = tasksFromLLM.map((task, index) => ({
        ...task,
        id: `gen-task-${index}-${Date.now()}`,
        status: 'TODO',
        owner: { id: userId, email: context.user?.email || MOCK_USER_EMAIL },
      }));

      console.log('splitTask: LLM ģ�ⷵ��', mockSavedTasks.length, '������');
      return mockSavedTasks;
    },

    // ͬ����������
    syncTaskToCalendar: async (parent: any, { taskId }: { taskId: string }, context: Context) => {
        // TODO: ��ʵʵ�� - ���Ȩ��
        // if (!context.user) throw new Error('��Ҫ��¼');

        // 1. TODO: �����ݿ��������
        // const task = await Task.findById(taskId);
        // if (!task) throw new Error('���񲻴���');
        const mockTask = {
          id: taskId,
          title: 'Ҫͬ��������',
          description: '��������',
          dueDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString()
        };
        
        // 2. TODO: ������������ (���� Google Calendar)
        // const eventData = await createGoogleCalendarEvent(mockTask);

        // 3. TODO: ���������¼����浽���ǵ����ݿ�
        // const calendarEvent = new CalendarEvent({
        //   ...eventData,
        //   sourceTask: task.id
        // });
        // await calendarEvent.save();
        
        console.log('syncTaskToCalendar: ģ��ͬ������', taskId);
        const mockEvent = {
            id: `event-from-${taskId}`,
            title: mockTask.title,
            start: mockTask.dueDate,
            end: mockTask.dueDate, // ������ȫ���¼���1Сʱ
            allDay: true,
            sourceTask: mockTask
        };

        return mockEvent;
    }
  },

  // -----------------
  // ��ϵ���� (Resolvers for relations)
  // -----------------
  
  // TODO: Ϊ Task.owner, User.tasks ��ʵ����ʵ�Ĺ�ϵ����
  // (��Щ�� Mongoose �п���ͨ�� .populate() �Զ�������
  //  ���� GraphQL ����������ʽ���������)
  
  Task: {
    owner: (parent: any, args: any, context: Context) => {
      // parent �� Task ����
      // TODO: ��ʵʵ�� - ��ѯ Task �� owner
      // return User.findById(parent.owner);
      console.log('Task.owner: ���� owner', parent.owner.id);
      return parent.owner; // ģ���������Ѱ��� owner
    }
  },

  User: {
    tasks: (parent: any, args: any, context: Context) => {
      // parent �� User ����
      // TODO: ��ʵʵ�� - ��ѯ�� User ������ Task
      // return Task.find({ owner: parent.id });
      console.log('User.tasks: �����û�', parent.id, '������');
      return []; // ���ԣ���ʱ���ؿգ���������ѭ��
    },
    calendarEvents: (parent: any, args: any, context: Context) => {
      // parent �� User ����
      // TODO: ��ʵʵ�� - ��ѯ�� User ������ CalendarEvent
      // return CalendarEvent.find({ ... });
      console.log('User.calendarEvents: �����û�', parent.id, '������');
      return []; // ���ԣ���ʱ���ؿ�
    }
  }
};
