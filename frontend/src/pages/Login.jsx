import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { sendOtp } from "../services/api";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Phone,
  MessageCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import "./Auth.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !mobile || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await login(email, password, adminCode, mobile);
      navigate("/chat");
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid email or password";
      setError(msg);
      if (msg === "Mobile not verified") {
        try {
          await sendOtp(mobile);
          navigate("/verify-otp", { state: { mobile } });
        } catch {
          // ignore
        }
      }
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
          <h2 className="auth-deco-title">Welcome back to Samvaad</h2>
          <p className="auth-deco-text">
            Continue your conversations and stay connected with your groups.
          </p>
          <div className="auth-deco-features">
            <div className="auth-deco-feature">
              <Sparkles size={16} />
              <span>Real-time messaging</span>
            </div>
            <div className="auth-deco-feature">
              <Sparkles size={16} />
              <span>Secure & encrypted</span>
            </div>
            <div className="auth-deco-feature">
              <Sparkles size={16} />
              <span>Group collaboration</span>
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
            <h1 className="auth-title">Sign in to your account</h1>
            <p className="auth-subtitle">
              Don't have an account?{" "}
              <Link to="/register" className="auth-link">
                Create one free
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
              <label htmlFor="email">Email address</label>
              <div className="input-icon-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  id="email"
                  type="email"
                  className="input-field input-with-icon"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="mobile">Mobile Number</label>
              <div className="input-icon-wrapper">
                <Phone size={18} className="input-icon" />
                <input
                  id="mobile"
                  type="tel"
                  className="input-field input-with-icon"
                  placeholder="+1234567890"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  autoComplete="tel"
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
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
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
              <label htmlFor="adminCode">Admin access code (optional)</label>
              <input
                id="adminCode"
                type="text"
                className="input-field"
                placeholder="Enter admin secret to enable admin rights"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
              />
              <small style={{ color: "var(--gray-400)" }}>
                If valid, this will elevate you to admin and allow group
                creation.
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
                  Signing in...
                </span>
              ) : (
                <>
                  Sign In
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

export default Login;
