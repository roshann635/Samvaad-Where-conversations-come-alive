import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  MessageCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import "./Auth.css";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await register(username, email, password, adminCode);
      navigate("/login", { state: { registered: true, isAdmin: !!adminCode } });
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-decoration">
        <div className="auth-deco-bg">
          <div className="auth-deco-gradient-1"></div>
          <div className="auth-deco-gradient-2"></div>
        </div>
        <div className="auth-deco-content">
          <div className="auth-deco-icon">
            <MessageCircle size={48} />
          </div>
          <h2 className="auth-deco-title">Join Samvaad today</h2>
          <p className="auth-deco-text">
            Create your account and start connecting with people in real-time
            group conversations.
          </p>
          <div className="auth-deco-features">
            <div className="auth-deco-feature">
              <Sparkles size={16} />
              <span>Free forever</span>
            </div>
            <div className="auth-deco-feature">
              <Sparkles size={16} />
              <span>No credit card needed</span>
            </div>
            <div className="auth-deco-feature">
              <Sparkles size={16} />
              <span>Instant access</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-form-section">
        <div className="auth-form-container animate-fade-in-up">
          <div className="auth-form-header">
            <Link to="/" className="auth-logo">
              <div className="brand-icon">
                <MessageCircle size={20} />
              </div>
              <span className="brand-text">Samvaad</span>
            </Link>
            <h1 className="auth-title">Create your account</h1>
            <p className="auth-subtitle">
              Already have an account?{" "}
              <Link to="/login" className="auth-link">
                Sign in
              </Link>
            </p>
          </div>

          {error && (
            <div className="auth-error animate-fade-in-down">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label htmlFor="username">Full Name</label>
              <div className="input-icon-wrapper">
                <User size={18} className="input-icon" />
                <input
                  id="username"
                  type="text"
                  className="input-field input-with-icon"
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="email">Email address</label>
              <div className="input-icon-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  id="email"
                  type="email"
                  className="input-field input-with-icon"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <div className="input-icon-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="input-field input-with-icon"
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="input-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-icon-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  className="input-field input-with-icon"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="adminCode">Admin access code (optional)</label>
              <input
                id="adminCode"
                type="text"
                className="input-field"
                placeholder="Enter admin secret to register as admin"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
              />
              <small style={{ color: "var(--gray-400)" }}>
                If you have a valid admin code, entering it will create an admin
                account and allow group creation.
              </small>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg auth-submit"
              disabled={loading}
            >
              {loading ? (
                <span className="btn-loading">
                  <span className="btn-spinner"></span>
                  Creating account...
                </span>
              ) : (
                <>
                  Create Account
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
