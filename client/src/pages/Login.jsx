import { useState } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import {
  Mail,
  Lock,
  LogIn,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  User,
  Stethoscope,
  Languages,
} from "lucide-react";

function Login() {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get("role");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from?.pathname || "/dashboard";

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.email.trim() || !formData.password.trim()) {
      setError("Please fill in both email and password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await login(formData);
      setSuccess(response.message || "Login successful! Redirecting...");
      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 600);
    } catch (err) {
      setError(err.message || "Failed to log in. Please check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page-container">
      <Navbar />

      <main className="auth-main">
        <div className="auth-card animate-fade-in">
          {roleParam && (
            <div className="login-role-banner">
              <div className={`selected-role-pill pill-${roleParam}`}>
                {roleParam === "patient" && <User size={14} />}
                {roleParam === "doctor" && <Stethoscope size={14} />}
                {roleParam === "interpreter" && <Languages size={14} />}
                <span>
                  {roleParam === "patient" && "Patient Portal Login"}
                  {roleParam === "doctor" && "Doctor Portal Login"}
                  {roleParam === "interpreter" && "Interpreter Portal Login"}
                </span>
              </div>
            </div>
          )}

          <div className="auth-header">
            <div className="auth-icon-wrapper">
              <LogIn size={28} />
            </div>
            <h2>Welcome Back to HealTalk</h2>
            <p>
              {roleParam === "doctor"
                ? "Sign in to access your physician dashboard and appointments"
                : roleParam === "interpreter"
                ? "Sign in to join live interpretation sessions"
                : "Access your telemedicine portal and consultations"}
            </p>
          </div>

          {error && (
            <div className="auth-alert alert-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="auth-alert alert-success">
              <CheckCircle2 size={18} />
              <span>{success}</span>
            </div>
          )}

          {/* Quick Demo Account Selector for Consultation Testing */}
          <div
            style={{
              background: "#f0f7f8",
              border: "1px solid #d5eaec",
              borderRadius: "12px",
              padding: "12px 14px",
              marginBottom: "20px",
            }}
          >
            <span
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: "700",
                color: "#087f8c",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "8px",
              }}
            >
              Quick Demo Accounts (Click to Fill)
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
              <button
                type="button"
                onClick={() => {
                  setFormData({ email: "patient@healtalk.com", password: "Patient@123" });
                  if (error) setError("");
                }}
                style={{
                  background: formData.email === "patient@healtalk.com" ? "#087f8c" : "#ffffff",
                  color: formData.email === "patient@healtalk.com" ? "#ffffff" : "#1e293b",
                  border: "1px solid #d5eaec",
                  borderRadius: "8px",
                  padding: "6px 4px",
                  fontSize: "11px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                }}
              >
                <User size={12} />
                <span>Patient</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFormData({ email: "doctor@healtalk.com", password: "Doctor@123" });
                  if (error) setError("");
                }}
                style={{
                  background: formData.email === "doctor@healtalk.com" ? "#087f8c" : "#ffffff",
                  color: formData.email === "doctor@healtalk.com" ? "#ffffff" : "#1e293b",
                  border: "1px solid #d5eaec",
                  borderRadius: "8px",
                  padding: "6px 4px",
                  fontSize: "11px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                }}
              >
                <Stethoscope size={12} />
                <span>Doctor</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFormData({ email: "interpreter@healtalk.com", password: "Interpreter@123" });
                  if (error) setError("");
                }}
                style={{
                  background: formData.email === "interpreter@healtalk.com" ? "#087f8c" : "#ffffff",
                  color: formData.email === "interpreter@healtalk.com" ? "#ffffff" : "#1e293b",
                  border: "1px solid #d5eaec",
                  borderRadius: "8px",
                  padding: "6px 4px",
                  fontSize: "11px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                }}
              >
                <Languages size={12} />
                <span>Interpreter</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-with-icon">
                <Mail className="input-icon" size={18} />
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="form-group">
              <div className="label-row">
                <label htmlFor="password">Password</label>
              </div>
              <div className="input-with-icon">
                <Lock className="input-icon" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="btn-spinner-content">
                  <span className="mini-spinner"></span> Logging in...
                </span>
              ) : (
                "Log In"
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Don't have an account?{" "}
              <Link
                to={roleParam ? `/register?role=${roleParam}` : "/register"}
                className="auth-redirect-link"
              >
                Register here
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Login;
