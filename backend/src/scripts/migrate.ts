/**
 * Database migration runner.
 * Run with: npm run migrate
 *
 * Reads SQL files from /database/*.sql and executes them in order.
 */
import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function migrate(): Promise<void> {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || "localhost",
    port:     parseInt(process.env.DB_PORT || "3306", 10),
    user:     process.env.DB_USER     || "root",
    password: process.env.DB_PASSWORD || "",
    multipleStatements: true,
  });

  const migrationsDir = path.resolve(__dirname, "../../../database");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  console.log(`Found ${files.length} migration file(s).`);

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, "utf-8");
    console.log(`Executing: ${file}`);
    try {
      await conn.query(sql);
      console.log(`  ✓ ${file}`);
    } catch (err: any) {
      console.error(`  ✗ ${file}: ${err.message}`);
      throw err;
    }
  }

  await conn.end();
  console.log("Migration complete.");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
