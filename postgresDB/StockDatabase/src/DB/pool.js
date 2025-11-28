require("dotenv").config({ path: require("path").resolve(__dirname, "../../../../.env") });
const { Pool } = require('pg');

module.exports = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  ssl: false       // use true if you configured SSL
});

// async function testConnection() {
//   try {
//     await pool.query('SELECT NOW()'); // just test connectivity
//     console.log('Connected to the Stocks Database at:', process.env.DB_HOST);
//   } catch (err) {
//     console.error('Connection error:', err);
//   } finally {
//     await pool.end();
//   }
// }

// testConnection();
