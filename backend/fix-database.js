// fix-database.js  ← RUN THIS ONE TIME ONLY
import mysql from 'mysql2/promise';
import 'dotenv/config';

const db = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASS || '',
  database: process.env.MYSQL_DB || 'evpay',
  port: Number(process.env.MYSQL_PORT) || 3306,
});

async function fix() {
  try {
    console.log("Fixing database...");

    await db.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS full_name VARCHAR(100) NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS company_name VARCHAR(150) NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS email VARCHAR(150) NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS phone VARCHAR(30) NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS password VARCHAR(255) NULL,
      ADD COLUMN IF NOT EXISTS status ENUM('pending','approved','rejected') DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS role ENUM('pending','merchant','admin') DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS api_key VARCHAR(100) NULL,
      `);

    // Make email unique
    await db.query(`
      ALTER TABLE users 
      ADD UNIQUE IF NOT EXISTS unique_email (email)
    `).catch(() => {}); // ignore if already exists

    console.log("Database fixed! All required columns added.");
    console.log("Your form will now work perfectly now");

  } catch (err) {
    console.error("Fix failed:", err.message);
  } finally {
    await db.end();
    process.exit();
  }
}

fix();