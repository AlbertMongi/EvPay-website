// migrations/create_users_table.js

// Load environment variables
import 'dotenv/config'; // automatically runs dotenv.config()
import mysql from 'mysql2/promise';

console.log('MYSQL_PASS:', process.env.MYSQL_PASS, typeof process.env.MYSQL_PASS);

// Create a MySQL connection pool
const db = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASS,
  database: process.env.MYSQL_DB,
  port: Number(process.env.MYSQL_PORT), // ensure port is a number
});

// Function to create users table
async function createUsersTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user'
      );
    `);
    console.log("✅ Users table created successfully!");
  } catch (err) {
    console.error("❌ Error creating users table:", err);
  } finally {
    await db.end();
  }
}

// Run the migration
createUsersTable();
