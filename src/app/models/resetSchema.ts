import mongoose from "mongoose";

const resetSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, index: true },
    tokenHash: { type: String, index: true },
    expiresAt: Date,
    used: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Reset || mongoose.model("Reset", resetSchema);
