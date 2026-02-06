import React, { useState, useEffect } from 'react';

const LoginPage = ({ onBack, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // mock login
  const MOCK_EMAIL = "test@example.com";
  const MOCK_PASSWORD = "password123";

  
  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;

    const prevBodyMargin = body.style.margin;
    const prevBodyPadding = body.style.padding;
    const prevHtmlMargin = html.style.margin;
    const prevHtmlPadding = html.style.padding;

    body.style.margin = "0";
    body.style.padding = "0";
    html.style.margin = "0";
    html.style.padding = "0";

    return () => {
      body.style.margin = prevBodyMargin;
      body.style.padding = prevBodyPadding;
      html.style.margin = prevHtmlMargin;
      html.style.padding = prevHtmlPadding;
    };
  }, []);

  /** const handleLogin = (e) => {
    e.preventDefault();

    if (email === MOCK_EMAIL && password === MOCK_PASSWORD) {
      setError("");
      onLoginSuccess();
    } else {
      setError("Invalid email or password.");
    }
  }; */

  // replaced the mock login
  // now posts to localhost:5000/api/auth/login
  // async request -> store returned JWT token
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.msg || "Login failed.");
        return;
      }

      // returns { token } from backend
      if (data?.token) {
        if (rememberMe) {
          localStorage.setItem("token", data.token);
        } else {
          sessionStorage.setItem("token", data.token);
        }
      }

      onLoginSuccess(); 
    } catch (err) {
      setError("Could not connect to server. Is the backend running on port 5000?");
    }
  };

  return (
    <div style={styles.container}>
      
      
      <div style={styles.brandingSide}>
        <div style={styles.brandingContent}>
          <div style={styles.logo}>
            <svg style={styles.logoIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span style={styles.logoText}>NoteScan</span>
          </div>

          <h1 style={styles.brandingTitle}>Transform Your Handwritten Notes</h1>
          <p style={styles.brandingSubtitle}>
            Convert handwritten notes to digital text with AI-powered OCR technology
          </p>
        </div>
      </div>

      {/*login form*/}
      <div style={styles.formSide}>
        <button style={styles.backButton} onClick={onBack}>
        ← Back
        </button>

        <div style={styles.formContainer}>
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>Welcome back</h2>
            <p style={styles.formSubtitle}>Sign in to your account to continue</p>
          </div>

          <form style={styles.form} onSubmit={handleLogin}>

            {/* email */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                required
              />
            </div>

            {/* password */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>

              <div style={styles.passwordWrapper}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ ...styles.input, ...styles.passwordInput }}
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.showPasswordButton}
                >
                  {showPassword ? (
                    <svg style={styles.eyeIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg style={styles.eyeIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* options */}
            <div style={styles.formOptions}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={styles.checkbox}
                />
                <span>Remember me</span>
              </label>

              <a href="#" style={styles.forgotLink}>Forgot password?</a>
            </div>

            {/* error message */}
            {error && (
              <p style={{ textAlign: "center", color: "red", marginTop: 5 }}>{error}</p>
            )}

            {/* sign in button */}
            <button type="submit" style={styles.submitButton}>
              Sign in
            </button>
          </form>

          {/* sign up */}
          <p style={styles.signupPrompt}>
            Don’t have an account?{" "}
            <a href="#" style={styles.signupLink}>Sign up</a>
          </p>
        </div>
      </div>
    </div>
  );
};



const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    width: "100%",
    overflow: "hidden",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
  },
  backButton: {
  position: "absolute",
  top: "1.5rem",
  left: "1.5rem",
  background: "none",
  border: "none",
  color: "#4F46E5",
  fontSize: "1rem",
  fontWeight: "600",
  cursor: "pointer",
  padding: 0,
},


  brandingSide: {
    flex: 1,
    background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
    padding: "3rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    boxSizing: "border-box",
  },

  brandingContent: {
    maxWidth: "500px",
  },

  logo: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    marginBottom: "2rem",
  },

  logoIcon: {
    width: "40px",
    height: "40px",
  },

  logoText: {
    fontSize: "2rem",
    fontWeight: "700",
  },

  brandingTitle: {
    fontSize: "3rem",
    fontWeight: "700",
    marginBottom: "1.5rem",
    lineHeight: "1.2",
  },

  brandingSubtitle: {
    fontSize: "1.25rem",
    opacity: 0.9,
    lineHeight: "1.6",
    marginBottom: "2rem",
  },

  formSide: {
    flex: 1,
    backgroundColor: "white",
    padding: "3rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflowY: "auto",
    boxSizing: "border-box",
    position: "relative",   
  },

  formContainer: {
    width: "100%",
    maxWidth: "420px",
  },

  formHeader: {
    marginBottom: "2rem",
    textAlign: "center",
  },

  formTitle: {
    fontSize: "2rem",
    fontWeight: "700",
    marginBottom: "0.5rem",
    color: "#1F2937",
  },

  formSubtitle: {
    color: "#6B7280",
    fontSize: "1rem",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
  },

  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },

  label: {
    fontSize: "0.875rem",
    fontWeight: "500",
    color: "#374151",
  },

  input: {
    padding: "0.75rem",
    border: "1px solid #D1D5DB",
    borderRadius: "0.5rem",
    fontSize: "1rem",
    width: "100%",
    outline: "none",
    fontFamily: "inherit",
  },

  passwordWrapper: {
    width: "100%",
    position: "relative",
  },

  passwordInput: {
    paddingRight: "1rem",
  },

  showPasswordButton: {
    position: "absolute",
    top: "50%",
    right: "0.75rem",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
  },

  eyeIcon: {
    width: "20px",
    height: "20px",
    color: "#6B7280",
  },

  formOptions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "0.875rem",
  },

  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },

  checkbox: {
    width: "16px",
    height: "16px",
  },

  forgotLink: {
    color: "#4F46E5",
    textDecoration: "none",
    fontWeight: "500",
  },

  submitButton: {
    padding: "0.875rem",
    backgroundColor: "#4F46E5",
    color: "white",
    border: "none",
    borderRadius: "0.5rem",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
  },

  signupPrompt: {
    textAlign: "center",
    marginTop: "1.5rem",
    color: "#6B7280",
    fontSize: "0.875rem",
  },

  signupLink: {
    color: "#4F46E5",
    textDecoration: "none",
    fontWeight: "600",
  },
};

export default LoginPage;
