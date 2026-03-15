import pool from '../database/db.js';
import { authenticateRequest } from '../lib/authUtils.js';

export default async function handler(req, res) {
    const user = authenticateRequest(req);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const { action } = req.query;

    if (req.method === 'GET') {
        try {
            const { election_id } = req.query;
            let query = 'SELECT * FROM candidates';
            let params = [];
            if (election_id) {
                query += ' WHERE election_id = $1';
                params.push(election_id);
            }
            const result = await pool.query(query, params);
            return res.status(200).json(result.rows);
        } catch (err) {
            return res.status(500).json({ message: 'Server error' });
        }
    }

    if (req.method === 'POST') {
        if (user.role !== 'admin') return res.status(401).json({ message: 'Admin required' });

        try {
            if (action === 'add') {
                const { election_id, name, party, photo } = req.body;
                if (!election_id || !name) return res.status(400).json({ message: 'Missing fields' });
                await pool.query('INSERT INTO candidates (election_id, name, party, photo) VALUES ($1, $2, $3, $4)', [election_id, name, party || null, photo || null]);
                return res.status(201).json({ message: 'Candidate added successfully' });
            }

            if (action === 'delete') {
                const { election_id, candidate_id } = req.body;
                if (!election_id || !candidate_id) return res.status(400).json({ message: 'Missing IDs' });
                await pool.query('DELETE FROM candidates WHERE id = $1 AND election_id = $2', [candidate_id, election_id]);
                return res.status(200).json({ message: 'Candidate deleted' });
            }

            return res.status(400).json({ message: 'Invalid action' });
        } catch (err) {
            console.error('Candidate Error:', err);
            return res.status(500).json({ message: 'Server error' });
        }
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
}
