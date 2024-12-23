import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  IdUserCreated: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Id is required"],
  },
  Title: {
    type: String,
    required: [true, "Title is required"],
    unique: true,
  },
  Content: {
    type: String,
    required: [true, "Content is required"],
    lowercase: true,
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
    type: [String],
    ref: "User",
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Posts = mongoose.models.Posts || mongoose.model("Posts", postSchema);

export default Posts;
