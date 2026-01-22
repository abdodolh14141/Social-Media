import mongoose, { Document, Schema } from "mongoose";

export interface IPost extends Document {
  IdUserCreated: mongoose.Types.ObjectId;
  Title: string;
  Content: string;
  AuthorName: string;
  PublicImage?: string;
  Like: number;
  likedBy: string[];
  createdAt: Date;
}

const postSchema = new Schema({
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

const Posts = mongoose.models.Posts || mongoose.model<IPost>("Posts", postSchema);

export default Posts;
