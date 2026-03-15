import pool from '../../database/db.js';
import { authenticateRequest } from '../../lib/authUtils.js';

export default async function handler(req, res) {
    const user = authenticateRequest(req);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    if (req.method !== 'GET') return res.status(405).json({ message: 'Method Not Allowed' });

    try {
        const result = await pool.query('SELECT * FROM elections ORDER BY start_date DESC');
        return res.status(200).json(result.rows);
    } catch (err) {
        console.error('List Elections Error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
}
