import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { User, LogOut, LayoutDashboard, HeartPulse, Menu, X, ArrowRight } from "lucide-react";

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleNavClick = (anchorId) => {
    setMobileMenuOpen(false);
    if (location.pathname !== "/") {
      navigate(`/#${anchorId}`);
      return;
    }
    const element = document.getElementById(anchorId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="navbar-header">
      <nav className="navbar" aria-label="Main Navigation">
        {/* Brand Logo */}
        <Link to="/" className="logo-link" onClick={() => handleNavClick("home")}>
          <div className="logo">
            <div className="logo-badge">
              <HeartPulse className="logo-icon" size={24} />
            </div>
            <div className="logo-text-group">
              <span className="logo-text">
                Heal<span className="logo-highlight">Talk</span>
              </span>
              <span className="logo-tagline">Connect. Communicate. Care.</span>
            </div>
          </div>
        </Link>

        {/* Desktop Nav Items */}
        <div className="nav-links desktop-only">
          <a
            href="#home"
            className="nav-item"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick("home");
            }}
          >
            Home
          </a>
          <a
            href="#about"
            className="nav-item"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick("about");
            }}
          >
            About
          </a>
          <a
            href="#services"
            className="nav-item"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick("services");
            }}
          >
            Services
          </a>
          <a
            href="#how-it-works"
            className="nav-item"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick("how-it-works");
            }}
          >
            How It Works
          </a>
        </div>

        {/* Desktop Auth Section */}
        <div className="desktop-only">
          {isAuthenticated ? (
            <div className="auth-user-nav">
              <Link to="/dashboard" className="nav-dashboard-link">
                <LayoutDashboard size={17} />
                <span>Dashboard</span>
              </Link>
              <div className="user-pill">
                <User size={15} />
                <span className="user-name">{user?.name || "User"}</span>
                <span className="role-tag">{user?.role || "patient"}</span>
              </div>
              <button onClick={handleLogout} className="logout-btn" title="Logout">
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="auth-actions">
              <Link to="/login" className="login-link-btn" id="nav-login-btn">
                Login
              </Link>
              <Link to="/register" className="register-btn" id="nav-get-started-btn">
                <span>Get Started</span>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer">
          <div className="mobile-nav-links">
            <a
              href="#home"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick("home");
              }}
            >
              Home
            </a>
            <a
              href="#about"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick("about");
              }}
            >
              About
            </a>
            <a
              href="#services"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick("services");
              }}
            >
              Services
            </a>
            <a
              href="#how-it-works"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick("how-it-works");
              }}
            >
              How It Works
            </a>
          </div>

          <div className="mobile-auth-section">
            {isAuthenticated ? (
              <div className="mobile-user-box">
                <div className="user-pill">
                  <User size={15} />
                  <span>{user?.name || "User"}</span>
                  <span className="role-tag">{user?.role || "patient"}</span>
                </div>
                <Link
                  to="/dashboard"
                  className="primary-btn w-full"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LayoutDashboard size={18} />
                  <span>Open Dashboard</span>
                </Link>
                <button onClick={handleLogout} className="logout-btn w-full">
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="mobile-auth-buttons">
                <Link
                  to="/login"
                  className="secondary-btn w-full"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="primary-btn w-full"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
