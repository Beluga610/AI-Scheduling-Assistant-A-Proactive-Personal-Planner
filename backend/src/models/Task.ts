import mongoose, { Schema, Document } from "mongoose";

export interface ITask extends Document {
    title: string;
    description?: string;
    dueDate?: Date;
    status: 'TODO' | 'IN_PROGRESS' | 'DONE';
    owner: mongoose.Types.ObjectId; // Link to User
}

const TaskSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        description: { type: String },
        dueDate: { type: Date }, // Storing as Date is better for sorting than String
        status: {
            type: String,
            enum: ['TODO', 'IN_PROGRESS', 'DONE'],
            default: 'TODO'
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: 'User', // This links to the User model
            required: true
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
        id: false
    }
);

export default mongoose.model<ITask>("Task", TaskSchema);