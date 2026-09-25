
import "dotenv/config";
import express from "express";
import cors from "cors";
import db from "./db/database.js";
import stateRouter from "./routes/state.js";

const app = express();
const PORT = process.env.PORT || 5000;

const allowed = (process.env.FRONTEND_ORIGIN || "*")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowed.includes("*") ? true : allowed
}));

app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  try {
    db.prepare("SELECT 1 AS connected").get();

    res.json({
      ok: true,
      service: "VFS NEXUS API",
      database: "connected",
      databaseType: "SQLite",
      time: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      ok: false,
      database: "disconnected",
      error: error.message
    });
  }
});

app.use("/api", stateRouter);

app.listen(PORT, () => {
  console.log(
    `VFS NEXUS backend running on http://localhost:${PORT}`
  );
});