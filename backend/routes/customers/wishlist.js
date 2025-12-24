const express = require('express');
const pool = require('../../db');
const { verifyCustomer } = require('../../middleware/auth');

const router = express.Router();

function ensureSameCustomer(req, res, next) {
    const paramId = Number(req.params.id);
    const authId = Number(req.user?.id);
    if (!authId || !paramId) {
        return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }
    if (authId !== paramId) {
        return res.status(403).json({ ok: false, error: 'Forbidden' });
    }
    next();
}

/**
 * GET /api/customers/:id/wishlist
 * Get all wishlisted books for a customer
 */
router.get(
    '/:id/wishlist',
    verifyCustomer,
    ensureSameCustomer,
    async (req, res) => {
        try {
            const customerId = Number(req.params.id);

            const [items] = await pool.query(
                `
        SELECT 
            b.isbn,
            b.title,
            b.selling_price,
            b.cover_url,
            b.stock_qty,
            b.category,
            b.publication_year,
            p.name as publisher_name,
            w.added_at
        FROM wishlists w
        JOIN books b ON b.isbn = w.isbn
        LEFT JOIN publishers p ON b.publisher_id = p.id
        WHERE w.customer_id = ?
        ORDER BY w.added_at DESC
        `,
                [customerId]
            );

            res.json({ ok: true, items, count: items.length });
        } catch (err) {
            res.status(500).json({ ok: false, error: err.message });
        }
    }
);

/**
 * POST /api/customers/:id/wishlist/:isbn
 * Add a book to customer's wishlist
 */
router.post(
    '/:id/wishlist/:isbn',
    verifyCustomer,
    ensureSameCustomer,
    async (req, res) => {
        try {
            const customerId = Number(req.params.id);
            const isbn = String(req.params.isbn || '').trim();

            if (!isbn) {
                return res.status(400).json({ ok: false, error: 'ISBN is required' });
            }

            // Check if book exists
            const [[book]] = await pool.query(
                'SELECT isbn FROM books WHERE isbn = ?',
                [isbn]
            );
            if (!book) {
                return res.status(404).json({ ok: false, error: 'Book not found' });
            }

            // Add to wishlist (ignore if already exists)
            await pool.query(
                `INSERT IGNORE INTO wishlists (customer_id, isbn) VALUES (?, ?)`,
                [customerId, isbn]
            );

            res.json({ ok: true, message: 'Added to wishlist' });
        } catch (err) {
            res.status(500).json({ ok: false, error: err.message });
        }
    }
);

/**
 * DELETE /api/customers/:id/wishlist/:isbn
 * Remove a book from customer's wishlist
 */
router.delete(
    '/:id/wishlist/:isbn',
    verifyCustomer,
    ensureSameCustomer,
    async (req, res) => {
        try {
            const customerId = Number(req.params.id);
            const isbn = req.params.isbn;

            await pool.query(
                'DELETE FROM wishlists WHERE customer_id = ? AND isbn = ?',
                [customerId, isbn]
            );

            res.json({ ok: true, message: 'Removed from wishlist' });
        } catch (err) {
            res.status(500).json({ ok: false, error: err.message });
        }
    }
);

module.exports = router;
