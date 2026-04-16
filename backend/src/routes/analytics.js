import { Router } from "express";
import LoanApplication from "../models/LoanApplication.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/summary", requireAuth, async (_req, res) => {
  try {
    const allLoans = await LoanApplication.find();
    const totalLoans = allLoans.length;
    const highRisk = allLoans.filter((l) => l.riskLevel === "HIGH").length;
    const mediumRisk = allLoans.filter((l) => l.riskLevel === "MEDIUM").length;
    const lowRisk = allLoans.filter((l) => l.riskLevel === "LOW").length;
    const totalLoanValue = allLoans.reduce((s, l) => s + (l.loanAmount || 0), 0);
    const avgCreditScore = totalLoans > 0
      ? allLoans.reduce((s, l) => s + (l.creditScore || 0), 0) / totalLoans : 0;
    const approved = allLoans.filter((l) => l.status === "approved").length;
    const approvalRate = totalLoans > 0 ? (approved / totalLoans) * 100 : 0;

    res.json({ totalLoans, highRisk, mediumRisk, lowRisk, totalLoanValue, avgCreditScore, approvalRate });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/charts", requireAuth, async (_req, res) => {
  try {
    const allLoans = await LoanApplication.find();
    const riskDistribution = [
      { label: "High Risk", value: allLoans.filter((l) => l.riskLevel === "HIGH").length },
      { label: "Medium Risk", value: allLoans.filter((l) => l.riskLevel === "MEDIUM").length },
      { label: "Low Risk", value: allLoans.filter((l) => l.riskLevel === "LOW").length },
    ];

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const approvalTrend = months.map((month, idx) => {
      const monthLoans = allLoans.filter((l) => {
        const d = new Date(l.createdAt);
        return d.getMonth() === (new Date().getMonth() - (5 - idx) + 12) % 12;
      });
      return {
        month,
        high: monthLoans.filter((l) => l.riskLevel === "HIGH").length,
        medium: monthLoans.filter((l) => l.riskLevel === "MEDIUM").length,
        low: monthLoans.filter((l) => l.riskLevel === "LOW").length,
        total: monthLoans.length,
      };
    });

    const incomeRanges = [
      { label: "< ₹3L", min: 0, max: 300000 },
      { label: "₹3L-₹6L", min: 300000, max: 600000 },
      { label: "₹6L-₹10L", min: 600000, max: 1000000 },
      { label: "₹10L-₹15L", min: 1000000, max: 1500000 },
      { label: "> ₹15L", min: 1500000, max: Infinity },
    ];
    const incomeVsDefaultRisk = incomeRanges.map((range) => {
      const group = allLoans.filter((l) => l.income >= range.min && l.income < range.max);
      const defaultCount = group.filter((l) => l.prediction === 1).length;
      return {
        incomeRange: range.label,
        defaultRate: group.length > 0 ? (defaultCount / group.length) * 100 : 0,
        count: group.length,
      };
    });

    res.json({ riskDistribution, approvalTrend, incomeVsDefaultRisk });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/loan/:id", requireAuth, async (req, res) => {
  try {
    const allLoans = await LoanApplication.find();
    const loan = await LoanApplication.findById(req.params.id);
    if (!loan) return res.status(404).json({ error: "Loan not found" });

    const featureImportance = [
      { feature: "Credit Score", importance: 0.32 },
      { feature: "Income", importance: 0.24 },
      { feature: "Loan Amount", importance: 0.18 },
      { feature: "Debt-to-Income", importance: 0.14 },
      { feature: "Employment Status", importance: 0.08 },
      { feature: "Age", importance: 0.04 },
    ];

    const creditScoreVsRisk = allLoans
      .filter((l) => l.probability != null)
      .slice(0, 50)
      .map((l) => ({
        creditScore: l.creditScore,
        probability: l.probability,
        riskLevel: l.riskLevel || "LOW",
      }));

    const loanAmountVsRisk = allLoans
      .filter((l) => l.probability != null)
      .slice(0, 30)
      .map((l) => ({ loanAmount: l.loanAmount, probability: l.probability }))
      .sort((a, b) => a.loanAmount - b.loanAmount);

    const riskDistribution = [
      { label: "High Risk", value: allLoans.filter((l) => l.riskLevel === "HIGH").length },
      { label: "Medium Risk", value: allLoans.filter((l) => l.riskLevel === "MEDIUM").length },
      { label: "Low Risk", value: allLoans.filter((l) => l.riskLevel === "LOW").length },
    ];

    res.json({ featureImportance, creditScoreVsRisk, loanAmountVsRisk, riskDistribution });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;