import mongoose, { Schema, Document } from "mongoose";

export interface ICalendarEvent extends Document {
    title: string;
    start: Date;       
    end: Date;   
    allDay: boolean;    
    sourceTask?: mongoose.Types.ObjectId; 
    owner: mongoose.Types.ObjectId;  
    providerId?: string;
    contactName?: string;
    location?: string;
    vibe?: string;
}

const CalendarEventSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        start: { type: Date, required: true },
        end: { type: Date, required: true },
        allDay: { type: Boolean, default: false },
        sourceTask: {
            type: Schema.Types.ObjectId,
            ref: 'Task',
            required: false
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        providerId: { type: String },
        contactName: { type: String, required: false },
        location: { type: String, required: false },
        vibe: { type: String, required: false }

    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
        id: false
    }
);

export default mongoose.model<ICalendarEvent>("CalendarEvent", CalendarEventSchema);