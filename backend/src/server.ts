import { testConnection } from "./config/database.js";
import app from "./app.js";

const PORT = parseInt(process.env.PORT || "3001", 10);

async function start(): Promise<void> {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`AidLine backend running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
