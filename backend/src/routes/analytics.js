import { Router } from "express";
import LoanApplication from "../models/LoanApplication.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/summary", requireAuth, async (_req, res) => {
  try {
    const [result] = await LoanApplication.aggregate([
      {
        $facet: {
          total:       [{ $count: "count" }],
          byRisk:      [{ $group: { _id: "$riskLevel", count: { $sum: 1 } } }],
          loanValue:   [{ $group: { _id: null, total: { $sum: "$loanAmount" }, avgCredit: { $avg: "$creditScore" } } }],
          approved:    [{ $match: { status: "approved" } }, { $count: "count" }],
        },
      },
    ]);

    const totalLoans   = result.total[0]?.count ?? 0;
    const loanValue    = result.loanValue[0] ?? {};
    const approvedCount = result.approved[0]?.count ?? 0;
    const riskMap      = Object.fromEntries(result.byRisk.map((r) => [r._id, r.count]));

    res.json({
      totalLoans,
      highRisk:       riskMap["HIGH"]   ?? 0,
      mediumRisk:     riskMap["MEDIUM"] ?? 0,
      lowRisk:        riskMap["LOW"]    ?? 0,
      totalLoanValue: loanValue.total   ?? 0,
      avgCreditScore: loanValue.avgCredit ?? 0,
      approvalRate:   totalLoans > 0 ? (approvedCount / totalLoans) * 100 : 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get("/charts", requireAuth, async (_req, res) => {
  try {
    const now = new Date();

    // Risk distribution — single aggregation
    const riskAgg = await LoanApplication.aggregate([
      { $group: { _id: "$riskLevel", value: { $sum: 1 } } },
    ]);
    const riskMap = Object.fromEntries(riskAgg.map((r) => [r._id, r.value]));
    const riskDistribution = [
      { label: "High Risk",   value: riskMap["HIGH"]   ?? 0 },
      { label: "Medium Risk", value: riskMap["MEDIUM"] ?? 0 },
      { label: "Low Risk",    value: riskMap["LOW"]    ?? 0 },
    ];

    // Approval trend — last 6 months via aggregation
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const trendAgg = await LoanApplication.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" }, riskLevel: "$riskLevel" },
          count: { $sum: 1 },
        },
      },
    ]);

    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const approvalTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const rows = trendAgg.filter((r) => r._id.month === m && r._id.year === y);
      const byRisk = Object.fromEntries(rows.map((r) => [r._id.riskLevel, r.count]));
      approvalTrend.push({
        month:  monthNames[m - 1],
        high:   byRisk["HIGH"]   ?? 0,
        medium: byRisk["MEDIUM"] ?? 0,
        low:    byRisk["LOW"]    ?? 0,
      });
    }

    // Income vs default rate — $bucket aggregation
    const incomeAgg = await LoanApplication.aggregate([
      {
        $bucket: {
          groupBy: "$income",
          boundaries: [0, 300000, 600000, 1000000, 1500000, Infinity],
          default: "> ₹15L",
          output: {
            total:        { $sum: 1 },
            defaultCount: { $sum: { $cond: [{ $eq: ["$prediction", 1] }, 1, 0] } },
          },
        },
      },
    ]);
    const rangeLabels = ["< ₹3L", "₹3L-₹6L", "₹6L-₹10L", "₹10L-₹15L", "> ₹15L"];
    const incomeVsDefaultRisk = incomeAgg.map((b, i) => ({
      incomeRange: rangeLabels[i] ?? String(b._id),
      defaultRate: b.total > 0 ? (b.defaultCount / b.total) * 100 : 0,
      count:       b.total,
    }));

    res.json({ riskDistribution, approvalTrend, incomeVsDefaultRisk });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get("/loan/:id", requireAuth, async (req, res) => {
  try {
    const loan = await LoanApplication.findById(req.params.id);
    if (!loan) return res.status(404).json({ error: "Loan not found" });

    const featureImportance = [
      { feature: "Credit Score",      importance: 0.32 },
      { feature: "Income",            importance: 0.24 },
      { feature: "Loan Amount",       importance: 0.18 },
      { feature: "Debt-to-Income",    importance: 0.14 },
      { feature: "Employment Status", importance: 0.08 },
      { feature: "Age",               importance: 0.04 },
    ];

    // Fetch only 50 records with projection — no full collection scan
    const sample = await LoanApplication
      .find({ probability: { $ne: null } }, { creditScore: 1, probability: 1, riskLevel: 1, loanAmount: 1 })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const creditScoreVsRisk = sample.map((l) => ({
      creditScore: l.creditScore,
      probability: l.probability,
      riskLevel:   l.riskLevel || "LOW",
    }));

    const loanAmountVsRisk = sample
      .slice(0, 30)
      .map((l) => ({ loanAmount: l.loanAmount, probability: l.probability }))
      .sort((a, b) => a.loanAmount - b.loanAmount);

    // Risk distribution via aggregation
    const riskAgg = await LoanApplication.aggregate([
      { $group: { _id: "$riskLevel", value: { $sum: 1 } } },
    ]);
    const riskMap = Object.fromEntries(riskAgg.map((r) => [r._id, r.value]));
    const riskDistribution = [
      { label: "High Risk",   value: riskMap["HIGH"]   ?? 0 },
      { label: "Medium Risk", value: riskMap["MEDIUM"] ?? 0 },
      { label: "Low Risk",    value: riskMap["LOW"]    ?? 0 },
    ];

    res.json({ featureImportance, creditScoreVsRisk, loanAmountVsRisk, riskDistribution });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


export default router;