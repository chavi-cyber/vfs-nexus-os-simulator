import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Login({ onSwitchToSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;
    } catch (error) {
      setMessage(error.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <form onSubmit={handleLogin} style={styles.form}>
        <h1>VFS NEXUS</h1>
        <h2>Welcome Back</h2>

        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Enter your email"
          required
          style={styles.input}
        />

        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your password"
          required
          style={styles.input}
        />

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? "Signing in..." : "Log In"}
        </button>

        {message && <p role="alert">{message}</p>}

        {onSwitchToSignup && (
          <p>
            Don't have an account?{" "}
            <button type="button" onClick={onSwitchToSignup}>
              Sign up
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