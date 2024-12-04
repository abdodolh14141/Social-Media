import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  ReportMsg: {
    type: String,
    required: [true, "Message is required"],
    unique: true,
  },
  Email: {
    type: String,
    required: [true, "Email is required"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Use existing model if it exists, otherwise create a new one
const Report = mongoose.models.Report || mongoose.model("Report", reportSchema);

export default Report;
