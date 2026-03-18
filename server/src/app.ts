import cors from "cors";
import express from "express";
import { env } from "./config/env";
import authRoutes from "./routes/auth.routes";
import usersRoutes from "./routes/users.routes";
import clinicsRoutes from "./routes/clinics.routes";
import sheltersRoutes from "./routes/shelters.routes";
import volunteersRoutes from "./routes/volunteers.routes";
import medicationRoutes from "./routes/medication.routes";
import gasStationsRoutes from "./routes/gasStations.routes";
import sosRoutes from "./routes/sos.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import chatRoutes from "./routes/chat.routes";
import { notFound } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: "ok",
      service: "AidLine backend",
      timestamp: new Date().toISOString(),
    },
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/clinics", clinicsRoutes);
app.use("/api/shelters", sheltersRoutes);
app.use("/api/volunteers", volunteersRoutes);
app.use("/api/medication", medicationRoutes);
app.use("/api/gas-stations", gasStationsRoutes);
app.use("/api/sos", sosRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/chat", chatRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
