import mongoose from "mongoose";

const mongoUrl = process.env.URL_MONGO as string;

if (!mongoUrl) {
  throw new Error("MongoDB URL is not defined in the environment variables.");
}

let isConnected = false; // Track the connection status

export async function Connect(): Promise<void> {
  if (isConnected) return;

  try {
    mongoose.connection.setMaxListeners(20);

    await mongoose.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      tls: false, // Enables TLS/SSL
      tlsAllowInvalidCertificates: false, // Allow invalid certificates only if necessary
    });

    isConnected = true;
    console.log("Successfully connected to the database.");
  } catch (error) {
    console.error(
      "Failed to connect to the database:",
      error instanceof Error ? error.message : error
    );
    throw error;
  }
}

// Define connection events to monitor and handle MongoDB connection status
mongoose.connection.on("connected", () => {
  isConnected = true;
  console.log("MongoDB connection established.");
});

mongoose.connection.on("warning", (warning) =>
  console.warn("MongoDB warning:", warning.stack)
);

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
  isConnected = false;
});

mongoose.connection.on("disconnected", async () => {
  isConnected = false;
  console.log("MongoDB connection lost. Attempting to reconnect...");

  try {
    await mongoose.connect(mongoUrl);
    console.log("Reconnected to MongoDB.");
  } catch (error) {
    console.error(
      "Failed to reconnect to MongoDB:",
      error instanceof Error ? error.message : error
    );
  }
});
