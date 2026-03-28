import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const result = await loginUser(formData);
    setLoading(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    const fallbackPath = location.state?.from?.pathname;
    navigate(fallbackPath || "/dashboard");
  };

  return (
    <div className="form-wrapper">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div>
          <p className="eyebrow">Welcome Back</p>
          <h2>Login to your account</h2>
          <p>Use your student or admin credentials to continue.</p>
        </div>

        <label>
          Email
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
          />
        </label>

        {error ? <div className="alert error">{error}</div> : null}

        <button type="submit" className="primary-button" disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </button>

        <p className="helper-text">
          Need an account? <Link to="/register">Register here</Link>.
        </p>
      </form>
    </div>
  );
}

export default LoginPage;
