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
      // TODO: implement real DB fetch
      // returning mock user(s) to allow frontend testing
      const mock = await User.find().limit(10).lean().exec().catch(() => null);
      if (mock && mock.length) return mock;
      return [
        { id: "u1", name: "Alice", email: "alice@example.com" }
      ];
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
    splitTaskToEvents: async (_p, { taskId }) => {
      // TODO: implement LLM call to split the task and create events
      // Use agent mock to produce event suggestions
      const mockEvents = await splitTaskUsingLLM(taskId);
      // persist to DB (simulate)
      const saved = await CalendarEvent.create(mockEvents).catch(() => null);
      if (saved) return saved;
      return mockEvents;
    }
  }
};
