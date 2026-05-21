// admin-service/index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const pool = require('../db');
const app = express();
app.use(cors());
app.use(express.json());

// ─── SYSTEM STATS ─────────────────────────────────────────────────────────────
app.get('/stats', async (req, res) => {
  try {
    const users = await pool.query('SELECT COUNT(*) FROM users');
    const claims = await pool.query('SELECT COUNT(*) FROM claims');
    const approved = await pool.query("SELECT COUNT(*) FROM claims WHERE status='approved'");
    const donors = await pool.query("SELECT COUNT(*) FROM users WHERE role='donor'");

    const total = parseInt(claims.rows[0].count);
    const app_count = parseInt(approved.rows[0].count);
    const rate = total > 0 ? ((app_count / total) * 100).toFixed(1) + '%' : '0%';

    res.json({
      totalUsers: parseInt(users.rows[0].count),
      totalClaims: total,
      approvalRate: rate,
      activeDonors: parseInt(donors.rows[0].count)
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET DEPARTMENTS ──────────────────────────────────────────────────────────
app.get('/departments', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM departments ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── ADD DEPARTMENT ───────────────────────────────────────────────────────────
app.post('/departments', async (req, res) => {
  const { name, hod_no, clerk_no } = req.body;
  if (!name || !hod_no || !clerk_no)
    return res.status(400).json({ error: 'All fields required' });

  try {
    const result = await pool.query(
      'INSERT INTO departments (name, hod_no, clerk_no) VALUES ($1,$2,$3) RETURNING *',
      [name, hod_no, clerk_no]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── UPDATE DEPARTMENT ────────────────────────────────────────────────────────
app.put('/departments/:id', async (req, res) => {
  const { name, hod_no, clerk_no } = req.body;
  try {
    const result = await pool.query(
      'UPDATE departments SET name=$1, hod_no=$2, clerk_no=$3 WHERE id=$4 RETURNING *',
      [name, hod_no, clerk_no, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Department not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── DELETE DEPARTMENT ────────────────────────────────────────────────────────
app.delete('/departments/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM departments WHERE id=$1', [req.params.id]);
    res.json({ message: 'Department deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.ADMIN_SERVICE_PORT || 3005;
app.listen(PORT, () => console.log(`⚙️  Admin Service running on port ${PORT}`));
