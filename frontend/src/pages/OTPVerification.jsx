import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import "./Auth.css";

const EmailVerification = () => {
  const navigate = useNavigate();

  return (
    <div className="auth-page">
      <div className="auth-form-section">
        <div className="auth-form-container animate-fade-in-up">
          <h1 className="auth-title">Email Verification Disabled</h1>
          <p className="auth-subtitle">
            Email verification has been removed. You may log in directly.
          </p>
          <button
            type="button"
            className="btn btn-primary btn-lg auth-submit"
            onClick={() => navigate("/login")}
          >
            Back to login <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
