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
       serverSelectionTimeoutMS: 5000, // Fail after 5s instead of 30s
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4, which can sometimes solve connection hangs in certain regions
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

