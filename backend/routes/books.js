const express = require('express');
const pool = require('../db');

const router = express.Router();

/**
 * POST search/list books with filters
 * POST /api/books
 * Body: { q, category, author, publisher, limit, offset, price_min, price_max, sort_by }
 * 
 * a) Search by ISBN, Title, or Author name (via q parameter)
 * b) Filter by Category, Author, Publisher, Price Range
 * c) Sort by price, title, or publication_year
 * d) Returns book details and availability status
 */
router.post('/', async (req, res) => {
    try {
        // ---- 1) Read body params (all optional) ----
        const q = String(req.body.q || '').trim(); // search text (ISBN, title, author)
        const category = String(req.body.category || '').trim(); // category filter
        const author = String(req.body.author || '').trim(); // author filter
        const publisher = String(req.body.publisher || '').trim(); // publisher filter
        
        // Price range filters
        const price_min = Number(req.body.price_min) || 0;
        const price_max = Number(req.body.price_max) || Number.MAX_VALUE;
        
        // Sorting options: 'price', 'title', 'year', 'newest' (default)
        const sort_by = String(req.body.sort_by || 'newest').trim().toLowerCase();

        // pagination (safe defaults)
        const limit = Math.min(Number(req.body.limit || 20), 100);
        const offset = Math.max(Number(req.body.offset || 0), 0);

        // ---- 2) Build SQL dynamically, but SAFELY ----
        // We use placeholders (?) to prevent SQL injection.
        // JOIN with authors and publishers tables for comprehensive search
        let sql = `
            SELECT DISTINCT
                b.isbn,
                b.title,
                b.publisher_id,
                b.publication_year,
                b.selling_price,
                b.category,
                b.stock_qty,
                b.threshold,
                b.cover_url,
                b.created_at,
                p.name as publisher_name
            FROM books b
            LEFT JOIN book_authors ba ON b.isbn = ba.isbn
            LEFT JOIN authors a ON ba.author_id = a.id
            LEFT JOIN publishers p ON b.publisher_id = p.id
            WHERE 1=1
        `;
        const params = [];

        // Search: ISBN, title, or author name
        if (q) {
            sql += ` AND (b.title LIKE ? OR b.isbn LIKE ? OR a.full_name LIKE ?)`;
            params.push(`%${q}%`, `%${q}%`, `%${q}%`);
        }

        // Filter by category
        if (category) {
            sql += ` AND b.category = ?`;
            params.push(category);
        }

        // Filter by author name
        if (author) {
            sql += ` AND a.full_name = ?`;
            params.push(author);
        }

        // Filter by publisher name
        if (publisher) {
            sql += ` AND p.name = ?`;
            params.push(publisher);
        }
        
        // Filter by price range
        if (price_min > 0) {
            sql += ` AND b.selling_price >= ?`;
            params.push(price_min);
        }
        if (price_max < Number.MAX_VALUE) {
            sql += ` AND b.selling_price <= ?`;
            params.push(price_max);
        }

        // Add ORDER BY based on sort_by parameter
        if (sort_by === 'price') {
            sql += ` ORDER BY b.selling_price ASC, b.isbn DESC`;
        } else if (sort_by === 'price_desc') {
            sql += ` ORDER BY b.selling_price DESC, b.isbn DESC`;
        } else if (sort_by === 'title') {
            sql += ` ORDER BY b.title ASC, b.isbn DESC`;
        } else if (sort_by === 'year') {
            sql += ` ORDER BY b.publication_year DESC, b.isbn DESC`;
        } else {
            // default: newest first
            sql += ` ORDER BY b.created_at DESC, b.isbn DESC`;
        }
        
        sql += ` LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        // ---- 3) Run query ----
        const [rows] = await pool.query(sql, params);

        // ---- 4) Return consistent JSON with book details and availability ----
        res.json({
            ok: true,
            count: rows.length,
            limit,
            offset,
            data: rows.map(book => ({
                ...book,
                available: book.stock_qty > 0, // availability indicator
                inStock: book.stock_qty,
            })),
        });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});

/**
 * GET book by ISBN
 * GET /api/books/:isbn
 * Returns book details and availability
 */
router.get('/:isbn', async (req, res) => {
    try {
        const { isbn } = req.params;

        const [rows] = await pool.query(
            `SELECT * FROM books WHERE isbn = ?`,
            [isbn]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                ok: false,
                message: 'Book not found',
            });
        }

        const book = rows[0];
        res.json({
            ok: true,
            data: {
                ...book,
                available: book.stock_qty > 0, // availability indicator
                inStock: book.stock_qty,
            },
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            error: error.message,
        });
    }
});


module.exports = router;

/******************************************************************
 * End of File
 ******************************************************************/
