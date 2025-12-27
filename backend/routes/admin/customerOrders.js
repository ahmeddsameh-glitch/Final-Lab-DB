const express = require("express");
const pool = require("../../db");

const router = express.Router();

/**
 * GET /customer-orders
 * Fetches customer orders with customer and order details
 */
router.get("/", async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page || "1", 10));
        const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || "10", 10)));
        const offset = (page - 1) * limit;
        const search = req.query.search || "";

        let sql = `
            SELECT 
                o.id,
                o.order_date,
                o.total_price,
                o.card_last4,
                o.stripe_session_id,
                c.id as customer_id,
                c.email,
                c.first_name,
                c.last_name,
                COUNT(s.id) as item_count
            FROM orders o
            JOIN customers c ON o.customer_id = c.id
            LEFT JOIN sales s ON s.order_id = o.id
            WHERE 1=1
        `;

        const params = [];

        if (search) {
            sql += ` AND (c.email LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ? OR o.id = ?)`;
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern, search);
        }

        sql += ` GROUP BY o.id ORDER BY o.order_date DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const [rows] = await pool.query(sql, params);

        let countSql = `
            SELECT COUNT(DISTINCT o.id) as total 
            FROM orders o
            JOIN customers c ON o.customer_id = c.id
            WHERE 1=1
        `;
        const countParams = [];

        if (search) {
            countSql += ` AND (c.email LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ? OR o.id = ?)`;
            const searchPattern = `%${search}%`;
            countParams.push(searchPattern, searchPattern, searchPattern, search);
        }

        const [[{ total }]] = await pool.query(countSql, countParams);

        res.json({
            ok: true,
            data: rows,
            meta: { total, page, pages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, error: error.message });
    }
});

/**
 * GET /customer-orders/:id
 * Get order details with items
 */
router.get("/:id", async (req, res) => {
    try {
        const orderId = req.params.id;

        const [[order]] = await pool.query(
            `
            SELECT 
                o.*,
                c.email,
                c.first_name,
                c.last_name
            FROM orders o
            JOIN customers c ON o.customer_id = c.id
            WHERE o.id = ?
            `,
            [orderId]
        );

        if (!order) {
            return res.status(404).json({ ok: false, error: "Order not found" });
        }

        const [items] = await pool.query(
            `
            SELECT 
                s.*,
                b.title,
                b.cover_url,
                b.isbn
            FROM sales s
            JOIN books b ON s.isbn = b.isbn
            WHERE s.order_id = ?
            `,
            [orderId]
        );

        res.json({
            ok: true,
            order: { ...order, items },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, error: error.message });
    }
});

module.exports = router;
