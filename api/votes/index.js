import pool from '../../database/db.js';
import { authenticateRequest } from '../../lib/authUtils.js';

export default async function handler(req, res) {
    const user = authenticateRequest(req);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    if (req.method !== 'GET') return res.status(405).json({ message: 'Method Not Allowed' });

    try {
        const [rows] = await pool.query('SELECT election_id, candidate_id FROM votes WHERE user_id = ?', [user.id]);
        return res.status(200).json(rows);
    } catch (err) {
        console.error('Get Votes Error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
}
