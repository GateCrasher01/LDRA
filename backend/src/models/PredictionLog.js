import mongoose from "mongoose";

const predictionLogSchema = new mongoose.Schema({
  loanId: { type: mongoose.Schema.Types.ObjectId, ref: "LoanApplication", required: true },
  modelVersion: { type: String, default: "1.0" },
  prediction: { type: Number, required: true },
  probability: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model("PredictionLog", predictionLogSchema);