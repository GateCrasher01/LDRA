import mongoose from "mongoose";

const loanApplicationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  employmentStatus: {
    type: String,
    enum: ["employed", "self_employed", "unemployed", "retired"],
    required: true,
  },
  income: { type: Number, required: true },
  creditScore: { type: Number, required: true },
  loanAmount: { type: Number, required: true },
  loanTerm: { type: Number, required: true },
  prediction: { type: Number, default: null },
  probability: { type: Number, default: null },
  riskLevel: { type: String, enum: ["HIGH", "MEDIUM", "LOW"], default: null },
  debtToIncomeRatio: { type: Number, default: null },
  creditUtilization: { type: Number, default: null },
  recommendation: { type: String, default: null },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "under_review"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("LoanApplication", loanApplicationSchema);