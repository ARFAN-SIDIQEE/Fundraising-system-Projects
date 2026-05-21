// donation-service/index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const pool = require('../db');
const app = express();
app.use(cors());
app.use(express.json());

// ─── SUBMIT DONATION ──────────────────────────────────────────────────────────
app.post('/donations', async (req, res) => {
  const { claim_id, donor_id, donor_name, amount, transaction_id, payment_date } = req.body;
  if (!claim_id || !donor_id || !donor_name || !amount || !transaction_id)
    return res.status(400).json({ error: 'All fields required' });
  if (parseFloat(amount) < 100)
    return res.status(400).json({ error: 'Minimum donation is PKR 100' });

  try {
    const result = await pool.query(
      `INSERT INTO donations (claim_id, donor_id, donor_name, amount, transaction_id, payment_date)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [claim_id, donor_id, donor_name, parseFloat(amount), transaction_id, payment_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET MY DONATIONS (Donor) ─────────────────────────────────────────────────
app.get('/donations/donor/:donorId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.*, c.claimer_name FROM donations d
       LEFT JOIN claims c ON d.claim_id = c.id
       WHERE d.donor_id=$1 ORDER BY d.date DESC`,
      [req.params.donorId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET ALL DONATIONS (Admin) ────────────────────────────────────────────────
app.get('/donations', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.*, c.claimer_name, u.name as donor_full_name
       FROM donations d
       LEFT JOIN claims c ON d.claim_id = c.id
       LEFT JOIN users u ON d.donor_id = u.id
       ORDER BY d.date DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET DONATION STATS (Admin) ───────────────────────────────────────────────
app.get('/donations/stats', async (req, res) => {
  try {
    const total = await pool.query('SELECT COALESCE(SUM(amount),0) as total FROM donations');
    const count = await pool.query('SELECT COUNT(*) FROM donations');
    const active = await pool.query("SELECT COUNT(*) FROM claims WHERE status='approved'");
    res.json({
      totalFunds: total.rows[0].total,
      totalDonations: count.rows[0].count,
      activeClaims: active.rows[0].count
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── VERIFY DONATION (Admin) ──────────────────────────────────────────────────
app.patch('/donations/:id/verify', async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE donations SET status='verified' WHERE id=$1 RETURNING *",
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Donation not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── DELETE DONATION (Admin) ──────────────────────────────────────────────────
app.delete('/donations/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM donations WHERE id=$1', [req.params.id]);
    res.json({ message: 'Donation deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.DONATION_SERVICE_PORT || 3003;
app.listen(PORT, () => console.log(`💰 Donation Service running on port ${PORT}`));
