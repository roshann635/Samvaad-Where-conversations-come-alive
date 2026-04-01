import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MessageCircle, LogOut, Menu, X, Sparkles } from "lucide-react";
import "./Navbar.css";

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLanding = location.pathname === "/";
  const isChat = location.pathname === "/chat";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (isChat) return null;

  return (
    <nav
      className={`navbar ${scrolled ? "navbar-scrolled" : ""} ${isLanding ? "navbar-landing" : ""}`}
    >
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <div className="brand-icon">
            <MessageCircle size={22} />
          </div>
          <span className="brand-text">Samvaad</span>
        </Link>

        <div
          className={`navbar-links ${mobileOpen ? "navbar-links-open" : ""}`}
        >
          {isLanding && (
            <>
              <a
                href="#features"
                className="nav-link"
                onClick={() => setMobileOpen(false)}
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="nav-link"
                onClick={() => setMobileOpen(false)}
              >
                How It Works
              </a>
              {/* <a
                href="#testimonials"
                className="nav-link"
                onClick={() => setMobileOpen(false)}
              >
                Testimonials
              </a> */}
            </>
          )}

          {user ? (
            <div className="nav-auth">
              <Link
                to="/chat"
                className="btn btn-primary btn-sm"
                onClick={() => setMobileOpen(false)}
              >
                <Sparkles size={16} />
                Open Chat
              </Link>
              <button
                onClick={handleLogout}
                className="btn btn-ghost btn-sm nav-logout"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          ) : (
            <div className="nav-auth">
              <Link
                to="/login"
                className="btn btn-ghost btn-sm"
                onClick={() => setMobileOpen(false)}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="btn btn-primary btn-sm"
                onClick={() => setMobileOpen(false)}
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        <button
          className="navbar-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
