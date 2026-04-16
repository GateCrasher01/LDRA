import { useState } from "react";
import { useLocation } from "wouter";
import { api } from "../api/client";
import { Building, Loader, Shield } from "lucide-react";

export default function Login() {
  const [mode, setMode] = useState("login"); // "login" or "register"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let data;
      if (mode === "login") {
        data = await api.post("/auth/login", { email, password });
      } else {
        if (!name.trim()) {
          setError("Name is required for registration");
          setLoading(false);
          return;
        }
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%?&]).*$/;
        if (!passwordRegex.test(password)) {
          setError("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%?&)");
          setLoading(false);
          return;
        }
        data = await api.post("/auth/register", { name: name.trim(), email, password });
      }
      localStorage.setItem("lendingToken", data.token);
      localStorage.setItem("lendingUserName", data.user.name);
      setLocation("/dashboard");
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div style={{ display:"flex", justifyContent:"center" }}>
            <div style={{
              background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
              width: 56, height: 56, borderRadius: 14,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 16px rgba(30, 64, 175, 0.4)"
            }}>
              <Shield size={28} color="#fff" />
            </div>
          </div>
          <h1>LDRA</h1>
        </div>

        <div className="auth-toggle">
          <button
            type="button"
            className={mode === "login" ? "active" : ""}
            onClick={() => { setMode("login"); setError(""); }}
          >
            Login
          </button>
          <button
            type="button"
            className={mode === "register" ? "active" : ""}
            onClick={() => { setMode("register"); setError(""); }}
          >
            Register
          </button>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>
            {mode === "login" ? "Login" : "Create Account"}
          </div>
          <p style={{ color: "#64748b", fontSize: 13, marginBottom: 20 }}>
            {mode === "login"
              ? "Enter your credentials to access the platform"
              : "Register a new analyst account"}
          </p>

          {error && <div className="login-error">{error}</div>}

          {mode === "register" && (
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" placeholder="Sarah Chen" value={name}
                onChange={e => setName(e.target.value)} required />
            </div>
          )}
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" placeholder="analyst@firm.com" value={email}
              onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={password}
              onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary"
            style={{ width:"100%", justifyContent:"center", marginTop:10, padding: "13px 20px" }}
            disabled={loading}>
            {loading ? <span className="spinner" /> : null}
            {loading ? "Processing..." : (mode === "login" ? "Login" : "Create Account")}
          </button>
        </form>
      </div>
    </div>
  );
}