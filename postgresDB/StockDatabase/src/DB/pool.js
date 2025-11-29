require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const { Pool } = require('pg');

module.exports = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  ssl: false 
});

//const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  ssl: false
});

// async function testConnection() {
//   try {
//     const client = await pool.connect();
//     const res = await client.query("SELECT NOW()");
//     console.log("Database connected at:", res.rows[0].now);
//     client.release();
//   } catch (err) {
//     console.error("Database connection failed:", err.message);
//     process.exit(1);
//   }
// }

// testConnection();

