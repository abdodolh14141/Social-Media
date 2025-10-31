import mongoose from "mongoose";

// Use a unique symbol for the global connection to prevent it from being
// reset in Next.js development mode (Hot Module Replacement)
declare global {
  var mongoose: any; // Use 'any' for global type declaration
}

// 1. **CRITICAL FIX/IMPROVEMENT:** Handle Next.js HMR/Dev Mode
// This pattern ensures the connection logic is not re-executed on every file save in development.
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const mongoUrl = process.env.URL_MONGO as string;

if (!mongoUrl) {
  // Use a standard Error for clarity
  throw new Error("MongoDB URL is not defined in the environment variables.");
}

// 2. **IMPROVEMENT:** Simplified connection options for Mongoose v6+
// Removed deprecated options and those now handled by default.
const connectionOptions = {
  serverSelectionTimeoutMS: 30000, // Keep at 30s or more
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
  maxPoolSize: 10, // Maintain up to 10 socket connections
  minPoolSize: 5, // Ensure a minimum of 5 connections are maintained
  bufferCommands: false, // Disable Mongoose buffering (recommended for serverless)
};

/**
 * Connects to the MongoDB database using Mongoose.
 * This function uses caching for better performance and reliability in Next.js/serverless.
 * @returns {Promise<mongoose.Connection>} A promise that resolves to the Mongoose connection object.
 */
export async function Connect(): Promise<mongoose.Connection> {
  if (cached.conn) {
    console.log("Using existing database connection (cached).");
    return cached.conn;
  }

  if (!cached.promise) {
    // Build the connection promise only once
    console.log("Establishing new database connection...");

    // 3. **FIX/IMPROVEMENT:** Rely on the promise and connect only once
    cached.promise = mongoose
      .connect(mongoUrl, connectionOptions)
      .then((m) => {
        // Attach event handlers only once to the established connection
        m.connection.on("connected", () =>
          console.log("🔗 MongoDB connection established.")
        );
        m.connection.on("warning", (warning) =>
          console.warn("⚠️ MongoDB warning:", warning.stack)
        );
        m.connection.on("error", (err) =>
          console.error("❌ MongoDB connection error:", err)
        );
        m.connection.on("disconnected", () =>
          console.log("💔 MongoDB connection lost/reconnecting...")
        );

        console.log("✅ Successfully connected to the database.");
        return m.connection;
      })
      .catch((error) => {
        // Clear the promise if connection fails so a new attempt can be made
        cached.promise = null;
        console.error(
          "❌ Failed to connect to the database:",
          error instanceof Error ? error.message : error
        );
        // Re-throw the error to be caught by the caller
        throw error;
      });
  }

  // Wait for the connection promise to resolve
  cached.conn = await cached.promise;
  return cached.conn;
}

// ------------------------------------------------------------------------------------------------
// 4. **REMOVAL:** Removed all external event handlers (like mongoose.connection.on("connected"))
//    and the custom reconnect logic.
//    In a serverless environment (like Next.js API routes), you should rely on each function
//    call establishing a connection if one is not cached. Mongoose's built-in reconnection
//    logic is often irrelevant as the process typically spins down quickly after use.
//    The event handlers are now attached directly to the single successful connection instance.

/**
 * Export the mongoose object (optional but useful for direct access if needed).
 */
export default mongoose;
