import express from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import { query, queryOne } from "./db.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true }));
app.use(express.json());

// Health check
app.get("/health", (_, res) => res.json({ status: "ok" }));

// =============================================================================
// REQUESTS (Unified Request Entry Layer)
// =============================================================================

app.post("/api/requests", async (req, res) => {
  try {
    const { user_id, request_type, description, urgency = "medium" } = req.body;
    if (!user_id || !request_type) {
      return res.status(400).json({ error: "user_id and request_type required" });
    }
    const id = uuidv4();
    await query(
      `INSERT INTO requests (id, user_id, request_type, description, urgency, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [id, user_id, request_type, description || null, urgency]
    );
    const row = await queryOne("SELECT * FROM requests WHERE id = ?", [id]);
    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create request" });
  }
});

app.get("/api/requests", async (req, res) => {
  try {
    const { user_id, status } = req.query;
    let sql = "SELECT * FROM requests WHERE 1=1";
    const params = [];
    if (user_id) {
      sql += " AND user_id = ?";
      params.push(user_id);
    }
    if (status) {
      sql += " AND status = ?";
      params.push(status);
    }
    sql += " ORDER BY created_at DESC LIMIT 100";
    const rows = await query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

// =============================================================================
// REQUEST CLASSIFICATION (AI Triage)
// =============================================================================

app.post("/api/requests/:id/classify", async (req, res) => {
  try {
    const { id } = req.params;
    const { category, priority, responder_type } = req.body;
    if (!category || !priority || !responder_type) {
      return res.status(400).json({ error: "category, priority, responder_type required" });
    }
    const classId = uuidv4();
    await query(
      `INSERT INTO request_classifications (id, request_id, category, priority, responder_type)
       VALUES (?, ?, ?, ?, ?)`,
      [classId, id, category, priority, responder_type]
    );
    await query("UPDATE requests SET status = 'classified' WHERE id = ?", [id]);
    const row = await queryOne("SELECT * FROM request_classifications WHERE id = ?", [classId]);
    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to classify request" });
  }
});

// =============================================================================
// SOS ALERTS (no location)
// =============================================================================

app.post("/api/sos", async (req, res) => {
  try {
    const { user_id, message } = req.body;
    if (!user_id) return res.status(400).json({ error: "user_id required" });
    const id = uuidv4();
    await query(
      `INSERT INTO sos_alerts (id, user_id, message, status) VALUES (?, ?, ?, 'active')`,
      [id, user_id, message || null]
    );
    const row = await queryOne("SELECT * FROM sos_alerts WHERE id = ?", [id]);
    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create SOS alert" });
  }
});

app.get("/api/sos", async (req, res) => {
  try {
    const rows = await query(
      "SELECT id, user_id, message, status, created_at FROM sos_alerts ORDER BY created_at DESC LIMIT 100"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch SOS alerts" });
  }
});

app.patch("/api/sos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "status required" });
    const resolved = status === "resolved" ? new Date().toISOString().slice(0, 19).replace("T", " ") : null;
    await query(
      "UPDATE sos_alerts SET status = ?, resolved_at = ? WHERE id = ?",
      [status, resolved, id]
    );
    const row = await queryOne("SELECT * FROM sos_alerts WHERE id = ?", [id]);
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update SOS alert" });
  }
});

// =============================================================================
// MEDICATION REQUESTS
// =============================================================================

app.post("/api/medication-requests", async (req, res) => {
  try {
    const { user_id, medication_name, urgency = "medium", notes } = req.body;
    if (!user_id || !medication_name) {
      return res.status(400).json({ error: "user_id and medication_name required" });
    }
    const id = uuidv4();
    await query(
      `INSERT INTO medication_requests (id, user_id, medication_name, urgency, notes, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [id, user_id, medication_name, urgency, notes || null]
    );
    const row = await queryOne("SELECT * FROM medication_requests WHERE id = ?", [id]);
    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create medication request" });
  }
});

app.get("/api/medication-requests", async (req, res) => {
  try {
    const { user_id } = req.query;
    let sql = "SELECT id, user_id, medication_name, urgency, status, notes, created_at FROM medication_requests WHERE 1=1";
    const params = [];
    if (user_id) {
      sql += " AND user_id = ?";
      params.push(user_id);
    }
    sql += " ORDER BY created_at DESC LIMIT 100";
    const rows = await query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch medication requests" });
  }
});

app.patch("/api/medication-requests/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "status required" });
    await query("UPDATE medication_requests SET status = ? WHERE id = ?", [status, id]);
    const row = await queryOne("SELECT * FROM medication_requests WHERE id = ?", [id]);
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update medication request" });
  }
});

// =============================================================================
// VOLUNTEERS (no location)
// =============================================================================

app.post("/api/volunteers", async (req, res) => {
  try {
    const { user_id, skills, bio } = req.body;
    if (!user_id || !skills || !Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({ error: "user_id and skills (array) required" });
    }
    const id = uuidv4();
    await query(
      `INSERT INTO volunteers (id, user_id, skills, bio, status) VALUES (?, ?, ?, ?, 'available')`,
      [id, user_id, JSON.stringify(skills), bio || null]
    );
    const row = await queryOne("SELECT * FROM volunteers WHERE id = ?", [id]);
    row.skills = JSON.parse(row.skills || "[]");
    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to register volunteer" });
  }
});

app.get("/api/volunteers", async (req, res) => {
  try {
    const rows = await query("SELECT * FROM volunteers ORDER BY rating DESC");
    rows.forEach((r) => {
      r.skills = typeof r.skills === "string" ? JSON.parse(r.skills || "[]") : r.skills || [];
    });
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch volunteers" });
  }
});

// =============================================================================
// SHELTERS, CLINICS, PHARMACIES (no location)
// =============================================================================

app.get("/api/shelters", async (req, res) => {
  try {
    const rows = await query("SELECT id, name, address, capacity, available_spots, is_operational, ngo, phone FROM shelters ORDER BY name");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch shelters" });
  }
});

app.get("/api/clinics", async (req, res) => {
  try {
    const rows = await query("SELECT id, name, address, phone, is_operational, services, operating_hours, ngo FROM clinics ORDER BY name");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch clinics" });
  }
});

app.get("/api/pharmacies", async (req, res) => {
  try {
    const rows = await query("SELECT id, name, address, phone, is_operational, available_medications, operating_hours, ngo FROM pharmacies ORDER BY name");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch pharmacies" });
  }
});

// =============================================================================
// CRISIS ANALYTICS (aggregated intelligence)
// =============================================================================

app.get("/api/analytics", async (req, res) => {
  try {
    const rows = await query(
      "SELECT * FROM crisis_analytics ORDER BY period_date DESC LIMIT 30"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

app.listen(PORT, () => {
  console.log(`AidLine API listening on http://localhost:${PORT}`);
});
