import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function PublicLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="public-layout">
      <header className="public-header">
        <NavLink to="/" className="brand-mark">
          CustomsLearn
        </NavLink>
        <nav className="public-nav">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/courses">Courses</NavLink>
          {user ? (
            <>
              <NavLink to={user.role === "admin" ? "/admin" : "/dashboard"}>
                Dashboard
              </NavLink>
              <button type="button" className="text-button" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/register" className="nav-pill">
                Register
              </NavLink>
            </>
          )}
        </nav>
      </header>
      <main className="public-main">
        <Outlet />
      </main>
    </div>
  );
}

export default PublicLayout;
