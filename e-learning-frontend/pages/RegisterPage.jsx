import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function RegisterPage() {
  const { registerUser } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    adminSecret: ""
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

    const payload = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role
    };

    if (formData.role === "admin") {
      payload.adminSecret = formData.adminSecret;
    }

    const result = await registerUser(payload);
    setLoading(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    navigate(formData.role === "admin" ? "/admin" : "/dashboard");
  };

  return (
    <div className="form-wrapper">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div>
          <p className="eyebrow">Get Started</p>
          <h2>Create your account</h2>
          <p>Register as a student or admin for the customs learning platform.</p>
        </div>

        <label>
          Full Name
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Your full name"
            required
          />
        </label>

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
            placeholder="At least 6 characters"
            required
          />
        </label>

        <label>
          Role
          <select name="role" value={formData.role} onChange={handleChange}>
            <option value="student">Student</option>
            <option value="admin">Admin</option>
          </select>
        </label>

        {formData.role === "admin" ? (
          <label>
            Admin Registration Key
            <input
              type="password"
              name="adminSecret"
              value={formData.adminSecret}
              onChange={handleChange}
              placeholder="Enter admin key"
              required
            />
          </label>
        ) : null}

        {error ? <div className="alert error">{error}</div> : null}

        <button type="submit" className="primary-button" disabled={loading}>
          {loading ? "Creating account..." : "Register"}
        </button>

        <p className="helper-text">
          Already registered? <Link to="/login">Login here</Link>.
        </p>
      </form>
    </div>
  );
}

export default RegisterPage;
