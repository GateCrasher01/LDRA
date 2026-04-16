import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { Search, Plus, Trash2, Check, X, Filter, Eye } from "lucide-react";

const formatINR = (val) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", notation: "compact", maximumFractionDigits: 1 }).format(val);

function getRiskBadgeClass(riskLevel) {
  if (riskLevel === "HIGH") return "badge-high";
  if (riskLevel === "MEDIUM") return "badge-medium";
  return "badge-low";
}

function getStatusBadgeClass(status) {
  if (!status) return "badge-pending";
  if (status === "pending") return "badge-pending";
  if (status === "approved") return "badge-approved";
  if (status === "rejected") return "badge-rejected";
  if (status === "under_review") return "badge-under_review";
  return "badge-pending";
}

function formatStatus(status) {
  if (!status) return "Pending";
  return status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

export default function LoansList() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [riskLevel, setRiskLevel] = useState("all");

  const requestPath = useMemo(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (riskLevel && riskLevel !== "all") params.set("riskLevel", riskLevel);
    params.set("sortBy", "createdAt");
    params.set("sortOrder", "desc");
    const qs = params.toString();
    return qs ? `/loans?${qs}` : "/loans";
  }, [search, riskLevel]);

  const { data: loans, isLoading, error } = useQuery({
    queryKey: ["loans", requestPath],
    queryFn: () => api.get(requestPath),
  });

  const handleDelete = async (id) => {
    const ok = window.confirm("Delete this loan application?");
    if (!ok) return;
    await api.delete(`/loans/${id}`);
    await queryClient.invalidateQueries({ queryKey: ["loans"], exact: false });
  };

  const updateStatus = async (id, status) => {
    await api.patch(`/loans/${id}/status`, { status });
    await queryClient.invalidateQueries({ queryKey: ["loans"], exact: false });
  };

  return (
    <div className="page">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
        <div>
          <h1>Loan Records</h1>
          <p>Manage and review all loan applications and their risk assessments.</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={() => setLocation("/apply")}>
          <Plus size={16} /> New Application
        </button>
      </div>

      <div className="card">
        <div className="search-bar">
          <div className="search-wrap">
            <Search size={15} />
            <input
              className="search-input"
              placeholder="Search applicant name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Filter size={14} color="#94a3b8" />
            <select
              className="filter-select"
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value)}
            >
              <option value="all">All Risk Levels</option>
              <option value="HIGH">High Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="LOW">Low Risk</option>
            </select>
          </div>
        </div>

        {error ? <div className="login-error" style={{ margin: 16 }}>{error.message || "Failed to load loans"}</div> : null}

        <div style={{ padding: 0 }}>
          {isLoading ? (
            <div className="empty-state">
              <div className="spinner" style={{ margin: "0 auto 16px", borderColor: "rgba(59,130,246,0.2)", borderTopColor: "#3b82f6" }} />
              <h3>Loading Records...</h3>
              <p style={{ fontSize: 13, color: "#64748b" }}>Fetching loan applications.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Income</th>
                  <th>Credit Score</th>
                  <th>Loan Amount</th>
                  <th>Risk Level</th>
                  <th>Status</th>
                  <th style={{ width: 200 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(loans || []).map((l) => (
                  <tr key={l._id}>
                    <td>
                      <Link href={`/loans/${l._id}`} style={{ fontWeight: 600, color: "#1e40af" }}>
                        {l.name}
                      </Link>
                    </td>
                    <td style={{ fontWeight: 500 }}>{formatINR(l.income ?? 0)}</td>
                    <td>{l.creditScore ?? "—"}</td>
                    <td style={{ fontWeight: 500 }}>{formatINR(l.loanAmount ?? 0)}</td>
                    <td>
                      <span className={`badge ${getRiskBadgeClass(l.riskLevel)}`}>
                        {l.riskLevel || "LOW"}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(l.status)}`}>
                        {formatStatus(l.status)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <Link className="btn btn-ghost btn-sm" href={`/loans/${l._id}`} title="View details">
                          <Eye size={14} /> View
                        </Link>
                        <button
                          className="btn btn-outline btn-sm"
                          type="button"
                          onClick={() => updateStatus(l._id, "approved")}
                          title="Approve"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          type="button"
                          onClick={() => updateStatus(l._id, "rejected")}
                          title="Reject"
                        >
                          <X size={14} />
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          type="button"
                          onClick={() => handleDelete(l._id)}
                          title="Delete record"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {(loans || []).length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <h3>No records found</h3>
                        <p style={{ fontSize: 13, color: "#64748b" }}>
                          Submit a new application to generate risk analytics.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
