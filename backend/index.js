require('dotenv').config();

const express = require('express');
const cors = require('cors');
const pool = require('./db');
const cookieParser = require('cookie-parser'); // Import this

const app = express();

// --------------------
// Middleware
// --------------------

// 1. COOKIE PARSER (Must be before routes)
app.use(cookieParser());

// 2. CORS (Must be specific for cookies to work)
app.use(
  cors({
    origin: 'http://localhost:5173', // <--- REPLACE THIS if your React runs on a different port
    credentials: true, // <--- THIS IS THE KEY FIX
  })
);

// 3. JSON Parser
app.use(express.json());

// --------------------
// Routes
// --------------------
const bookRoutes = require('./routes/books');
const customerRoutes = require('./routes/customers');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/admin', adminRoutes);

// --------------------
// Health checks
// --------------------
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    message: 'Server is running',
  });
});

app.get('/db-test', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    res.json({ ok: true, result: rows });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// --------------------
// Start server
// --------------------
const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
