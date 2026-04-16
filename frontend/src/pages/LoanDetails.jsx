import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { Link } from "wouter";
import { Building } from "lucide-react";

const PIE_COLORS = ["#dc2626", "#d97706", "#16a34a"];

function riskCss(riskLevel) {
  if (riskLevel === "HIGH") return "high";
  if (riskLevel === "MEDIUM") return "medium";
  return "low";
}

export default function LoanDetails({ id }) {
  const {
    data: loan,
    isLoading: loanLoading,
    error: loanError,
  } = useQuery({
    queryKey: ["loan", id],
    enabled: !!id,
    queryFn: () => api.get(`/loans/${id}`),
  });

  const {
    data: analytics,
    isLoading: analyticsLoading,
    error: analyticsError,
  } = useQuery({
    queryKey: ["loanAnalytics", id],
    enabled: !!id,
    queryFn: () => api.get(`/analytics/loan/${id}`),
  });

  const riskLevel = loan?.riskLevel || null;
  const css = riskCss(riskLevel);

  const probabilityPct = useMemo(() => {
    if (loan?.probability === null || loan?.probability === undefined) return null;
    return `${(Number(loan.probability) * 100).toFixed(1)}%`;
  }, [loan?.probability]);

  const chartRiskDistribution = analytics?.riskDistribution || [];

  return (
    <div className="page">
      <div className="page-header">
        <h1>Loan Application Details</h1>
        <p>Review the prediction output and interpret key drivers.</p>
      </div>

      {loanError ? (
        <div className="login-error">{loanError.message || "Failed to load loan"}</div>
      ) : null}

      {loanLoading ? (
        <div className="empty-state">
          <h3>Loading...</h3>
          <p style={{ fontSize: 13, color: "#64748b" }}>Fetching loan details.</p>
        </div>
      ) : loan ? (
        <div>
          <div className="charts-grid" style={{ gridTemplateColumns: "1fr 2fr", marginBottom: 20 }}>
            <div className="card">
              <div className="card-header">
                <h2>{loan.name || "Applicant"}</h2>
              </div>
              <div className="card-body">
                {loan.probability == null || probabilityPct == null ? (
                  <div className="empty-state">
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
                      <Building size={22} color="#94a3b8" />
                    </div>
                    <h3>No Prediction Yet</h3>
                    <p style={{ fontSize: 13, color: "#64748b" }}>
                      Fill out the application form and submit to run the risk assessment model.
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className={`risk-assessment-card ${css}`}>
                      <div className="risk-prob">{probabilityPct}</div>
                      <div style={{ fontSize: 13, fontWeight: 800, marginTop: 4, letterSpacing: 0.02 }}>
                        DEFAULT PROBABILITY
                      </div>
                      <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
                        <span className={`badge badge-${css}`}>
                          {riskLevel || "LOW"} RISK
                        </span>
                      </div>
                    </div>

                    <div className="detail-grid" style={{ marginTop: 16 }}>
                      <div className="info-item">
                        <div className="info-label">Debt-to-Income</div>
                        <div className="info-value">
                          {loan.debtToIncomeRatio != null ? Number(loan.debtToIncomeRatio).toFixed(2) : "—"}
                        </div>
                      </div>
                      <div className="info-item">
                        <div className="info-label">Credit Score</div>
                        <div className="info-value">{loan.creditScore ?? "—"}</div>
                      </div>
                      <div className="info-item">
                        <div className="info-label">Employment Status</div>
                        <div className="info-value">
                          {loan.employmentStatus ? loan.employmentStatus.replaceAll("_", " ") : "—"}
                        </div>
                      </div>
                    </div>

                    <div className="recommendation-text">
                      <div style={{ fontWeight: 800, marginBottom: 6 }}>Recommendation</div>
                      {loan.recommendation || "—"}
                    </div>

                    <div style={{ marginTop: 16 }}>
                      <Link href="/loans" className="btn btn-outline">
                        Back to Records
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2>Risk Analytics</h2>
              </div>
              <div className="card-body">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div style={{ height: 260 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#334155", marginBottom: 8 }}>
                      Risk Distribution
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartRiskDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={95}
                          dataKey="value"
                          nameKey="label"
                          paddingAngle={2}
                        >
                          {chartRiskDistribution.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => [`${v} loans`, ""]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={{ height: 260 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#334155", marginBottom: 8 }}>
                      Feature Importance (Model Drivers)
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics?.featureImportance || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="feature" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: 8 }} />
                        <Bar dataKey="importance" fill="#2563eb" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div style={{ height: 280, marginTop: 18 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#334155", marginBottom: 8 }}>
                    Credit Score vs Default Probability
                  </div>
                  {analyticsLoading ? (
                    <div className="empty-state" style={{ padding: 40 }}>
                      <h3>Loading chart data...</h3>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={analytics?.creditScoreVsRisk || []}
                        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="creditScore" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: 8 }} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="probability"
                          name="Default Probability"
                          stroke="#d97706"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {analyticsError ? (
                  <div className="login-error" style={{ marginTop: 12 }}>
                    {analyticsError.message || "Failed to load analytics"}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

