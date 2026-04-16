import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, useParams } from "wouter";
import Login    from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Apply    from "./pages/Apply";
import LoansList from "./pages/LoansList";
import LoanDetails from "./pages/LoanDetails";
import Layout   from "./components/Layout";

function ProtectedRoute({ component: Component, ...props }) {
  const [, setLocation] = useLocation();
  const token = localStorage.getItem("lendingToken");
  useEffect(() => { if (!token) setLocation("/login"); }, [token]);
  if (!token) {
    return (
      <div className="empty-state">
        <h3>Redirecting to login…</h3>
        <p style={{ fontSize: 13, color: "#64748b" }}>Please authenticate to access the dashboard.</p>
      </div>
    );
  }
  return <Layout><Component {...props} /></Layout>;
}

function DashboardProtected() {
  return <ProtectedRoute component={Dashboard} />;
}

function ApplyProtected() {
  return <ProtectedRoute component={Apply} />;
}

function LoansProtected() {
  return <ProtectedRoute component={LoansList} />;
}

function LoanDetailsProtected() {
  const params = useParams();
  return <ProtectedRoute component={LoanDetails} id={params.id} />;
}

function Router() {
  const [location, setLocation] = useLocation();
  useEffect(() => { if (location === "/") setLocation("/dashboard"); }, [location]);
  return (
    <Switch>
      <Route path="/login"        component={Login} />
      <Route path="/dashboard"   component={DashboardProtected} />
      <Route path="/apply"       component={ApplyProtected} />
      <Route path="/loans"       component={LoansProtected} />
      <Route path="/loans/:id"  component={LoanDetailsProtected} />
      <Route>{() => <div style={{padding:40,textAlign:"center",color:"#64748b"}}>404 — Page not found</div>}</Route>
    </Switch>
  );
}

export default function App() {
  return (
    <WouterRouter>
      <Router />
    </WouterRouter>
  );
}