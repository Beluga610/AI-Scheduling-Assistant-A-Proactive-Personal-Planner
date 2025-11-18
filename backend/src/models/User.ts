import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
    name?: string;
    email: string;
    password?: string;
}

const UserSchema: Schema = new Schema(
    {
        name: { type: String, required: false },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: false } // Required for login
    },
    {
        timestamps: true, // Adds createdAt and updatedAt automatically
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
        id: false
    }
);

export default mongoose.model<IUser>("User", UserSchema);