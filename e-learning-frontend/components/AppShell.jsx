import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navigationByRole = {
  admin: [
    { label: "Dashboard", path: "/admin" },
    { label: "Manage Courses", path: "/admin/courses" },
    { label: "Enrollments", path: "/admin/enrollments" },
    { label: "Users", path: "/admin/users" }
  ],
  student: [
    { label: "Dashboard", path: "/dashboard" },
    { label: "My Courses", path: "/my-courses" },
    { label: "Certificates", path: "/certificates" },
    { label: "Browse Courses", path: "/courses" }
  ]
};

function AppShell() {
  const { user, logout } = useAuth();
  const navigation = navigationByRole[user?.role] || [];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="sidebar-title">CustomsLearn</div>
          <p className="sidebar-subtitle">Sri Lankan Customs training portal</p>
        </div>

        <nav className="sidebar-nav">
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div>
            <strong>{user?.name}</strong>
            <p>{user?.role}</p>
          </div>
          <button type="button" className="secondary-button" onClick={logout}>
            Logout
          </button>
        </div>
      </aside>

      <div className="shell-content">
        <header className="shell-header">
          <div>
            <p className="eyebrow">{user?.role === "admin" ? "Admin Workspace" : "Student Workspace"}</p>
            <h1>{user?.role === "admin" ? "Training Management" : "Learning Dashboard"}</h1>
          </div>
        </header>
        <main className="shell-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppShell;
