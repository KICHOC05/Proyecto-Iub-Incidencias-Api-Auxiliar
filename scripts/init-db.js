require("dotenv").config();

const fs = require("node:fs/promises");
const path = require("node:path");
const mysql = require("mysql2/promise");

async function main() {
  const schemaPath = path.join(__dirname, "..", "database", "01_schema.sql");
  const schema = await fs.readFile(schemaPath, "utf8");
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    database: process.env.MYSQL_DATABASE,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    multipleStatements: true,
    timezone: "Z",
  });

  try {
    await connection.query(schema);
    console.log("Esquema MySQL ejecutado correctamente.");
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(`No fue posible ejecutar el esquema MySQL: ${error.message}`);
  process.exitCode = 1;
});
