import pool from '../../database/db.js';
import { authenticateRequest } from '../../lib/authUtils.js';

export default async function handler(req, res) {
    const user = authenticateRequest(req);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    if (req.method !== 'GET') return res.status(405).json({ message: 'Method Not Allowed' });

    try {
        const { election_id } = req.query;
        let query = 'SELECT * FROM candidates';
        let params = [];
        if (election_id) {
            query += ' WHERE election_id = ?';
            params.push(election_id);
        }
        const [rows] = await pool.query(query, params);
        return res.status(200).json(rows);
    } catch (err) {
        console.error('List Candidates Error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
}
