import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiArrowLeft } from "react-icons/fi";
import logoMark from "../assets/japa-logo.png";
import "./Auth.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    try {
      const userData = await login(email, password);
      if (userData?.role === "TRAVEL_AGENT") {
        navigate("/agent/home");
      } else {
        navigate("/home");
      }
    } catch (err) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      const userData = await loginWithGoogle();
      if (userData?.role === "TRAVEL_AGENT") {
        navigate("/agent/home");
      } else {
        navigate("/home");
      }
    } catch (err) {
      setError(err.message || "Google sign-in failed");
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-redesign">
      {/* Animated Background */}
      <div className="auth-ambient">
        <div className="auth-orb auth-orb-1"></div>
        <div className="auth-orb auth-orb-2"></div>
        <div className="auth-orb auth-orb-3"></div>
        <div className="auth-grid-pattern"></div>
        <div className="auth-noise"></div>
      </div>

      {/* Back to Home */}
      <motion.div
        className="auth-back-link"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Link to="/">
          <FiArrowLeft />
          <span>Back to home</span>
        </Link>
      </motion.div>

      {/* Main Content */}
      <div className="auth-content">
        <motion.div
          className="auth-card"
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Logo & Header */}
          <div className="auth-card-header">
            <Link to="/" className="auth-logo">
              <img src={logoMark} alt="JAPA" />
            </Link>
            <h1>Welcome back</h1>
            <p>Sign in to continue your migration journey</p>
          </div>

          {/* Google OAuth */}
          <motion.button
            type="button"
            className="auth-google-btn"
            onClick={handleGoogleSignIn}
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Continue with Google</span>
          </motion.button>

          {/* Divider */}
          <div className="auth-divider">
            <span>or continue with email</span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <motion.div
                className="auth-error"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.div>
            )}

            <div className="auth-input-group">
              <label htmlFor="email">Email address</label>
              <div className="auth-input-wrapper">
                <FiMail className="auth-input-icon" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="auth-input-group">
              <label htmlFor="password">Password</label>
              <div className="auth-input-wrapper">
                <FiLock className="auth-input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={loading}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <span className="auth-loading">
                  <span className="auth-spinner"></span>
                  Signing in...
                </span>
              ) : (
                <>
                  <span>Sign in</span>
                  <FiArrowRight />
                </>
              )}
            </motion.button>
          </form>

          {/* Footer */}
          <div className="auth-card-footer">
            <p>
              Don't have an account?{" "}
              <Link to="/register">Create one</Link>
            </p>
          </div>
        </motion.div>

        {/* Side Info */}
        <motion.div
          className="auth-side-info"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="auth-feature">
            <div className="auth-feature-icon">🌍</div>
            <div className="auth-feature-text">
              <h3>195+ Countries</h3>
              <p>Visa pathways covered worldwide</p>
            </div>
          </div>
          <div className="auth-feature">
            <div className="auth-feature-icon">🤖</div>
            <div className="auth-feature-text">
              <h3>AI-Powered</h3>
              <p>Personalized recommendations</p>
            </div>
          </div>
          <div className="auth-feature">
            <div className="auth-feature-icon">📋</div>
            <div className="auth-feature-text">
              <h3>Smart Checklists</h3>
              <p>Never miss a document</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Login;
