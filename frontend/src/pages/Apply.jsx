import { useState } from "react";
import { useLocation } from "wouter";
import { api } from "../api/client";
import { ArrowRight, Clock, AlertTriangle, CheckCircle, Info } from "lucide-react";

export default function Apply() {
  const [, setLocation] = useLocation();

  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "",
    employmentStatus: "",
    income: "",
    creditScore: "",
    loanAmount: "",
    loanTerm: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const riskKeyToCss = (riskLevel) => {
    if (!riskLevel) return "low";
    if (riskLevel === "HIGH") return "high";
    if (riskLevel === "MEDIUM") return "medium";
    return "low";
  };

  const riskIcon = (riskLevel) => {
    if (riskLevel === "HIGH") return <AlertTriangle size={20} />;
    if (riskLevel === "MEDIUM") return <Clock size={20} />;
    return <CheckCircle size={20} />;
  };

  const onChange = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const loan = await api.post("/loans/apply", {
        name: form.name.trim(),
        age: Number(form.age),
        gender: form.gender,
        employmentStatus: form.employmentStatus,
        income: Number(form.income),
        creditScore: Number(form.creditScore),
        loanAmount: Number(form.loanAmount),
        loanTerm: Number(form.loanTerm),
      });
      setResult(loan);
    } catch (err) {
      setError(err.message || "Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  const riskLevel = result?.riskLevel || null;
  const riskCss = riskKeyToCss(riskLevel);
  const probabilityPct =
    result?.probability === null || result?.probability === undefined
      ? null
      : `${(Number(result.probability) * 100).toFixed(1)}%`;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Application Entry & Prediction</h1>
        <p>Enter applicant details to run the risk assessment model.</p>
      </div>

      <div className="charts-grid" style={{ gridTemplateColumns: "1.1fr 0.9fr" }}>
        <div className="card">
          <div className="card-header">
            <h2>Application Form</h2>
            <p>Fill out all required fields to generate a risk prediction.</p>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-section-title">Borrower Information</div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    value={form.name}
                    onChange={onChange("name")}
                    placeholder="John Doe"
                    required
                    type="text"
                  />
                </div>

                <div className="form-group">
                  <label>Age</label>
                  <input
                    value={form.age}
                    onChange={onChange("age")}
                    placeholder="30"
                    required
                    type="number"
                    min={18}
                  />
                </div>

                <div className="form-group">
                  <label>Gender</label>
                  <select value={form.gender} onChange={onChange("gender")} required>
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Employment Status</label>
                  <select value={form.employmentStatus} onChange={onChange("employmentStatus")} required>
                    <option value="">Select status</option>
                    <option value="employed">Employed</option>
                    <option value="self_employed">Self Employed</option>
                    <option value="unemployed">Unemployed</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
              </div>

              <div style={{ height: 16 }} />
              <div className="form-section-title">Financial Information</div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Annual Income (₹)</label>
                  <input
                    value={form.income}
                    onChange={onChange("income")}
                    placeholder="60000"
                    required
                    type="number"
                    min={0}
                  />
                </div>

                <div className="form-group">
                  <label>Credit Score</label>
                  <input
                    value={form.creditScore}
                    onChange={onChange("creditScore")}
                    placeholder="650"
                    required
                    type="number"
                    min={300}
                    max={850}
                  />
                </div>

                <div className="form-group">
                  <label>Loan Amount (₹)</label>
                  <input
                    value={form.loanAmount}
                    onChange={onChange("loanAmount")}
                    placeholder="100000"
                    required
                    type="number"
                    min={0}
                  />
                </div>

                <div className="form-group">
                  <label>Loan Term (Months)</label>
                  <input
                    value={form.loanTerm}
                    onChange={onChange("loanTerm")}
                    placeholder="36"
                    required
                    type="number"
                    min={1}
                  />
                </div>
              </div>

              {error ? <div className="login-error" style={{ marginTop: 16 }}>{error}</div> : null}

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
                <button className="btn btn-primary" type="submit" disabled={loading}>
                  {loading ? "Running Prediction..." : (
                    <>
                      Predict Risk & Submit <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-header" style={{
            background: result
              ? (riskLevel === "HIGH" ? "rgba(220,38,38,0.06)" : riskLevel === "MEDIUM" ? "rgba(217,119,6,0.06)" : "rgba(22,163,74,0.06)")
              : undefined
          }}>
            <h2>Risk Assessment Result</h2>
          </div>
          <div className="card-body">
            {!result ? (
              <div className="empty-state">
                <div style={{
                  display: "flex", justifyContent: "center", marginBottom: 14,
                }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 14,
                    background: "rgba(59, 130, 246, 0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    <Clock size={24} color="#3b82f6" />
                  </div>
                </div>
                <h3>No Prediction Yet</h3>
                <p style={{ fontSize: 13, color: "#64748b", maxWidth: 260, margin: "0 auto" }}>
                  Fill out the application form and submit to run the risk assessment model.
                </p>
              </div>
            ) : (
              <div>
                <div className={`risk-assessment-card ${riskCss}`}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                    <span className={`badge ${
                      riskLevel === "HIGH" ? "badge-high" : riskLevel === "MEDIUM" ? "badge-medium" : "badge-low"
                    }`} style={{ fontSize: 12, padding: "5px 14px" }}>
                      {riskIcon(riskLevel)}
                      <span style={{ marginLeft: 6 }}>{riskLevel || "LOW"} RISK</span>
                    </span>
                  </div>
                  <div className="risk-prob" style={{ marginTop: 8 }}>{probabilityPct}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.06, color: "#64748b", marginTop: 4, textTransform: "uppercase" }}>
                    Default Probability
                  </div>
                </div>

                <div className="detail-grid" style={{ marginTop: 20 }}>
                  <div className="info-item">
                    <div className="info-label">Debt-to-Income</div>
                    <div className="info-value">{result.debtToIncomeRatio != null ? result.debtToIncomeRatio.toFixed(2) : "—"}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Credit Utilization</div>
                    <div className="info-value">
                      {result.creditUtilization != null ? (Number(result.creditUtilization) * 100).toFixed(1) + "%" : "—"}
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Status</div>
                    <div className="info-value" style={{ textTransform: "capitalize" }}>{result.status}</div>
                  </div>
                </div>

                <div className="recommendation-text">
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, marginBottom: 8 }}>
                    <Info size={14} color="#3b82f6" />
                    Recommendation
                  </div>
                  {result.recommendation || "—"}
                </div>

                <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
                  <button
                    className="btn btn-outline"
                    type="button"
                    style={{ flex: 1, justifyContent: "center" }}
                    onClick={() => {
                      setResult(null);
                      setForm({
                        name: "", age: "", gender: "", employmentStatus: "",
                        income: "", creditScore: "", loanAmount: "", loanTerm: "",
                      });
                    }}
                  >
                    Start New Application
                  </button>
                  <button
                    className="btn btn-primary"
                    type="button"
                    style={{ flex: 1, justifyContent: "center" }}
                    onClick={() => setLocation(`/loans/${result._id}`)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
