import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

export const pool = mysql.createPool({
  host:            process.env.DB_HOST     || "localhost",
  port:            parseInt(process.env.DB_PORT || "3306", 10),
  user:            process.env.DB_USER     || "aidline",
  password:        process.env.DB_PASSWORD || "",
  database:        process.env.DB_NAME     || "aidline",
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || "10", 10),
  waitForConnections: true,
  queueLimit:      0,
  timezone:        "Z",
  charset:         "utf8mb4",
});

export async function testConnection(): Promise<void> {
  const conn = await pool.getConnection();
  await conn.ping();
  conn.release();
  console.log("MySQL connection pool established.");
}
