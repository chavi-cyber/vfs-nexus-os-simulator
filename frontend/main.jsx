import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";

import VFSNexusApp from "./vfs_nexus_os_simulator.jsx";
import Login from "./components/Login.jsx";
import AdminDashboard from "./components/AdminDashboard.jsx";
import Signup from "./components/signup.jsx";
import { supabase } from "./lib/supabase.js";

function App() {
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [authPage, setAuthPage] = useState("login");
  const [logoutError, setLogoutError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [page, setPage] = useState("simulator");
  const [simulatorStatus, setSimulatorStatus] = useState("LOADING STATE");

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;

      if (error) {
        console.error("Session check failed:", error);
      }

      setSession(data?.session ?? null);
      setCheckingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!active) return;

      setSession(newSession);
      setCheckingSession(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // Check the signed-in user's admin role. RLS only allows reading their own row.
  useEffect(() => {
    const userId = session?.user?.id;
    let active = true;
    setIsAdmin(false);
    setPage("simulator");
    setCheckingAdmin(Boolean(userId));

    if (!userId) return () => { active = false; };

    async function checkAdminRole() {
      try {
        const { data, error } = await supabase
          .from("admin_users")
          .select("user_id")
          .eq("user_id", userId)
          .maybeSingle();

        if (error) throw error;
        if (active) setIsAdmin(Boolean(data));
      } catch (error) {
        console.error("Admin role check failed:", error);
        if (active) setIsAdmin(false);
      } finally {
        if (active) setCheckingAdmin(false);
      }
    }

    checkAdminRole();
    return () => { active = false; };
  }, [session?.user?.id]);

  async function handleLogout() {
    setLogoutError("");

    const { error } = await supabase.auth.signOut();

    if (error) {
      setLogoutError(error.message);
    }
  }

  if (checkingSession) {
    return (
      <div style={styles.loading}>
        Checking your session...
      </div>
    );
  }

  if (!session) {
    return authPage === "signup" ? (
      <Signup onSwitchToLogin={() => setAuthPage("login")} />
    ) : (
      <Login onSwitchToSignup={() => setAuthPage("signup")} />
    );
  }

  return (
    <>
      <div style={styles.accountBar}>
        <div style={styles.brand}>
          <div style={styles.brandIcon}>▣</div>
          <div>
            <div style={styles.brandTitleRow}>
              <strong style={styles.brandTitle}>VFS NEXUS</strong>
              <span style={styles.versionBadge}>v3.8-HYBRID</span>
              {page === "simulator" && <span style={{...styles.statusBadge, ...(simulatorStatus === "STATE LOADED" ? styles.statusLoaded : simulatorStatus === "LOAD FAILED" ? styles.statusFailed : styles.statusLoading)}}>{simulatorStatus}</span>}
            </div>
            <div style={styles.brandSubtitle}>Virtual File System &amp; Disk Intelligence Simulator</div>
          </div>
        </div>
        <div style={styles.accountControls}>
          <span style={styles.signedIn}>Signed in as {session.user.email}</span>
        {!checkingAdmin && isAdmin && (
          <>
            <span style={styles.adminBadge}>Administrator</span>
            <button type="button" style={styles.navButton}
              onClick={() => setPage(page === "admin" ? "simulator" : "admin")}>
              {page === "admin" ? "Back to Simulator" : "Admin Dashboard"}
            </button>
          </>
        )}

        <button
          type="button"
          onClick={handleLogout}
          style={styles.logoutButton}
        >
          Log Out
        </button>

        {logoutError && (
          <span role="alert">{logoutError}</span>
        )}
        </div>
      </div>

      {page === "admin" && isAdmin && !checkingAdmin ? (
        <AdminDashboard key={session.user.id} user={session.user} />
      ) : (
        <VFSNexusApp key={session.user.id} user={session.user} onStatusChange={setSimulatorStatus} />
      )}
    </>
  );
}

const styles = {
  loading: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "#0b1120",
    color: "#ffffff",
    fontFamily: "Arial, sans-serif",
  },
 
accountBar: {
  display: "flex", alignItems: "center", justifyContent: "space-between",
  flexWrap: "wrap", gap: "12px", minHeight: "70px", padding: "10px 20px",
  background: "#161b22", borderBottom: "1px solid #273244",
  color: "#ffffff", fontFamily: "Arial, sans-serif", fontSize: "12px",
},
brand: { display: "flex", alignItems: "center", gap: "12px", minWidth: 0 },
brandIcon: { width: "36px", height: "36px", flexShrink: 0, borderRadius: "9px", background: "linear-gradient(135deg, #06b6d4, #2563eb)", display: "grid", placeItems: "center", color: "#06121b", fontSize: "23px", fontWeight: "bold" },
brandTitleRow: { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" },
brandTitle: { fontSize: "15px", letterSpacing: "0.2px", whiteSpace: "nowrap" },
versionBadge: { padding: "3px 6px", borderRadius: "5px", fontFamily: "monospace", fontSize: "10px", color: "#67e8f9", background: "#083344", border: "1px solid #155e75" },
statusBadge: { padding: "3px 7px", borderRadius: "5px", fontFamily: "monospace", fontSize: "10px", border: "1px solid" },
statusLoaded: { color: "#6ee7b7", background: "#052e25", borderColor: "#065f46" },
statusFailed: { color: "#fca5a5", background: "#450a0a", borderColor: "#991b1b" },
statusLoading: { color: "#fcd34d", background: "#422006", borderColor: "#92400e" },
brandSubtitle: { marginTop: "4px", fontSize: "11px", color: "#94a3b8" },
accountControls: { display: "flex", alignItems: "center", justifyContent: "flex-end", flexWrap: "wrap", gap: "8px", minWidth: 0 },
signedIn: { fontSize: "12px", color: "#cbd5e1", overflowWrap: "anywhere" },

adminBadge: {
  padding: "5px 10px",
  borderRadius: "6px",
  background: "#064e3b",
  color: "#a7f3d0",
  fontWeight: "bold",
  fontSize: "12px",
},

navButton: {
  padding: "7px 12px",
  border: "1px solid #34d399",
  borderRadius: "6px",
  background: "#064e3b",
  color: "#d1fae5",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "12px",
},

logoutButton: {
  padding: "7px 12px",
  border: "none",
  borderRadius: "6px",
  background: "#38bdf8",
  color: "#0f172a",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "12px",
},
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);