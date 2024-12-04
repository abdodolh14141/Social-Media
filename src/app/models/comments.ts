import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema({
  idPost: {
    type: String,
    required: [true, "Title is required"],
  },
  CommentUserId: {
    type: String,
    required: true,
    unique: true,
  },
  TextComment: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Use existing model if it exists, otherwise create a new one
const Comment =
  mongoose.models.Comment || mongoose.model("Comment", CommentSchema);

export default Comment;
