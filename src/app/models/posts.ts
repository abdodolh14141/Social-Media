import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  IdUserCreated: {
    type: String,
    required: [true, "Id Is required"],
  },
  Title: {
    type: String,
    required: [true, "Title is required"],
    unique: true,
  },
  Content: {
    type: String,
    required: [true, "Content is required"],
    lowercase: true, // Store content in lowercase
  },
  AuthorName: {
    type: String,
    required: [true, "Author is required"],
  },
  PublicImage: {
    type: String,
  },
  Like: {
    type: Number,
    default: 0,
  },
  likedBy: {
    type: [String], // Array to store user IDs who liked this post
    ref: "User",
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Use existing model if it exists, otherwise create a new one
const Posts = mongoose.models.Posts || mongoose.model("Posts", postSchema);

export default Posts;
