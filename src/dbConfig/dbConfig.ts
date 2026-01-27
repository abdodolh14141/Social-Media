import mongoose from "mongoose";

// 1. Declare Global Type for Next.js HMR
declare global {
  var mongoose: {
    conn: mongoose.Connection | null;
    promise: Promise<mongoose.Connection> | null;
  };
}

// 2. Setup Cache
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * FIXED: Vercel/Serverless Optimized Connection
 */
export async function Connect(): Promise<mongoose.Connection> {
  // Use the exact variable name you set in Vercel Dashboard
  const mongoUrl = process.env.URL_MONGO;

  if (!mongoUrl) {
    throw new Error("URL_MONGO is missing in Vercel Environment Variables.");
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      // In Serverless, we want to fail fast if the DB is down
      serverSelectionTimeoutMS: 5000, 
      // Do NOT use minPoolSize in Serverless; it can exhaust Atlas connections quickly
      maxPoolSize: 1, 
    };

    cached.promise = mongoose.connect(mongoUrl, opts).then((m) => {
      console.log("✅ New MongoDB connection established.");
      return m.connection;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null; // Reset promise on failure
    console.error("❌ MongoDB Connection Error:", e);
    throw e;
  }

  return cached.conn;
}

export default mongoose;
