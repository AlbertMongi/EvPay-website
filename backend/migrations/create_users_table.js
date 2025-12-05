// migrations/create_users_table.js

// Load environment variables
import 'dotenv/config';
import mysql from 'mysql2/promise';

console.log('MYSQL_PASS:', process.env.MYSQL_PASS, typeof process.env.MYSQL_PASS);

// Create a MySQL connection pool
const db = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASS || '',
  database: process.env.MYSQL_DB || 'test',
  port: Number(process.env.MYSQL_PORT) || 3306,
});

// Function to create users table
async function createUsersTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user'
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
