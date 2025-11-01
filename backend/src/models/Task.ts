import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User';

// TODO: 定义 Mongoose Task Schema

export interface ITask extends Document {
  title: string;
  description?: string;
  dueDate?: Date;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  owner: IUser['_id'];
}

const TaskSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  dueDate: { type: Date },
  status: { type: String, enum: ['TODO', 'IN_PROGRESS', 'DONE'], default: 'TODO' },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// TODO: 实际应用中取消注释
// export const Task = mongoose.model<ITask>('Task', TaskSchema);

// 调试用的模拟导出
export const Task = {
  find: (query: any) => ({
    exec: () => Promise.resolve([
      { id: 'mock-task-1', title: 'Mock Task 1', status: 'TODO', owner: query.owner }
    ])
  }),
  create: (data: any) => Promise.resolve({ ...data, id: 'new-mock-task-id' })
};
