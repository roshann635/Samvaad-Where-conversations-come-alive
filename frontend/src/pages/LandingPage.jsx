import { Link } from "react-router-dom";
import {
  MessageCircle,
  Users,
  Shield,
  Zap,
  Bell,
  Lock,
  ArrowRight,
  Star,
  ChevronRight,
  Sparkles,
  Send,
  UserPlus,
  Hash,
  Smile,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./LandingPage.css";

const features = [
  {
    icon: <Zap size={24} />,
    title: "Real-Time Messaging",
    description:
      "Lightning-fast message delivery powered by WebSockets. Your conversations flow naturally without any delays.",
    color: "#f59e0b",
  },
  {
    icon: <Users size={24} />,
    title: "Group Conversations",
    description:
      "Create and join groups to collaborate with teams, friends, or communities. Stay connected with everyone.",
    color: "#6366f1",
  },
  {
    icon: <Bell size={24} />,
    title: "Live Notifications",
    description:
      "Never miss a message. Get instant notifications when someone joins, leaves, or sends a message in your group.",
    color: "#10b981",
  },
  {
    icon: <Shield size={24} />,
    title: "Secure Authentication",
    description:
      "Your account is protected with industry-standard JWT authentication and encrypted passwords.",
    color: "#ef4444",
  },
  {
    icon: <Lock size={24} />,
    title: "Admin Controls",
    description:
      "Group administrators have full control to create, manage, and moderate their communities.",
    color: "#8b5cf6",
  },
  {
    icon: <Smile size={24} />,
    title: "Typing Indicators",
    description:
      "See when someone is composing a message in real-time. Conversations feel alive and present.",
    color: "#3b82f6",
  },
];

const steps = [
  {
    step: "01",
    icon: <UserPlus size={28} />,
    title: "Create Your Account",
    description:
      "Sign up in seconds with just your name, email, and password. No complicated setup required.",
  },
  {
    step: "02",
    icon: <Hash size={28} />,
    title: "Join or Create Groups",
    description:
      "Browse available groups and join instantly, or create your own community as an admin.",
  },
  {
    step: "03",
    icon: <Send size={28} />,
    title: "Start Chatting",
    description:
      "Send messages that appear instantly for everyone in the group. Real-time, real conversations.",
  },
];

// const testimonials = [
//   {
//     name: 'Priya Sharma',
//     role: 'Product Designer',
//     content: 'Samvaad has completely transformed how our design team communicates. The real-time experience is flawless.',
//     avatar: 'PS',
//     color: '#6366f1',
//   },
//   {
//     name: 'Arjun Patel',
//     role: 'Software Engineer',
//     content: 'The group chat system is incredibly intuitive. We switched from Slack for our side projects and never looked back.',
//     avatar: 'AP',
//     color: '#10b981',
//   },
//   {
//     name: 'Kavya Reddy',
//     role: 'Startup Founder',
//     content: 'Clean, fast, and exactly what we needed. The admin controls give me peace of mind managing our community.',
//     avatar: 'KR',
//     color: '#f59e0b',
//   },
// ];

const LandingPage = () => {
  const { user } = useAuth();

  return (
    <div className="landing">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-gradient-1"></div>
          <div className="hero-gradient-2"></div>
          <div className="hero-grid"></div>
        </div>

        <div className="hero-content">
          <div className="hero-badge animate-fade-in-down">
            <Sparkles size={14} />
            <span>Real-time group chat platform</span>
          </div>

          <h1 className="hero-title animate-fade-in-up">
            Where Conversations
            <br />
            Come <span className="gradient-text">Alive</span>
          </h1>

          <p
            className="hero-subtitle animate-fade-in-up"
            style={{ animationDelay: "0.1s" }}
          >
            Samvaad brings people together with lightning-fast real-time
            messaging, powerful group management, and a beautifully crafted
            experience.
          </p>

          <div
            className="hero-actions animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            {user ? (
              <Link to="/chat" className="btn btn-primary btn-lg">
                Open Chat
                <ArrowRight size={18} />
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-lg">
                  Get Started Free
                  <ArrowRight size={18} />
                </Link>
                <a href="#features" className="btn btn-secondary btn-lg">
                  Explore Features
                </a>
              </>
            )}
          </div>

          <div
            className="hero-stats animate-fade-in-up"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="hero-stat">
              <span className="hero-stat-number">100%</span>
              <span className="hero-stat-label">Real-time</span>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat">
              <span className="hero-stat-number">Secure</span>
              <span className="hero-stat-label">JWT Auth</span>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat">
              <span className="hero-stat-number">∞</span>
              <span className="hero-stat-label">Groups</span>
            </div>
          </div>
        </div>

        {/* Floating chat mockup */}
        <div
          className="hero-mockup animate-fade-in-up"
          style={{ animationDelay: "0.4s" }}
        >
          <div className="mockup-window">
            <div className="mockup-header">
              <div className="mockup-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span className="mockup-title">
                <Hash size={14} /> general-chat
              </span>
            </div>
            <div className="mockup-body">
              <div className="mockup-message mockup-message-other">
                <div
                  className="mockup-avatar"
                  style={{ background: "#6366f1" }}
                >
                  A
                </div>
                <div className="mockup-bubble">
                  <span className="mockup-name">Arjun</span>
                  <p>Hey team! Has anyone tried the new feature? 🚀</p>
                  <span className="mockup-time">10:24 AM</span>
                </div>
              </div>
              <div className="mockup-message mockup-message-other">
                <div
                  className="mockup-avatar"
                  style={{ background: "#10b981" }}
                >
                  P
                </div>
                <div className="mockup-bubble">
                  <span className="mockup-name">Priya</span>
                  <p>
                    Yes! It's absolutely amazing. The real-time sync is so
                    smooth ✨
                  </p>
                  <span className="mockup-time">10:25 AM</span>
                </div>
              </div>
              <div className="mockup-message mockup-message-self">
                <div className="mockup-bubble mockup-bubble-self">
                  <p>Just deployed the update. Check it out!</p>
                  <span className="mockup-time">10:26 AM</span>
                </div>
              </div>
              <div className="mockup-typing">
                <div
                  className="mockup-avatar-sm"
                  style={{ background: "#f59e0b" }}
                >
                  K
                </div>
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <div className="section-container">
          <div className="section-header">
            <span className="section-badge">
              <Sparkles size={14} />
              Features
            </span>
            <h2 className="section-title">
              Everything you need for
              <br />
              <span className="gradient-text">seamless communication</span>
            </h2>
            <p className="section-subtitle">
              Samvaad is packed with powerful features designed to make group
              communication effortless and enjoyable.
            </p>
          </div>

          <div className="features-grid stagger-children">
            {features.map((feature, index) => (
              <div className="feature-card" key={index}>
                <div
                  className="feature-icon"
                  style={{
                    background: `${feature.color}15`,
                    color: feature.color,
                  }}
                >
                  {feature.icon}
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-section" id="how-it-works">
        <div className="section-container">
          <div className="section-header">
            <span className="section-badge">
              <Sparkles size={14} />
              How It Works
            </span>
            <h2 className="section-title">
              Get started in
              <br />
              <span className="gradient-text">three simple steps</span>
            </h2>
          </div>

          <div className="steps-grid stagger-children">
            {steps.map((step, index) => (
              <div className="step-card" key={index}>
                <div className="step-number">{step.step}</div>
                <div className="step-icon-wrap">{step.icon}</div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>
                {index < steps.length - 1 && (
                  <div className="step-connector">
                    <ChevronRight size={20} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials
      <section className="testimonials-section" id="testimonials">
        <div className="section-container">
          <div className="section-header">
            <span className="section-badge">
              <Star size={14} />
              Testimonials
            </span>
            <h2 className="section-title">
              Loved by teams
              <br /><span className="gradient-text">everywhere</span>
            </h2>
          </div>

          <div className="testimonials-grid stagger-children">
            {testimonials.map((testimonial, index) => (
              <div className="testimonial-card" key={index}>
                <div className="testimonial-stars">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill="#f59e0b" color="#f59e0b" />
                  ))}
                </div>
                <p className="testimonial-content">"{testimonial.content}"</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar" style={{ background: testimonial.color }}>
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="testimonial-name">{testimonial.name}</div>
                    <div className="testimonial-role">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* CTA Section */}
      <section className="cta-section">
        <div className="section-container">
          <div className="cta-card">
            <div className="cta-bg">
              <div className="cta-gradient-1"></div>
              <div className="cta-gradient-2"></div>
            </div>
            <div className="cta-content">
              <h2 className="cta-title">Ready to start your conversation?</h2>
              <p className="cta-subtitle">
                Join Samvaad today and experience the future of group
                communication.
              </p>
              <div className="cta-actions">
                {user ? (
                  <Link to="/chat" className="btn btn-primary btn-lg">
                    Open Chat
                    <ArrowRight size={18} />
                  </Link>
                ) : (
                  <Link to="/register" className="btn btn-primary btn-lg">
                    Get Started Free
                    <ArrowRight size={18} />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="section-container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="navbar-brand">
                <div className="brand-icon">
                  <MessageCircle size={20} />
                </div>
                <span className="brand-text">Samvaad</span>
              </div>
              <p className="footer-tagline">Where conversations come alive.</p>
            </div>
            <div className="footer-links">
              <a href="#features">Features</a>
              <a href="#how-it-works">How It Works</a>
              <a href="#testimonials">Testimonials</a>
            </div>
            <div className="footer-copyright">
              <p>
                © {new Date().getFullYear()} Samvaad. Built with ❤️ By Roshan
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
