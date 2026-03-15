import pool from '../database/db.js';
import { authenticateRequest } from '../lib/authUtils.js';

export default async function handler(req, res) {
    const user = authenticateRequest(req);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const { action } = req.query;

    if (req.method === 'GET') {
        try {
            const result = await pool.query('SELECT election_id, candidate_id FROM votes WHERE user_id = $1', [user.id]);
            return res.status(200).json(result.rows);
        } catch (err) {
            return res.status(500).json({ message: 'Server error' });
        }
    }

    if (req.method === 'POST') {
        if (action === 'submit') {
            try {
                const { election_id, candidate_id } = req.body;
                if (!election_id || !candidate_id) return res.status(400).json({ message: 'Missing fields' });

                const elections = await pool.query('SELECT * FROM elections WHERE id = $1', [election_id]);
                if (elections.rows.length === 0 || elections.rows[0].status !== 'active') return res.status(400).json({ message: 'Election is not active' });

                const existingVotes = await pool.query('SELECT * FROM votes WHERE user_id = $1 AND election_id = $2', [user.id, election_id]);
                if (existingVotes.rows.length > 0) return res.status(403).json({ message: 'You have already voted' });

                await pool.query('INSERT INTO votes (user_id, election_id, candidate_id) VALUES ($1, $2, $3)', [user.id, election_id, candidate_id]);
                return res.status(201).json({ message: 'Vote successfully submitted' });
            } catch (err) {
                if (err.code === '23505') return res.status(403).json({ message: 'You have already voted' });
                return res.status(500).json({ message: 'Server error' });
            }
        }
        return res.status(400).json({ message: 'Invalid action' });
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
}
