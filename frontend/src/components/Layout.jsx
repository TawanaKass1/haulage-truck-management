import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { NotificationBell } from "./NotificationBell.jsx";

export const Layout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const navItems = user?.role === 'admin' ? [
    { path: "/admin", label: "Dashboard", icon: "📊" },
    { path: "/admin/trucks", label: "Trucks", icon: "🚛" },
    { path: "/admin/drivers", label: "Drivers", icon: "👨‍✈️" },
    { path: "/admin/jobs", label: "Jobs", icon: "📋" },
    { path: "/admin/assignments", label: "Assign", icon: "🔗" },
  ] : [
    { path: "/driver", label: "Dashboard", icon: "📊" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
      <div className="app-shell">
        <aside className="sidebar">
          <div>
            <p className="eyebrow">Marytechenock Solutions</p>
            <h1>Haulage Ops</h1>
            <p className="sidebar-copy">Manage fleet, drivers, and delivery jobs from one place.</p>
          </div>
          <nav className="nav-list">
            {navItems.map((item) => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/admin" || item.path === "/driver"}
                    className={({ isActive }) => isActive ? 'active' : ''}
                >
                  <span style={{ marginRight: '0.75rem' }}>{item.icon}</span>
                  {item.label}
                </NavLink>
            ))}
          </nav>
          <div className="sidebar-user">
            <div className="demo-box" style={{ marginBottom: '1rem', background: 'rgba(255,255,255,0.1)' }}>
              <p><strong>{user?.name}</strong></p>
              <p className="muted" style={{ fontSize: '0.85rem' }}>{user?.email}</p>
              <p className="eyebrow">{user?.role === 'admin' ? 'Administrator' : 'Driver'}</p>
            </div>
            <button
                type="button"
                className="logout-button"
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 59, 48, 0.2)',
                  border: '1px solid rgba(255, 59, 48, 0.3)',
                  borderRadius: '12px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 59, 48, 0.4)';
                  e.currentTarget.style.borderColor = 'rgba(255, 59, 48, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 59, 48, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(255, 59, 48, 0.3)';
                }}
            >
              🚪 Sign Out
            </button>
          </div>
        </aside>
        <main className="content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <p className="eyebrow">Fleet Control Center</p>
              <h2 style={{ margin: 0 }}>Run the full haulage operation from a single dashboard.</h2>
            </div>
            <NotificationBell />
          </div>
          <Outlet />
        </main>
      </div>
  );
};