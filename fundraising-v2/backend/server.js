const express   = require('express');
const cors      = require('cors');
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const { Pool }  = require('pg');
const path      = require('path');
const net       = require('net');
const fs        = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'] }));
app.options('*', cors());
app.use(express.json({ limit: '20mb' }));

const JWT_SECRET = process.env.JWT_SECRET || 'fundraising_secret_key';

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 5432,
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || 'yourpassword',
  database: process.env.DB_NAME     || 'fundraising_db',
});
pool.connect().then(() => console.log('✅ PostgreSQL connected')).catch(err => {
  console.error('❌ PostgreSQL failed:', err.message);
  console.error('👉 Check DB_PASSWORD in backend/.env');
});

// ── Auth Middleware ────────────────────────────────────────────────────────────
const auth = (req, res, next) => {
  const token = (req.headers.authorization || '').split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(403).json({ error: 'Invalid token' }); }
};
const adminAuth = (req, res, next) => {
  auth(req, res, () => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    next();
  });
};

// ═══════════════ HEALTH ═══════════════════════════════════════════════════════
app.get('/health', (_, res) => res.json({ status: 'OK', timestamp: new Date() }));

// ═══════════════ AUTH ═════════════════════════════════════════════════════════
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) return res.status(400).json({ error: 'All fields required' });
  if (!['claimer','donor'].includes(role)) return res.status(400).json({ error: 'Role must be claimer or donor' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be 6+ characters' });
  try {
    const exists = await pool.query('SELECT id FROM users WHERE email=$1', [email.toLowerCase()]);
    if (exists.rows.length) return res.status(409).json({ error: 'Email already registered' });
    const hashed = await bcrypt.hash(password, 10);
    const r = await pool.query(
      'INSERT INTO users (name,email,password,role) VALUES ($1,$2,$3,$4) RETURNING id,name,email,role,registration_date',
      [name, email.toLowerCase(), hashed, role]
    );
    const user  = r.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ user, token });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error: ' + err.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) return res.status(400).json({ error: 'All fields required' });
  try {
    const r = await pool.query('SELECT * FROM users WHERE email=$1', [email.toLowerCase()]);
    if (!r.rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = r.rows[0];
    if (user.role !== role) return res.status(401).json({ error: 'Wrong role selected' });
    if (!await bcrypt.compare(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...safe } = user;
    res.json({ user: safe, token });
  } catch (err) { res.status(500).json({ error: 'Server error: ' + err.message }); }
});

app.post('/api/auth/admin-login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'All fields required' });
  try {
    const r = await pool.query('SELECT * FROM admins WHERE email=$1', [email.toLowerCase()]);
    if (!r.rows.length) return res.status(401).json({ error: 'Invalid admin credentials' });
    const admin = r.rows[0];
    if (!await bcrypt.compare(password, admin.password)) return res.status(401).json({ error: 'Invalid admin credentials' });
    const token = jwt.sign({ id: admin.id, email: admin.email, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...safe } = admin;
    res.json({ admin: safe, token });
  } catch (err) { res.status(500).json({ error: 'Server error: ' + err.message }); }
});

// ═══════════════ CLAIMS ═══════════════════════════════════════════════════════
app.post('/api/claims', auth, async (req, res) => {
  const { user_id,claimer_name,amount,department,semester,description,hod_file_name,hod_file_type,hod_file_data,hod_no,easypaisa_no } = req.body;
  if (!user_id||!claimer_name||!amount||!department||!description||!easypaisa_no) return res.status(400).json({ error: 'Required fields missing' });
  try {
    const r = await pool.query(
      `INSERT INTO claims (user_id,claimer_name,amount,department,semester,description,hod_file_name,hod_file_type,hod_file_data,hod_no,easypaisa_no)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [user_id,claimer_name,amount,department,semester,description,hod_file_name,hod_file_type,hod_file_data,hod_no,easypaisa_no]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/claims/approved', async (req, res) => {
  try {
    const r = await pool.query(`SELECT id,claimer_name,amount,department,semester,description,easypaisa_no,date_submitted FROM claims WHERE status='approved' ORDER BY date_submitted DESC`);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/claims/pending', auth, async (req, res) => {
  try {
    const r = await pool.query(`SELECT * FROM claims WHERE status='pending' ORDER BY date_submitted DESC`);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/claims/user/:userId', auth, async (req, res) => {
  try {
    const r = await pool.query(`SELECT id,claimer_name,amount,department,semester,status,date_submitted FROM claims WHERE user_id=$1 ORDER BY date_submitted DESC`, [req.params.userId]);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/claims', auth, async (req, res) => {
  try {
    const r = await pool.query(`SELECT id,claimer_name,amount,department,semester,status,date_submitted FROM claims ORDER BY date_submitted DESC`);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/claims/:id', auth, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM claims WHERE id=$1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/claims/:id/status', auth, async (req, res) => {
  const { status } = req.body;
  if (!['approved','rejected','pending'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  try {
    const r = await pool.query('UPDATE claims SET status=$1 WHERE id=$2 RETURNING *', [status, req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/claims/:id', auth, async (req, res) => {
  try { await pool.query('DELETE FROM claims WHERE id=$1', [req.params.id]); res.json({ message: 'Deleted' }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════ DONATIONS (screenshot-based) ═════════════════════════════════
app.post('/api/donations', auth, async (req, res) => {
  const { claim_id,donor_id,donor_name,amount,payment_method,screenshot_data,screenshot_type,screenshot_name,payment_date } = req.body;
  if (!claim_id||!donor_id||!donor_name||!amount||!screenshot_data) return res.status(400).json({ error: 'Screenshot is required' });
  if (parseFloat(amount) < 100) return res.status(400).json({ error: 'Minimum donation is PKR 100' });
  try {
    const r = await pool.query(
      `INSERT INTO donations (claim_id,donor_id,donor_name,amount,payment_method,screenshot_data,screenshot_type,screenshot_name,payment_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id,donor_name,amount,payment_method,screenshot_name,payment_date,status,date`,
      [claim_id,donor_id,donor_name,parseFloat(amount),payment_method||'EasyPaisa',screenshot_data,screenshot_type,screenshot_name,payment_date]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/donations/stats', auth, async (req, res) => {
  try {
    const total  = await pool.query("SELECT COALESCE(SUM(amount),0) as total FROM donations WHERE status='verified'");
    const count  = await pool.query('SELECT COUNT(*) FROM donations');
    const active = await pool.query("SELECT COUNT(*) FROM claims WHERE status='approved'");
    res.json({ totalFunds: total.rows[0].total, totalDonations: count.rows[0].count, activeClaims: active.rows[0].count });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/donations/donor/:donorId', auth, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT d.id,d.donor_name,d.amount,d.payment_method,d.screenshot_name,d.payment_date,d.status,d.date,c.claimer_name
       FROM donations d LEFT JOIN claims c ON d.claim_id=c.id WHERE d.donor_id=$1 ORDER BY d.date DESC`,
      [req.params.donorId]
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin: get all donations WITH screenshot data for verification
app.get('/api/donations', auth, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT d.id,d.donor_name,d.amount,d.payment_method,d.screenshot_data,d.screenshot_type,d.screenshot_name,
              d.payment_date,d.status,d.date,c.claimer_name,u.email as donor_email
       FROM donations d
       LEFT JOIN claims c ON d.claim_id=c.id
       LEFT JOIN users  u ON d.donor_id=u.id
       ORDER BY d.date DESC`
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/donations/:id/verify', auth, async (req, res) => {
  try {
    const r = await pool.query("UPDATE donations SET status='verified' WHERE id=$1 RETURNING *", [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/donations/:id/reject', auth, async (req, res) => {
  try {
    const r = await pool.query("UPDATE donations SET status='rejected' WHERE id=$1 RETURNING *", [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/donations/:id', auth, async (req, res) => {
  try { await pool.query('DELETE FROM donations WHERE id=$1', [req.params.id]); res.json({ message: 'Deleted' }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════ MESSAGES (filtered by registration date) ═════════════════════
app.post('/api/messages', auth, async (req, res) => {
  const { recipient, subject, content } = req.body;
  if (!recipient||!subject||!content) return res.status(400).json({ error: 'All fields required' });
  try {
    const r = await pool.query('INSERT INTO messages (recipient,subject,content) VALUES ($1,$2,$3) RETURNING *', [recipient,subject,content]);
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/messages', auth, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM messages ORDER BY date_sent DESC');
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Claimers only see messages sent AFTER they registered
app.get('/api/messages/claimers', auth, async (req, res) => {
  try {
    // Get user's registration date
    const user = await pool.query('SELECT registration_date FROM users WHERE id=$1', [req.user.id]);
    const regDate = user.rows[0]?.registration_date || new Date(0);
    const r = await pool.query(
      `SELECT * FROM messages WHERE recipient IN ('all','claimers') AND date_sent >= $1 ORDER BY date_sent DESC`,
      [regDate]
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Donors only see messages sent AFTER they registered
app.get('/api/messages/donors', auth, async (req, res) => {
  try {
    const user = await pool.query('SELECT registration_date FROM users WHERE id=$1', [req.user.id]);
    const regDate = user.rows[0]?.registration_date || new Date(0);
    const r = await pool.query(
      `SELECT * FROM messages WHERE recipient IN ('all','donors') AND date_sent >= $1 ORDER BY date_sent DESC`,
      [regDate]
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/messages/:id', auth, async (req, res) => {
  try { await pool.query('DELETE FROM messages WHERE id=$1', [req.params.id]); res.json({ message: 'Deleted' }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════ ADMIN PAYMENT INFO ═══════════════════════════════════════════
// Public - donors can read without auth
app.get('/api/payment-info', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM admin_payment_info ORDER BY id LIMIT 1');
    res.json(r.rows[0] || {});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin only - update payment info
app.post('/api/admin/payment-info', adminAuth, async (req, res) => {
  const { easypaisa_no, jazzcash_no, bank_name, bank_account, bank_title } = req.body;
  try {
    const exists = await pool.query('SELECT id FROM admin_payment_info LIMIT 1');
    let r;
    if (exists.rows.length) {
      r = await pool.query(
        `UPDATE admin_payment_info SET easypaisa_no=$1,jazzcash_no=$2,bank_name=$3,bank_account=$4,bank_title=$5,updated_at=NOW() WHERE id=$6 RETURNING *`,
        [easypaisa_no,jazzcash_no,bank_name,bank_account,bank_title,exists.rows[0].id]
      );
    } else {
      r = await pool.query(
        `INSERT INTO admin_payment_info (easypaisa_no,jazzcash_no,bank_name,bank_account,bank_title) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [easypaisa_no,jazzcash_no,bank_name,bank_account,bank_title]
      );
    }
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════ ADMIN ROUTES ═════════════════════════════════════════════════
app.get('/api/admin/users', adminAuth, async (req, res) => {
  try {
    const r = await pool.query('SELECT id,name,email,role,registration_date,is_active FROM users ORDER BY registration_date DESC');
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/users/:id', adminAuth, async (req, res) => {
  try { await pool.query('DELETE FROM users WHERE id=$1', [req.params.id]); res.json({ message: 'User deleted' }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/stats', adminAuth, async (req, res) => {
  try {
    const users    = await pool.query('SELECT COUNT(*) FROM users');
    const claims   = await pool.query('SELECT COUNT(*) FROM claims');
    const approved = await pool.query("SELECT COUNT(*) FROM claims WHERE status='approved'");
    const donors   = await pool.query("SELECT COUNT(*) FROM users WHERE role='donor'");
    const total    = parseInt(claims.rows[0].count);
    const appCount = parseInt(approved.rows[0].count);
    res.json({
      totalUsers:   parseInt(users.rows[0].count),
      totalClaims:  total,
      approvalRate: total > 0 ? ((appCount/total)*100).toFixed(1)+'%' : '0%',
      activeDonors: parseInt(donors.rows[0].count),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/departments', adminAuth, async (req, res) => {
  try { const r = await pool.query('SELECT * FROM departments ORDER BY id'); res.json(r.rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/departments', adminAuth, async (req, res) => {
  const { name, hod_no, clerk_no } = req.body;
  if (!name||!hod_no||!clerk_no) return res.status(400).json({ error: 'All fields required' });
  try {
    const r = await pool.query('INSERT INTO departments (name,hod_no,clerk_no) VALUES ($1,$2,$3) RETURNING *', [name,hod_no,clerk_no]);
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/admin/departments/:id', adminAuth, async (req, res) => {
  const { name, hod_no, clerk_no } = req.body;
  try {
    const r = await pool.query('UPDATE departments SET name=$1,hod_no=$2,clerk_no=$3 WHERE id=$4 RETURNING *', [name,hod_no,clerk_no,req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/departments/:id', adminAuth, async (req, res) => {
  try { await pool.query('DELETE FROM departments WHERE id=$1', [req.params.id]); res.json({ message: 'Deleted' }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════ AUTO PORT + START ════════════════════════════════════════════
function getFreePort(preferred) {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.listen(preferred, () => { const p = s.address().port; s.close(() => resolve(p)); });
    s.on('error', () => { const f = net.createServer(); f.listen(0, () => { const p = f.address().port; f.close(() => resolve(p)); }); });
  });
}

getFreePort(parseInt(process.env.PORT) || 4000).then((PORT) => {
  app.listen(PORT, () => {
    fs.writeFileSync('port.txt', String(PORT));
    console.log('\n========================================');
    console.log(`🚀  Server running on port ${PORT}`);
    console.log(`🌐  http://localhost:${PORT}`);
    console.log(`🏥  http://localhost:${PORT}/health`);
    console.log('========================================\n');
    if (PORT !== (parseInt(process.env.PORT)||4000)) {
      console.log(`⚠️  Port was busy — now using ${PORT}`);
      console.log(`👉  Set VITE_API_URL=http://localhost:${PORT}/api in frontend/.env\n`);
    }
  });
});
