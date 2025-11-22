import mongoose from 'mongoose';
import dotenv from 'dotenv';
// Ensure env vars are loaded
dotenv.config();

/**
 * Establishes a connection to the MongoDB database.
 * Includes critical error handling to exit the process if the DB is unreachable,
 * preventing the server from running in an unstable state.
 */
export const connectDB = async () => {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
        console.error('❌ Error: MONGODB_URI is not defined in .env file');
        process.exit(1);
    }

    try {
        const conn = await mongoose.connect(mongoUri);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        // Exit process with failure to allow orchestration tools (like Docker/PM2) to restart it
        process.exit(1);
    }
};