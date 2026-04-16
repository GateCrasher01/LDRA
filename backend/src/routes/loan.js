import { Router } from "express";
import LoanApplication from "../models/LoanApplication.js";
import PredictionLog from "../models/PredictionLog.js";
import { requireAuth } from "../middleware/auth.js";
import { predictLoanDefault, classifyRisk, generateRecommendation } from "../lib/predict.js";

const router = Router();

router.get("/loans", requireAuth, async (req, res) => {
  try {
    const { search, riskLevel, sortBy, sortOrder } = req.query;
    const query = {};
    if (search) query.name = { $regex: search, $options: "i" };
    if (riskLevel && riskLevel !== "all") query.riskLevel = riskLevel;

    const sortField = sortBy || "createdAt";
    const sortDir = sortOrder === "asc" ? 1 : -1;

    const loans = await LoanApplication.find(query).sort({ [sortField]: sortDir });
    res.json(loans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/loans/apply", requireAuth, async (req, res) => {
  try {
    const { name, age, gender, employmentStatus, income, creditScore, loanAmount, loanTerm } = req.body;

    if (!name || !age || !gender || !employmentStatus || !income || !creditScore || !loanAmount || !loanTerm)
      return res.status(400).json({ error: "All fields are required" });

    const predResult = await predictLoanDefault({
      credit_score: creditScore,
      income,
      age,
      loan_amount: loanAmount,
      loan_term: loanTerm,
      employment_status: employmentStatus,
    });

    const riskLevel = classifyRisk(predResult.probability);
    const recommendation = generateRecommendation(riskLevel, predResult.probability);
    const debtToIncomeRatio = (loanAmount / loanTerm) / (income / 12);
    const creditUtilization = Math.min(1, loanAmount / (creditScore * 50));

    const loan = await LoanApplication.create({
      name, age, gender, employmentStatus, income, creditScore, loanAmount, loanTerm,
      prediction: predResult.prediction,
      probability: predResult.probability,
      riskLevel,
      debtToIncomeRatio,
      creditUtilization,
      recommendation,
      status: "pending",
    });

    await PredictionLog.create({
      loanId: loan._id,
      modelVersion: "1.0",
      prediction: predResult.prediction,
      probability: predResult.probability,
    });

    res.status(201).json(loan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/loans/:id", requireAuth, async (req, res) => {
  try {
    const loan = await LoanApplication.findById(req.params.id);
    if (!loan) return res.status(404).json({ error: "Loan not found" });
    res.json(loan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/loans/:id", requireAuth, async (req, res) => {
  try {
    const loan = await LoanApplication.findByIdAndDelete(req.params.id);
    if (!loan) return res.status(404).json({ error: "Loan not found" });
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/loans/:id/status", requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const loan = await LoanApplication.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!loan) return res.status(404).json({ error: "Loan not found" });
    res.json(loan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;