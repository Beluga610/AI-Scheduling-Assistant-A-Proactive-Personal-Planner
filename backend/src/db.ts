import mongoose from 'mongoose';
import dotenv from 'dotenv';
// Ensure env vars are loaded
dotenv.config();

export const connectDB = async () => {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
        console.error('❌ Error: MONGODB_URI is not defined in .env file');
        process.exit(1);
    }

    try {
        // Connecting to the actual database
        const conn = await mongoose.connect(mongoUri);

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        process.exit(1);
    }
};