import { useLocation, Link } from "wouter";
import { LayoutDashboard, FileText, List, Building, LogOut } from "lucide-react";

export default function Layout({ children }) {
  const [location, setLocation] = useLocation();
  const userName = localStorage.getItem("lendingUserName") || "Analyst";

  const handleLogout = () => {
    localStorage.removeItem("lendingToken");
    localStorage.removeItem("lendingUserName");
    setLocation("/login");
  };

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/apply", label: "Apply Loan", icon: FileText },
    { href: "/loans", label: "Loan Records", icon: List },
  ];

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Building size={22} />
          LDRA
        </div>
        <nav className="sidebar-nav">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={location.startsWith(href) ? "active" : ""}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user">{userName}</div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}