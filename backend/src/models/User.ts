import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
    name?: string;
    email: string;
    password?: string;
    preferences?: string[];
}

const UserSchema: Schema = new Schema(
    {
        name: { type: String, required: false },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: false }, 
        preferences: {
            type: [String],
            default: [] 
        }
    },
    {
        timestamps: true, 
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
        id: false
    }
);

export default mongoose.model<IUser>("User", UserSchema);