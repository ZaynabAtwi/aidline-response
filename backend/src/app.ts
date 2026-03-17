import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

import authRouter       from "./routes/auth.js";
import requestsRouter   from "./routes/requests.js";
import providersRouter  from "./routes/providers.js";
import messagesRouter   from "./routes/messages.js";
import sosRouter        from "./routes/sos.js";
import medicationRouter from "./routes/medication.js";
import volunteersRouter from "./routes/volunteers.js";
import analyticsRouter  from "./routes/analytics.js";
import chatRouter       from "./routes/chat.js";
import ngoRouter        from "./routes/ngo.js";

dotenv.config();

const app = express();

// ── Security middleware ────────────────────────────────────────────────────────
app.use(helmet());

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// ── Rate limiting ──────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10),
  max:      parseInt(process.env.RATE_LIMIT_MAX       || "100",    10),
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, error: "Too many requests, please try again later" },
});
app.use(limiter);

// ── Body parsing ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Health check ───────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "aidline-backend", timestamp: new Date().toISOString() });
});

// ── API Routes ─────────────────────────────────────────────────────────────────
const api = "/api";
app.use(`${api}/auth`,       authRouter);
app.use(`${api}/requests`,   requestsRouter);
app.use(`${api}/providers`,  providersRouter);
app.use(`${api}/messages`,   messagesRouter);
app.use(`${api}/sos`,        sosRouter);
app.use(`${api}/medication`,  medicationRouter);
app.use(`${api}/volunteers`, volunteersRouter);
app.use(`${api}/analytics`,  analyticsRouter);
app.use(`${api}/chat`,       chatRouter);
app.use(`${api}/ngo`,        ngoRouter);

// ── 404 handler ────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// ── Global error handler ───────────────────────────────────────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[Error]", err);
  const status  = err.status || 500;
  const message = process.env.NODE_ENV === "production" ? "Internal server error" : err.message;
  res.status(status).json({ success: false, error: message });
});

export default app;
