
import express from "express";
import db from "../db/database.js";

import {
  DEFAULT_FILESYSTEM,
  DEFAULT_LOGS,
  DEFAULT_STATE
} from "../seed.js";

const router = express.Router();

function defaultPayload() {
  return {
    ...structuredClone(DEFAULT_STATE),
    fileSystem: structuredClone(DEFAULT_FILESYSTEM),
    logs: structuredClone(DEFAULT_LOGS)
  };
}

function saveState(payload) {
  if (!payload || !Array.isArray(payload.fileSystem)) {
    throw new Error("fileSystem must be an array");
  }

  const json = JSON.stringify(payload);

  db.prepare(`
    INSERT INTO system_state (id, state_json, updated_at)
    VALUES (1, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      state_json = excluded.state_json,
      updated_at = CURRENT_TIMESTAMP
  `).run(json);
}

function loadState() {
  const row = db.prepare(`
    SELECT state_json
    FROM system_state
    WHERE id = 1
  `).get();

  if (!row) {
    const initialState = defaultPayload();
    saveState(initialState);
    return initialState;
  }

  return JSON.parse(row.state_json);
}

// Load saved simulator state.
router.get("/state", (_req, res) => {
  try {
    res.json(loadState());
  } catch (error) {
    console.error("Load failed:", error);

    res.status(500).json({
      message: "Failed to load persistent state",
      error: error.message
    });
  }
});

// Save simulator state.
router.put("/state", (req, res) => {
  try {
    saveState(req.body);

    res.json({
      ok: true,
      message: "State persisted to SQLite"
    });
  } catch (error) {
    console.error("Save failed:", error);

    res.status(400).json({
      message: "Failed to persist state",
      error: error.message
    });
  }
});

// Restore the original simulator state.
router.post("/reset", (_req, res) => {
  try {
    const initialState = defaultPayload();

    saveState(initialState);

    res.json(initialState);
  } catch (error) {
    console.error("Reset failed:", error);

    res.status(500).json({
      message: "Reset failed",
      error: error.message
    });
  }
});

export default router;