// // server.js
// import 'dotenv/config';
// import express from 'express';
// import bcrypt from 'bcryptjs';
// import jwt from 'jsonwebtoken';
// import cors from 'cors';
// import mysql from 'mysql2/promise';

// const app = express();
// app.use(cors());
// app.use(express.json());

// // Ensure JWT SECRET is set
// const SECRET = process.env.SECRET;
// if (!SECRET) {
//     console.error("❌ JWT SECRET not set in .env. Please add SECRET=your_super_secret_key");
//     process.exit(1);
// }

// // MySQL connection
// const db = mysql.createPool({
//     host: process.env.MYSQL_HOST || 'localhost',
//     user: process.env.MYSQL_USER || 'root',
//     password: process.env.MYSQL_PASS || '',
//     database: process.env.MYSQL_DB || 'test',
//     port: Number(process.env.MYSQL_PORT) || 3306
// });

// // =================== REGISTER ===================
// app.post("/register", async (req, res) => {
//     const { email, password, full_name } = req.body;

//     if (!email || !password) {
//         return res.status(400).json({ error: "Email and password are required" });
//     }

//     try {
//         const hashed = await bcrypt.hash(password, 10);
//         await db.query(
//             "INSERT INTO users (email, password, full_name) VALUES (?, ?, ?)",
//             [email, hashed, full_name || null]
//         );

//         res.json({ message: "Registered successfully!" });
//     } catch (err) {
//         if (err.code === "ER_DUP_ENTRY") {
//             return res.status(400).json({ error: "Email already exists" });
//         }
//         console.error("Register error:", err);
//         res.status(500).json({ error: "Server error" });
//     }
// });

// // =================== LOGIN ===================
// app.post('/login', async (req, res) => {
//     const { email, password } = req.body;

//     if (!email || !password) {
//         return res.status(400).json({ error: 'Email and password required' });
//     }

//     try {
//         const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

//         if (rows.length === 0) {
//             return res.status(400).json({ error: 'Invalid email or password' });
//         }

//         const user = rows[0];
//         const valid = await bcrypt.compare(password, user.password);

//         if (!valid) return res.status(400).json({ error: 'Invalid email or password' });

//         const token = jwt.sign(
//             { id: user.id, email: user.email, role: user.role || 'user' },
//             SECRET,
//             { expiresIn: '24h' }
//         );

//         res.json({
//             token,
//             user: {
//                 id: user.id,
//                 email: user.email,
//                 full_name: user.full_name,
//                 role: user.role || 'user'
//             }
//         });

//     } catch (err) {
//         console.error('Login error:', err);
//         res.status(500).json({ error: "Server error" });
//     }
// });

// // =================== AUTH MIDDLEWARE ===================
// function auth(req, res, next) {
//     const token = req.headers.authorization?.split(" ")[1];
//     if (!token) return res.status(403).json({ error: "No token provided" });

//     try {
//         req.user = jwt.verify(token, SECRET);
//         next();
//     } catch {
//         return res.status(403).json({ error: "Invalid token" });
//     }
// }

// // =================== ADMIN CHECK ===================
// function admin(req, res, next) {
//     if (req.user.role !== "admin") return res.status(403).json({ error: "Admins only" });
//     next();
// }

// // =================== GET ALL USERS (ADMIN) ===================
// app.get("/admin/users", auth, admin, async (req, res) => {
//     try {
//         const [users] = await db.query("SELECT id, email, full_name, role FROM users ORDER BY id ASC");
//         res.json(users);
//     } catch (err) {
//         console.error("Admin get users error:", err);
//         res.status(500).json({ error: "Server error" });
//     }
// });

// // =================== START SERVER ===================
// app.listen(3000, () => console.log("Backend running on http://localhost:3000"));





import 'dotenv/config';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();
app.use(cors());
app.use(express.json());

// Ensure JWT SECRET is set
const SECRET = process.env.SECRET;
if (!SECRET) {
    console.error("❌ JWT SECRET not set in .env. Please add SECRET=your_super_secret_key");
    process.exit(1);
}

// MySQL connection
const db = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASS || '',
    database: process.env.MYSQL_DB || 'test',
    port: Number(process.env.MYSQL_PORT) || 3306
});

// =================== REGISTER ===================
app.post("/register", async (req, res) => {
    const { email, password, full_name } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    try {
        const hashed = await bcrypt.hash(password, 10);
        await db.query(
            "INSERT INTO users (email, password, full_name) VALUES (?, ?, ?)",
            [email, hashed, full_name || null]
        );

        res.json({ message: "Registered successfully!" });
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ error: "Email already exists" });
        }
        console.error("Register error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// =================== LOGIN ===================
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    try {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

        if (rows.length === 0) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const user = rows[0];
        const valid = await bcrypt.compare(password, user.password);

        if (!valid) return res.status(400).json({ error: 'Invalid email or password' });

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role || 'user' },
            SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role || 'user'
            }
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: "Server error" });
    }
});

// =================== AUTH MIDDLEWARE ===================
function auth(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(403).json({ error: "No token provided" });

    try {
        req.user = jwt.verify(token, SECRET);
        next();
    } catch {
        return res.status(403).json({ error: "Invalid token" });
    }
}

// =================== ADMIN CHECK ===================
function admin(req, res, next) {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Admins only" });
    next();
}

// =================== GET ALL USERS (ADMIN) ===================
app.get("/admin/users", auth, admin, async (req, res) => {
    try {
        const [users] = await db.query("SELECT id, email, full_name, role FROM users ORDER BY id ASC");
        res.json(users);
    } catch (err) {
        console.error("Admin get users error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// =================== CONTACT FORM SUBMISSION ===================
app.post("/contact", async (req, res) => {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !phone || !subject || !message) {
        return res.status(400).json({ error: "All fields are required." });
    }

    try {
        // Optionally store in MySQL (ensure table exists)
        await db.query(
            "INSERT INTO contacts (name, email, phone, subject, message, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
            [name, email, phone, subject, message]
        );

        // Log submission (for debugging or email sending logic)
        console.log("New Contact Form Submission:", req.body);

        res.status(200).json({ message: "Form submitted successfully!" });
    } catch (err) {
        console.error("Contact form error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// =================== START SERVER ===================
app.listen(3000, () => console.log("Backend running on http://localhost:3000"));
