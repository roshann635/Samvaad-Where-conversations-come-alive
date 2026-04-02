import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { resendVerificationEmail, verifyEmail } from "../services/api";
import { ArrowRight } from "lucide-react";
import "./Auth.css";

const EmailVerification = () => {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const prefillEmail = location.state?.email;

  useEffect(() => {
    if (prefillEmail) {
      setEmail(prefillEmail);
    }
  }, [prefillEmail]);

  const handleResend = async () => {
    setError("");
    setMessage("");
    if (!email) {
      setError("Please enter email to resend verification");
      return;
    }
    setLoading(true);
    try {
      await resendVerificationEmail(email);
      setMessage("Verification link sent to your email.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend verification");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!email || !token) {
      setError("Email and token are required");
      return;
    }
    setLoading(true);
    try {
      await verifyEmail(email, token);
      setMessage("Email verified successfully. You can now log in.");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Email verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-form-section">
        <div className="auth-form-container animate-fade-in-up">
          <h1 className="auth-title">Verify Email</h1>
          <p className="auth-subtitle">
            Enter the 6-digit verification code (OTP) sent to your email.
          </p>

          {error && (
            <div className="auth-error animate-fade-in-down">
              <span>{error}</span>
            </div>
          )}
          {message && (
            <div className="auth-success animate-fade-in-down">
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleVerify} className="auth-form">
            <div className="input-group">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="input-group">
              <label htmlFor="token">Verification Code (OTP)</label>
              <input
                id="token"
                type="text"
                className="input-field"
                placeholder="Enter code from email"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                autoComplete="one-time-code"
                maxLength={6}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg auth-submit"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify Email"}
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-lg auth-submit"
              onClick={handleResend}
              disabled={loading}
              style={{ marginTop: "0.75rem" }}
            >
              Resend verification email
            </button>

            <button
              type="button"
              className="btn btn-link"
              onClick={() => navigate("/login")}
              style={{ marginTop: "0.75rem" }}
            >
              Back to login <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
