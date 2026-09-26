
import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Signup({ onSwitchToLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(event) {
    event.preventDefault();
    setMessage("");

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setMessage("Password must contain at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      setMessage(
        "Signup request received. Check your email for a confirmation link."
      );
    } catch (error) {
      setMessage(error.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <form onSubmit={handleSignup} style={styles.form}>
        <h1>VFS NEXUS</h1>
        <h2>Create Account</h2>

        <label htmlFor="signup-email">Email</label>
        <input
          id="signup-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Enter your email"
          required
          style={styles.input}
        />

        <label htmlFor="signup-password">Password</label>
        <input
          id="signup-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Minimum 8 characters"
          minLength={8}
          required
          style={styles.input}
        />

        <label htmlFor="signup-confirm">Confirm Password</label>
        <input
          id="signup-confirm"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Re-enter your password"
          required
          style={styles.input}
        />

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        {message && <p role="status">{message}</p>}

        {onSwitchToLogin && (
          <p>
            Already have an account?{" "}
            <button type="button" onClick={onSwitchToLogin}>
              Log in
            </button>
          </p>
        )}
      </form>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "#0b1120",
    color: "#ffffff",
    fontFamily: "Arial, sans-serif",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    width: "min(380px, 90vw)",
    padding: "32px",
    borderRadius: "12px",
    background: "#1e293b",
  },
  input: {
    padding: "12px",
    borderRadius: "6px",
    border: "1px solid #64748b",
    background: "#0f172a",
    color: "#ffffff",
  },
  button: {
    padding: "12px",
    border: 0,
    borderRadius: "6px",
    background: "#38bdf8",
    cursor: "pointer",
  },
};