const ML_API_URL = process.env.ML_API_URL || "http://localhost:5001";

export async function predictLoanDefault(input) {
  try {
    const response = await fetch(`${ML_API_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error(`ML API status ${response.status}`);
    return await response.json();
  } catch {
    console.warn("ML API unavailable, using statistical fallback");
    return fallbackPredict(input);
  }
}

function fallbackPredict(input) {
  let score = 0;
  if (input.credit_score < 580) score += 0.35;
  else if (input.credit_score < 670) score += 0.20;
  else if (input.credit_score < 740) score += 0.10;
  else score -= 0.10;

  const dti = (input.loan_amount / input.loan_term) / (input.income / 12);
  if (dti > 0.5) score += 0.30;
  else if (dti > 0.35) score += 0.15;
  else if (dti > 0.20) score += 0.05;

  if (input.employment_status === "unemployed") score += 0.30;
  else if (input.employment_status === "self_employed") score += 0.10;
  else if (input.employment_status === "retired") score += 0.05;

  if (input.age < 25) score += 0.10;
  else if (input.age > 65) score += 0.05;

  const ratio = input.loan_amount / input.income;
  if (ratio > 5) score += 0.20;
  else if (ratio > 3) score += 0.10;

  score += (Math.random() - 0.5) * 0.05;
  const probability = Math.max(0.02, Math.min(0.97, 0.15 + score));
  return { prediction: probability > 0.5 ? 1 : 0, probability };
}

export function classifyRisk(probability) {
  if (probability > 0.7) return "HIGH";
  if (probability >= 0.4) return "MEDIUM";
  return "LOW";
}

export function generateRecommendation(riskLevel, probability) {
  const pct = (probability * 100).toFixed(1);
  if (riskLevel === "HIGH")
    return `Loan application should be declined. Default probability of ${pct}% exceeds acceptable threshold. Consider requesting additional collateral or a co-signer.`;
  if (riskLevel === "MEDIUM")
    return `Loan application requires further review. Default probability of ${pct}% is elevated. Recommend reducing loan amount or increasing term, and verify income documentation.`;
  return `Loan application is approved for processing. Default probability of ${pct}% is within acceptable range. Standard verification procedures apply.`;
}