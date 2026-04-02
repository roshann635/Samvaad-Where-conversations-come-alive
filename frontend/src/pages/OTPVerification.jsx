import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { sendOtp, verifyOtp } from "../services/api";
import { ArrowRight } from "lucide-react";
import "./Auth.css";

const OTPVerification = () => {
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const prefillMobile = location.state?.mobile;

  useEffect(() => {
    if (prefillMobile) {
      setMobile(prefillMobile);
    }
  }, [prefillMobile]);

  const handleSendOtp = async () => {
    setError("");
    setMessage("");
    if (!mobile) {
      setError("Please enter mobile number to send OTP");
      return;
    }
    setLoading(true);
    try {
      const { data } = await sendOtp(mobile);
      setMessage(`OTP sent to ${mobile}. (Test OTP: ${data.otp})`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!mobile || !otp) {
      setError("Mobile and OTP are required");
      return;
    }
    setLoading(true);
    try {
      await verifyOtp(mobile, otp);
      setMessage("Mobile verified successfully. You can now log in.");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-form-section">
        <div className="auth-form-container animate-fade-in-up">
          <h1 className="auth-title">Verify Phone Number</h1>
          <p className="auth-subtitle">
            Enter the OTP sent to your mobile number.
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
              <label htmlFor="mobile">Mobile Number</label>
              <input
                id="mobile"
                type="tel"
                className="input-field"
                placeholder="+1234567890"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                autoComplete="tel"
              />
            </div>

            <div className="input-group">
              <label htmlFor="otp">OTP Code</label>
              <input
                id="otp"
                type="text"
                className="input-field"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                autoComplete="one-time-code"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg auth-submit"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-lg auth-submit"
              onClick={handleSendOtp}
              disabled={loading}
              style={{ marginTop: "0.75rem" }}
            >
              Resend OTP
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

export default OTPVerification;
