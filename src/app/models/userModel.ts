import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  Name: {
    type: String,
    required: [true, "User name is required"],
    minlength: [3, "User name must be at least 3 characters long"],
  },
  Email: {
    type: String,
    required: [true, "Email is required"],
    trim: true, // Remove any trailing whitespace
    lowercase: true, // Store email in lowercase
  },
  Age: {
    type: Number,
    min: 18,
    max: 59,
  },
  Followers: {
    type: [String],
    ref: "User",
    default: [],
  },
  Follow: { type: Number, default: 0 },
  UrlImageProfile: {
    type: String,
  },

  Gender: {
    type: String,
    default: "Unknown",
  },
  Password: {
    type: String,
    minlength: [6, "User Password must be at least 3 characters long"],
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
});

// Use existing model if it exists, otherwise create a new one
const User =
  mongoose.models.SocialUser || mongoose.model("SocialUser", userSchema);

export default User;
