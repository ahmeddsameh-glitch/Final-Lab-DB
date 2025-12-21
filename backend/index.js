require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db'); 

const app = express();

app.use(express.json());
app.use(cors());

// Import routes
const bookRoutes = require('./routes/books');
const customerRoutes = require('./routes/customers');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

// Use the routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/admin', adminRoutes);

// Health check and DB test remain in index.js if you want
app.get('/health', (req, res) => {
    res.json({
        ok: true,
        message: 'Server is running',
    });
});

app.get('/db-test', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT 1 AS ok');

        res.json({
            ok: true,
            result: rows,
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            error: error.message,
        });
    }
});

// Start the server
const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
