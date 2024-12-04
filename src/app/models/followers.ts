import mongoose from "mongoose";

const followSchema = new mongoose.Schema({
  idUser: {
    type: String,
    required: [true, "Title is required"],
  },
  Follow: {
    type: Number,
    default: 0,
  },
  FollowBy: {
    type: [String],
    ref: "User",
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Use existing model if it exists, otherwise create a new one
const Followers =
  mongoose.models.followSchema || mongoose.model("followSchema", followSchema);

export default Followers;
