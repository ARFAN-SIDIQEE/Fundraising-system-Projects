// user-service/index.js
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const pool = require('../db');
const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'fundraising_secret_key';

// ─── REGISTER USER ────────────────────────────────────────────────────────────
app.post('/auth/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role)
    return res.status(400).json({ error: 'All fields required' });
  if (!['claimer', 'donor'].includes(role))
    return res.status(400).json({ error: 'Invalid role' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be 6+ characters' });

  try {
    const exists = await pool.query('SELECT id FROM users WHERE email=$1', [email.toLowerCase()]);
    if (exists.rows.length) return res.status(409).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1,$2,$3,$4) RETURNING id, name, email, role, registration_date',
      [name, email.toLowerCase(), hashed, role]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── LOGIN USER ───────────────────────────────────────────────────────────────
app.post('/auth/login', async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role)
    return res.status(400).json({ error: 'All fields required' });

  try {
    const result = await pool.query('SELECT * FROM users WHERE email=$1', [email.toLowerCase()]);
    if (!result.rows.length) return res.status(401).json({ error: 'Invalid credentials' });

    const user = result.rows[0];
    if (user.role !== role) return res.status(401).json({ error: 'Invalid role for this account' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── ADMIN LOGIN ──────────────────────────────────────────────────────────────
app.post('/auth/admin-login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'All fields required' });

  try {
    const result = await pool.query('SELECT * FROM admins WHERE email=$1', [email.toLowerCase()]);
    if (!result.rows.length) return res.status(401).json({ error: 'Invalid admin credentials' });

    const admin = result.rows[0];
    const match = await bcrypt.compare(password, admin.password);
    if (!match) return res.status(401).json({ error: 'Invalid admin credentials' });

    const token = jwt.sign({ id: admin.id, email: admin.email, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...safeAdmin } = admin;
    res.json({ admin: safeAdmin, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET ALL USERS (Admin) ────────────────────────────────────────────────────
app.get('/users', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, registration_date, is_active FROM users ORDER BY registration_date DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── DELETE USER ──────────────────────────────────────────────────────────────
app.delete('/users/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id=$1', [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.USER_SERVICE_PORT || 3001;
app.listen(PORT, () => console.log(`👤 User Service running on port ${PORT}`));
