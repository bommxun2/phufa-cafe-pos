const mariadb = require("mariadb");

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5,
});

pool.getConnection((err, connection) => {
  if (err) {
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      console.error("Database connection lost");
    }
    if (err.code === "ER_CON_COUNT_ERROR") {
      console.error("Database has too many connection");
    }
    if (err.code === "ECONNREFUSED") {
      console.error("Database connection was refused");
    }
  }
  if (connection) connection.release();

  return;
});

// Initialize database
const init = async () => {
  try {
    const conn = await pool.getConnection();
    console.log("Connected to the database");
    conn.release();
  } catch (err) {
    console.error("Error connecting to the database: ", err);
  }
};
init();

module.exports = pool;