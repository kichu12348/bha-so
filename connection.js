// connection.js
const mysql = require("mysql2/promise");

// Create MySQL connection pool (more efficient than single connection)
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// For testing connection
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Connected to MySQL database');
    connection.release();
  } catch (error) {
    console.error('Error connecting to MySQL:', error.message);
  }
})();

// Export the connection object and query function
module.exports = {
  connection: pool,
  query: (...args) => pool.query(...args)
};
