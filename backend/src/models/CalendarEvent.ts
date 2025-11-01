import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User';
import { ITask } from './Task';

// TODO: 定义 Mongoose CalendarEvent Schema

export interface ICalendarEvent extends Document {
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  owner: IUser['_id'];
  sourceTask?: ITask['_id']; // 关联的任务
  googleEventId?: string; // (可选) 存储 Google Calendar 的事件 ID
}

const CalendarEventSchema: Schema = new Schema({
  title: { type: String, required: true },
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  allDay: { type: Boolean, default: false },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  sourceTask: { type: Schema.Types.ObjectId, ref: 'Task' },
  googleEventId: { type: String },
}, { timestamps: true });

// TODO: 实际应用中取消注释
// export const CalendarEvent = mongoose.model<ICalendarEvent>('CalendarEvent', CalendarEventSchema);

// 调试用的模拟导出
export const CalendarEvent = {
  // 模拟 Mongoose 模型方法
};
