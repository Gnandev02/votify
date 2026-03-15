import pool from '../database/db.js';

export default async function handler(req, res) {
    try {
        const result = await pool.query('SELECT NOW()');
        res.status(200).json({ success: true, timestamp: result.rows[0] });
    } catch (err) {
        console.error('DB Connection Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
}
