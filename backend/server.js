// // Load environment variables
// import 'dotenv/config';
// import express from 'express';
// import bcrypt from 'bcryptjs';
// import jwt from 'jsonwebtoken';
// import cors from 'cors';
// import mysql from 'mysql2/promise';

// const app = express();
// app.use(cors());
// app.use(express.json());

// // JWT Secret
// const SECRET = process.env.SECRET || 'default_super_secret_key';

// // Optional: stop server if SECRET is not set
// if (!process.env.SECRET) {
//     console.warn("⚠️  WARNING: JWT SECRET not set in .env, using default. Change this in production!");
// }

// // MySQL connection pool
// const db = mysql.createPool({
//     host: process.env.MYSQL_HOST,
//     user: process.env.MYSQL_USER,
//     password: process.env.MYSQL_PASS,
//     database: process.env.MYSQL_DB,
//     port: Number(process.env.MYSQL_PORT)
// });

// // REGISTER
// app.post("/register", async (req, res) => {
//     const { username, password } = req.body;

//     try {
//         const hashed = await bcrypt.hash(password, 10);

//         await db.query(
//             "INSERT INTO users (username, password) VALUES (?, ?)",
//             [username, hashed]
//         );

//         res.json({ message: "Registered!" });

//     } catch (err) {
//         if (err.code === "ER_DUP_ENTRY") { // duplicate username
//             return res.status(400).json({ error: "Username already exists" });
//         }
//         console.error(err);
//         res.status(500).json({ error: "Server error" });
//     }
// });

// // LOGIN
// app.post("/login", async (req, res) => {
//     const { username, password } = req.body;

//     try {
//         const [rows] = await db.query(
//             "SELECT * FROM users WHERE username = ?",
//             [username]
//         );

//         if (rows.length === 0)
//             return res.status(400).json({ error: "User not found" });

//         const user = rows[0];

//         const valid = await bcrypt.compare(password, user.password);
//         if (!valid) return res.status(400).json({ error: "Wrong password" });

//         const token = jwt.sign(
//             { id: user.id, username: user.username, role: user.role },
//             SECRET,
//             { expiresIn: "2h" }
//         );

//         res.json({ token });

//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: "Server error" });
//     }
// });

// // AUTH MIDDLEWARE
// function auth(req, res, next) {
//     const token = req.headers.authorization?.split(" ")[1];
//     if (!token) return res.status(403).json({ error: "No token" });

//     try {
//         req.user = jwt.verify(token, SECRET);
//         next();
//     } catch {
//         return res.status(403).json({ error: "Invalid token" });
//     }
// }

// // ADMIN CHECK
// function admin(req, res, next) {
//     if (req.user.role !== "admin")
//         return res.status(403).json({ error: "Admins only" });
//     next();
// }

// // GET ALL USERS (ADMIN PANEL)
// app.get("/admin/users", auth, admin, async (req, res) => {
//     try {
//         const [users] = await db.query("SELECT id, username, role FROM users ORDER BY id ASC");
//         res.json(users);
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: "Server error" });
//     }
// });

// // Start server
// app.listen(3000, () => console.log("Backend running on http://localhost:3000"));





// server.js  ←  THE ONLY FILE YOU NEED (Copy & Replace Everything)
import 'dotenv/config';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();
app.use(cors());
app.use(express.json());

// JWT Secret - CHANGE THIS IN PRODUCTION!
const SECRET = process.env.JWT_SECRET || 'evpay-2025-super-secret-change-me!!!';

// MySQL Pool
const db = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASS || '',
    database: process.env.MYSQL_DB || 'evpay',
    port: Number(process.env.MYSQL_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
});

// 1. EVPAY API ACCESS REQUEST (Your main form uses this)
app.post("/api/register", async (req, res) => 
    {
    const { full_name, company_name, email, phone } = req.body;

    if (!full_name || !company_name || !email || !phone) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const [exists] = await db.query("SELECT id FROM users WHERE email = ?", [email.toLowerCase()]);
        if (exists.length > 0) {
            return res.status(409).json({ error: "Email already registered" });
        }

        await db.query(
            `INSERT INTO users (full_name, company_name, email, phone, status, role)
             VALUES (?, ?, ?, ?, 'pending', 'pending')`,
            [full_name.trim(), company_name.trim(), email.toLowerCase().trim(), phone.trim()]
        );

        console.log(`New API request: ${full_name} <${email}>`);

        res.json({
            success: true,
            message: "Thank you! We'll review your application and send API keys within 24 hours."
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// 2. USER REGISTRATION (for login system - admin/merchant accounts)
app.post("/auth/register", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
    }

    try {
        const [exists] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
        if (exists.length > 0) {
            return res.status(409).json({ error: "User already exists" });
        }

        const hashed = await bcrypt.hash(password, 12);

        const [result] = await db.query(
            "INSERT INTO users (email, password, full_name, role, status) VALUES (?, ?, ?, 'merchant', 'approved')",
            [email.toLowerCase(), hashed, email.split('@')[0]]
        );

        const token = jwt.sign({ id: result.insertId, email, role: 'merchant' }, SECRET, { expiresIn: '7d' });

        res.json({ message: "Account created!", token });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// 3. LOGIN
app.post("/auth/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email.toLowerCase()]);
        if (rows.length === 0) return res.status(400).json({ error: "User not found" });

        const user = rows[0];
        if (!user.password) return res.status(400).json({ error: "This account has no password (API request only)" });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(400).json({ error: "Wrong password" });

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            SECRET,
            { expiresIn: '7d' }
        );

        res.json({ token, user: { id: user.id, email: user.email, role: user.role } });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// 4. PROTECTED ROUTE EXAMPLE - Get all pending applications (for admin)
app.get("/admin/pending", async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token" });

    try {
        const decoded = jwt.verify(token, SECRET);
        if (decoded.role !== 'admin') return res.status(403).json({ error: "Admins only" });

        const [applications] = await db.query(`
            SELECT id, full_name, company_name, email, phone, created_at 
            FROM users 
            WHERE status = 'pending' 
            ORDER BY created_at DESC
        `);

        res.json(applications);
    } catch {
        res.status(401).json({ error: "Invalid token" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\nEVPAY BACKEND RUNNING`);
    console.log(`→ API Registration: POST http://localhost:${PORT}/api/register`);
    console.log(`→ Login/Register:   POST http://localhost:${PORT}/auth/login`);
    console.log(`→ Admin Panel:     GET  http://localhost:${PORT}/admin/pending (with token)\n`);
});