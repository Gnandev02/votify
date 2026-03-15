import pool from '../../database/db.js';
import { authenticateRequest } from '../../lib/authUtils.js';

export default async function handler(req, res) {
    const user = authenticateRequest(req);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

    try {
        const { election_id, candidate_id } = req.body;
        if (!election_id || !candidate_id) return res.status(400).json({ message: 'Missing fields' });

        const [elections] = await pool.query('SELECT * FROM elections WHERE id = ?', [election_id]);
        if (elections.length === 0 || elections[0].status !== 'active') {
            return res.status(400).json({ message: 'Election is not active' });
        }

        const [votes] = await pool.query('SELECT * FROM votes WHERE user_id = ? AND election_id = ?', [user.id, election_id]);
        if (votes.length > 0) {
            return res.status(403).json({ message: 'You have already voted in this election' });
        }

        await pool.query(
            'INSERT INTO votes (user_id, election_id, candidate_id) VALUES (?, ?, ?)',
            [user.id, election_id, candidate_id]
        );

        return res.status(201).json({ message: 'Vote successfully submitted' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(403).json({ message: 'You have already voted in this election' });
        }
        console.error('Submit Vote Error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
}
