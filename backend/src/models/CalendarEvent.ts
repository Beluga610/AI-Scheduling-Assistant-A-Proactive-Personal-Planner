import mongoose, { Schema, Document } from "mongoose";

export interface ICalendarEvent extends Document {
  title: string;
  start: string;
  end: string;
  providerId?: string; // e.g., Google Calendar event id
}

const CalendarEventSchema: Schema = new Schema({
  title: { type: String, required: true },
  start: { type: String, required: true },
  end: { type: String, required: true },
  providerId: { type: String }
}, { timestamps: true });

export default mongoose.model<ICalendarEvent>("CalendarEvent", CalendarEventSchema);
