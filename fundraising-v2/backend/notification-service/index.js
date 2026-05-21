// notification-service/index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const pool = require('../db');
const app = express();
app.use(cors());
app.use(express.json());

// ─── SEND BROADCAST MESSAGE (Admin) ───────────────────────────────────────────
app.post('/messages', async (req, res) => {
  const { recipient, subject, content } = req.body;
  if (!recipient || !subject || !content)
    return res.status(400).json({ error: 'All fields required' });
  if (!['all', 'claimers', 'donors'].includes(recipient))
    return res.status(400).json({ error: 'Invalid recipient' });

  try {
    const result = await pool.query(
      'INSERT INTO messages (recipient, subject, content) VALUES ($1,$2,$3) RETURNING *',
      [recipient, subject, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET ALL MESSAGES (Admin) ─────────────────────────────────────────────────
app.get('/messages', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM messages ORDER BY date_sent DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET MESSAGES FOR CLAIMERS ────────────────────────────────────────────────
app.get('/messages/claimers', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM messages WHERE recipient IN ('all','claimers') ORDER BY date_sent DESC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET MESSAGES FOR DONORS ──────────────────────────────────────────────────
app.get('/messages/donors', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM messages WHERE recipient IN ('all','donors') ORDER BY date_sent DESC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── DELETE MESSAGE (Admin) ───────────────────────────────────────────────────
app.delete('/messages/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM messages WHERE id=$1', [req.params.id]);
    res.json({ message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.NOTIFICATION_SERVICE_PORT || 3004;
app.listen(PORT, () => console.log(`📨 Notification Service running on port ${PORT}`));
