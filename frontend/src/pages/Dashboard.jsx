import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import {
  PieChart, Pie, Cell, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { FileText, IndianRupee, Activity, CheckCircle2, TrendingUp } from "lucide-react";

const PIE_COLORS = ["#dc2626", "#d97706", "#16a34a"];
const BAR_COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#2563eb"];
const fmt = v => new Intl.NumberFormat("en-IN", { style:"currency", currency:"INR", notation:"compact", maximumFractionDigits:1 }).format(v);

export default function Dashboard() {
  const { data: summary } = useQuery({ queryKey:["summary"], queryFn:()=>api.get("/analytics/summary") });
  const { data: charts  } = useQuery({ queryKey:["charts"],  queryFn:()=>api.get("/analytics/charts") });

  const stats = [
    { label:"Total Applications", value: summary?.totalLoans ?? "—",                                   icon: FileText,     accent: "#3b82f6" },
    { label:"Total Loan Value",   value: summary?.totalLoanValue ? fmt(summary.totalLoanValue) : "₹0", icon: IndianRupee,   accent: "#16a34a" },
    { label:"Approval Rate",      value: summary ? `${summary.approvalRate.toFixed(1)}%` : "0%",       icon: CheckCircle2, accent: "#8b5cf6" },
    { label:"Avg Credit Score",   value: summary?.avgCreditScore ? Math.round(summary.avgCreditScore) : "—", icon: Activity, accent: "#d97706" },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1>Portfolio Overview</h1>
        <p>Real-time risk analytics and loan application metrics.</p>
      </div>

      <div className="stats-grid">
        {stats.map(({ label, value, icon: Icon, accent }) => (
          <div key={label} className="stat-card">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div className="label">{label}</div>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `${accent}12`, display:"flex", alignItems:"center", justifyContent:"center"
              }}>
                <Icon size={18} color={accent} />
              </div>
            </div>
            <div className="value">{value}</div>
          </div>
        ))}
      </div>

      <div className="charts-grid" style={{ gridTemplateColumns: "1fr 1.5fr", marginBottom: 20 }}>
        <div className="card">
          <div className="card-header"><h2>Risk Distribution</h2></div>
          <div className="card-body" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={charts?.riskDistribution||[]} cx="50%" cy="50%"
                  innerRadius={60} outerRadius={100} dataKey="value" nameKey="label" paddingAngle={3}
                  strokeWidth={0}>
                  {(charts?.riskDistribution||[]).map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip
                  formatter={v=>[`${v} loans`]}
                  contentStyle={{ borderRadius:10, border:"1px solid #e2e8f0", boxShadow:"0 4px 12px rgba(0,0,0,0.08)" }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12, color: "#64748b" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h2>Approval Trend by Risk Level</h2></div>
          <div className="card-body" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts?.approvalTrend||[]} margin={{ top:5, right:20, left:0, bottom:5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} style={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} style={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius:10, border:"1px solid #e2e8f0", boxShadow:"0 4px 12px rgba(0,0,0,0.08)" }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="low"    name="Low Risk"    stroke="#16a34a" strokeWidth={2.5} dot={{ r:4, fill:"#16a34a" }} activeDot={{ r:6 }} />
                <Line type="monotone" dataKey="medium" name="Medium Risk" stroke="#d97706" strokeWidth={2.5} dot={{ r:4, fill:"#d97706" }} activeDot={{ r:6 }} />
                <Line type="monotone" dataKey="high"   name="High Risk"   stroke="#dc2626" strokeWidth={2.5} dot={{ r:4, fill:"#dc2626" }} activeDot={{ r:6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="charts-grid" style={{ gridTemplateColumns: "1fr" }}>
        <div className="card">
          <div className="card-header">
            <h2>Income Range vs Default Rate</h2>
            <p>Default probability segmented by borrower income bracket</p>
          </div>
          <div className="card-body" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.incomeVsDefaultRisk||[]} margin={{ top:10, right:20, left:0, bottom:5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="incomeRange" axisLine={false} tickLine={false} style={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} unit="%" style={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius:10, border:"1px solid #e2e8f0", boxShadow:"0 4px 12px rgba(0,0,0,0.08)" }}
                  formatter={(v, name) => [`${Number(v).toFixed(1)}%`, name === "defaultRate" ? "Default Rate" : name]}
                />
                <Bar dataKey="defaultRate" name="Default Rate" radius={[8, 8, 0, 0]} maxBarSize={56}>
                  {(charts?.incomeVsDefaultRisk||[]).map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}