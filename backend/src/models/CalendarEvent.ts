import mongoose, { Schema, Document } from "mongoose";

export interface ICalendarEvent extends Document {
    title: string;
    start: Date;        // Changed to Date object for easier sorting
    end: Date;          // Changed to Date object
    allDay: boolean;    // Matches your GraphQL schema
    sourceTask?: mongoose.Types.ObjectId; // Link to original Task
    owner: mongoose.Types.ObjectId;       // Link to User
    providerId?: string; // Keep this! Useful for Google Calendar sync later
}

const CalendarEventSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        start: { type: Date, required: true },
        end: { type: Date, required: true },
        allDay: { type: Boolean, default: false },

        // Optional: If this event was created from a Task
        sourceTask: {
            type: Schema.Types.ObjectId,
            ref: 'Task',
            required: false
        },

        // Required: Which user does this belong to?
        owner: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        // Optional: For Google Calendar integration
        providerId: { type: String }
    },
    {
        timestamps: true,
    
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
        id: false
    }
);

export default mongoose.model<ICalendarEvent>("CalendarEvent", CalendarEventSchema);