import pool from '../../database/db.js';
import { authenticateRequest } from '../../lib/authUtils.js';

export default async function handler(req, res) {
    const user = authenticateRequest(req);
    if (!user || user.role !== 'admin') return res.status(401).json({ message: 'Unauthorized. Admin required.' });

    if (req.method !== 'GET') return res.status(405).json({ message: 'Method Not Allowed' });

    try {
        const { election_id } = req.query;
        if (!election_id) return res.status(400).json({ message: 'Missing election_id' });

        const query = `
            SELECT c.id, c.name, c.party, c.photo, COUNT(v.id)::int AS vote_count
            FROM candidates c
            LEFT JOIN votes v ON c.id = v.candidate_id
            WHERE c.election_id = $1
            GROUP BY c.id
        `;
        const result = await pool.query(query, [election_id]);

        const electionResult = await pool.query('SELECT * FROM elections WHERE id = $1', [election_id]);

        return res.status(200).json({
            election: electionResult.rows[0],
            results: result.rows
        });
    } catch (err) {
        console.error('Analytics Error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
}
