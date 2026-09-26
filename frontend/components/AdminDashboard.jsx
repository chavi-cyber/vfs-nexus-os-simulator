import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase.js";

export default function AdminDashboard({ user }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let active = true;
    async function loadUsers() {
      setLoading(true);
      setError("");
      const { data, error: rpcError } = await supabase.rpc("admin_get_user_states");
      if (!active) return;
      if (rpcError) setError(rpcError.message);
      else setUsers(data ?? []);
      setLoading(false);
    }
    loadUsers();
    return () => { active = false; };
  }, [user?.id]);

  const panel = { background: "#1e293b", padding: 20, borderRadius: 12, marginTop: 18 };
  return (
    <main style={{ minHeight: "100vh", padding: 30, background: "#0b1120", color: "#f8fafc", fontFamily: "Arial, sans-serif" }}>
      <h1>VFS NEXUS — Admin Dashboard</h1>
      <p style={{ color: "#94a3b8" }}>Registered users and their saved simulator states (read-only)</p>
      {loading && <p>Loading users...</p>}
      {error && <p role="alert" style={{ color: "#fca5a5" }}>Unable to load admin data: {error}</p>}
      {!loading && !error && (
        <section style={panel}>
          <h2>Registered users: {users.length}</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead><tr><th style={{ padding: 12 }}>Email</th><th>Saved state</th><th>Last updated</th><th>Action</th></tr></thead>
              <tbody>{users.map((entry) => (
                <tr key={entry.user_id} style={{ borderTop: "1px solid #475569" }}>
                  <td style={{ padding: 12 }}>{entry.email ?? "—"}</td>
                  <td>{entry.state == null ? "Not saved yet" : "Available"}</td>
                  <td>{entry.updated_at ? new Date(entry.updated_at).toLocaleString() : "—"}</td>
                  <td><button type="button" disabled={entry.state == null} onClick={() => setSelected(entry)} style={{ padding: "7px 12px", cursor: "pointer" }}>View data</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </section>
      )}
      {selected && (
        <section style={panel}>
          <button type="button" onClick={() => setSelected(null)}>Close details</button>
          <h2>Saved state: {selected.email}</h2>
          <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", maxHeight: 500, overflow: "auto", background: "#0f172a", padding: 16 }}>{JSON.stringify(selected.state, null, 2)}</pre>
        </section>
      )}
    </main>
  );
}
