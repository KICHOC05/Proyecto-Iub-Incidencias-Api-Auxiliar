const mysql = require("mysql2/promise");

// Esta conexion pertenece exclusivamente a MySQL auxiliar. No usar DATABASE_URL.
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "localhost",
  port: Number(process.env.MYSQL_PORT || 3306),
  database: process.env.MYSQL_DATABASE || "iub_auxiliar",
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  waitForConnections: true,
  connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT || 10),
  queueLimit: 0,
  timezone: "Z",
});

async function checkDatabase() {
  await pool.query("SELECT 1");
}

module.exports = { pool, checkDatabase };
