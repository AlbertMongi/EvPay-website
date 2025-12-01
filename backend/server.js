// Load environment variables
import 'dotenv/config';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();
app.use(cors());
app.use(express.json());

// JWT Secret
const SECRET = process.env.SECRET || 'default_super_secret_key';

// Optional: stop server if SECRET is not set
if (!process.env.SECRET) {
    console.warn("⚠️  WARNING: JWT SECRET not set in .env, using default. Change this in production!");
}

// MySQL connection pool
const db = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_DB,
    port: Number(process.env.MYSQL_PORT)
});

// REGISTER
app.post("/register", async (req, res) => {
    const { username, password } = req.body;

    try {
        const hashed = await bcrypt.hash(password, 10);

        await db.query(
            "INSERT INTO users (username, password) VALUES (?, ?)",
            [username, hashed]
        );

        res.json({ message: "Registered!" });

    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") { // duplicate username
            return res.status(400).json({ error: "Username already exists" });
        }
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// LOGIN
app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const [rows] = await db.query(
            "SELECT * FROM users WHERE username = ?",
            [username]
        );

        if (rows.length === 0)
            return res.status(400).json({ error: "User not found" });

        const user = rows[0];

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(400).json({ error: "Wrong password" });

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            SECRET,
            { expiresIn: "2h" }
        );

        res.json({ token });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// AUTH MIDDLEWARE
function auth(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(403).json({ error: "No token" });

    try {
        req.user = jwt.verify(token, SECRET);
        next();
    } catch {
        return res.status(403).json({ error: "Invalid token" });
    }
}

// ADMIN CHECK
function admin(req, res, next) {
    if (req.user.role !== "admin")
        return res.status(403).json({ error: "Admins only" });
    next();
}

// GET ALL USERS (ADMIN PANEL)
app.get("/admin/users", auth, admin, async (req, res) => {
    try {
        const [users] = await db.query("SELECT id, username, role FROM users ORDER BY id ASC");
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// Start server
app.listen(3000, () => console.log("Backend running on http://localhost:3000"));





// // server.js
// import 'dotenv/config';
// import express from 'express';
// import bcrypt from 'bcryptjs';
// import jwt from 'jsonwebtoken';
// import cors from 'cors';
// import mysql from 'mysql2/promise';
// import path from 'path';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const app = express();
// app.use(cors());
// app.use(express.json());

// // === JWT SECRET ===
// const SECRET = process.env.SECRET || 'evmak-ultra-secret-2025';

// // === MySQL Pool ===
// const db = mysql.createPool({
//     host: process.env.MYSQL_HOST || 'localhost',
//     user: process.env.MYSQL_USER,
//     password: process.env.MYSQL_PASS,
//     database: process.env.MYSQL_DB,
//     port: Number(process.env.MYSQL_PORT) || 3306
// });

// // === ADMIN-ONLY MIDDLEWARE (THIS IS THE KEY!) ===
// const requireAdmin = (req, res, next) => {
//     const authHeader = req.headers.authorization;
//     const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

//     if (!token) {
//         return res.redirect('/docs-login');
//     }

//     try {
//         const user = jwt.verify(token, SECRET);
//         if (user.role !== 'admin') {
//             return res.redirect('/docs-login');
//         }
//         req.user = user;
//         next();
//     } catch (err) {
//         return res.redirect('/docs-login');
//     }
// };

// // === LOGIN PAGE (Beautiful + Working) ===
// app.get('/docs-login', (req, res) => {
//     res.send(`
// <!DOCTYPE html>
// <html class="dark">
// <head>
//   <meta charset="UTF-8">
//   <meta name="viewport" content="width=device-width, initial-scale=1.0">
//   <title>EvMak Docs - Login Required</title>
//   <script src="https://cdn.tailwindcss.com"></script>
//   <style>body{font-family:'Inter',sans-serif;background:#0c1118;}</style>
// </head>
// <body class="flex items-center justify-center min-h-screen">
//   <div class="bg-[#0f1620] p-12 rounded-3xl shadow-2xl w-full max-w-md border border-gray-800">
//     <h1 class="text-5xl font-bold text-yellow-400 text-center mb-4">EvMak API Docs</h1>
//     <p class="text-gray-400 text-center mb-10">Protected Documentation • Admin Access Only</p>
    
//     <form id="loginForm" class="space-y-6">
//       <input type="text" id="username" placeholder="Username" required 
//              class="w-full px-5 py-4 bg-gray-900 border border-gray-700 rounded-xl text-lg focus:border-yellow-400 outline-none transition">
//       <input type="password" id="password" placeholder="Password" required 
//              class="w-full px-5 py-4 bg-gray-900 border border-gray-700 rounded-xl text-lg focus:border-yellow-400 outline-none transition">
//       <button type="submit" class="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-4 rounded-xl text-lg transition transform hover:scale-105">
//         Login as Admin
//       </button>
//     </form>
//     <p id="msg" class="text-red-400 text-center mt-6 text-lg font-medium"></p>
//   </div>

//   <script>
//     document.getElementById('loginForm').onsubmit = async (e) => {
//       e.preventDefault();
//       const res = await fetch('/api/login', {
//         method: 'POST',
//         headers: {'Content-Type': 'application/json'},
//         body: JSON.stringify({
//           username: document.getElementById('username').value,
//           password: document.getElementById('password').value
//         })
//       });
//       const data = await res.json();
//       if (data.token && data.role === 'admin') {
//         localStorage.setItem('token', data.token);
//         location.href = '/docs';
//       } else {
//         document.getElementById('msg').textContent = data.error || 'Access Denied – Admin Only';
//       }
//     };
//   </script>
// </body>
// </html>
//     `);
// });

// // === PROTECTED DOCS ROUTE (MUST BE BEFORE ANY STATIC!) ===
// app.get('/docs', requireAdmin, (req, res) => {
//     res.sendFile(path.join(__dirname, 'public/docs/index.html'));
// });

// // === PROTECT ALL /docs/* FILES (CSS, JS, IMAGES) ===
// // app.get('/docs/*', requireAdmin, (req, res) => {
// //     const filePath = path.join(__dirname, 'public', req.path);
// //     res.sendFile(filePath);
// // });

// // === LOGIN API ===
// app.post('/api/login', async (req, res) => {
//     const { username, password } = req.body;
//     try {
//         const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
//         if (!rows.length) return res.status(400).json({ error: 'User not found' });

//         const user = rows[0];
//         const valid = await bcrypt.compare(password, user.password);
//         if (!valid) return res.status(400).json({ error: 'Wrong password' });

//         const token = jwt.sign(
//             { id: user.id, username: user.username, role: user.role || 'user' },
//             SECRET,
//             { expiresIn: '24h' }
//         );

//         res.json({ token, role: user.role || 'user' });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: 'Server error' });
//     }
// });

// // === REGISTER (Optional) ===
// app.post('/register', async (req, res) => {
//     const { username, password } = req.body;
//     const hashed = await bcrypt.hash(password, 10);
//     await db.query("INSERT INTO users (username, password, role) VALUES (?, ?, 'user')", [username, hashed]);
//     res.json({ message: 'Registered' });
// });

// // === START SERVER ===
// const PORT = 3000;
// app.listen(PORT, () => {
//     console.log(`\nPROTECTED EvMak Docs LIVE at http://localhost:${PORT}/docs`);
//     console.log(`Login page: http://localhost:${PORT}/docs-login`);
// });