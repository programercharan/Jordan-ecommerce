


import mongoose from "mongoose";

export async function connect() {
    try {
        console.log("Connecting to MongoDB Atlas...");

        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000
        });

        console.log("MongoDB Atlas connected successfully");
    } catch (error) {
        console.error("MongoDB connection failed:");
        console.error(error.message);
        throw error;
    }
}
