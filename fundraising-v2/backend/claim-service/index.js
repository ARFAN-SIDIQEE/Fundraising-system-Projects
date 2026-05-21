// claim-service/index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const pool = require('../db');
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // large limit for file uploads (base64)

// ─── SUBMIT CLAIM ─────────────────────────────────────────────────────────────
app.post('/claims', async (req, res) => {
  const {
    user_id, claimer_name, amount, department,
    semester, description, hod_file_name, hod_file_type,
    hod_file_data, hod_no, easypaisa_no
  } = req.body;

  if (!user_id || !claimer_name || !amount || !department || !description || !easypaisa_no)
    return res.status(400).json({ error: 'Required fields missing' });

  try {
    const result = await pool.query(
      `INSERT INTO claims
        (user_id, claimer_name, amount, department, semester, description,
         hod_file_name, hod_file_type, hod_file_data, hod_no, easypaisa_no)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [user_id, claimer_name, amount, department, semester, description,
       hod_file_name, hod_file_type, hod_file_data, hod_no, easypaisa_no]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET MY CLAIMS ────────────────────────────────────────────────────────────
app.get('/claims/user/:userId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, claimer_name, amount, department, semester, status, date_submitted
       FROM claims WHERE user_id=$1 ORDER BY date_submitted DESC`,
      [req.params.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET APPROVED CLAIMS (Donors) ─────────────────────────────────────────────
app.get('/claims/approved', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, claimer_name, amount, department, semester, description, easypaisa_no, date_submitted
       FROM claims WHERE status='approved' ORDER BY date_submitted DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET ALL CLAIMS (Admin) ───────────────────────────────────────────────────
app.get('/claims', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, claimer_name, amount, department, semester, status, date_submitted
       FROM claims ORDER BY date_submitted DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET PENDING CLAIMS (Admin) ───────────────────────────────────────────────
app.get('/claims/pending', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM claims WHERE status='pending' ORDER BY date_submitted DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET SINGLE CLAIM ─────────────────────────────────────────────────────────
app.get('/claims/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM claims WHERE id=$1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Claim not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── UPDATE CLAIM STATUS (Admin) ──────────────────────────────────────────────
app.patch('/claims/:id/status', async (req, res) => {
  const { status } = req.body;
  if (!['approved', 'rejected', 'pending'].includes(status))
    return res.status(400).json({ error: 'Invalid status' });

  try {
    const result = await pool.query(
      'UPDATE claims SET status=$1 WHERE id=$2 RETURNING *',
      [status, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Claim not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── DELETE CLAIM (Admin) ─────────────────────────────────────────────────────
app.delete('/claims/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM claims WHERE id=$1', [req.params.id]);
    res.json({ message: 'Claim deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.CLAIM_SERVICE_PORT || 3002;
app.listen(PORT, () => console.log(`📋 Claim Service running on port ${PORT}`));
