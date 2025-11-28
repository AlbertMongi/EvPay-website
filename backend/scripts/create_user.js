import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

// MySQL connection
const db = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASS,
  database: process.env.MYSQL_DB,
  port: Number(process.env.MYSQL_PORT),
});

async function createUser(email, password, role = 'user') {
  try {
    const hashed = await bcrypt.hash(password, 10);
    await db.query(
      "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
      [email, hashed, role]
    );
    console.log(`✅ User ${email} created!`);
  } catch (err) {
    console.error("❌ Error creating user:", err);
  } finally {
    await db.end();
  }
}

// Example: create user
createUser('albert@evmak.com', 'Monxtar66');
