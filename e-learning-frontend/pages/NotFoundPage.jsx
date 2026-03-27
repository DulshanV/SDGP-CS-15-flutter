import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <div className="center-panel">
      <div className="auth-card">
        <p className="eyebrow">404</p>
        <h2>Page not found</h2>
        <p>The page you requested does not exist or has been moved.</p>
        <Link to="/" className="primary-button">
          Return Home
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
