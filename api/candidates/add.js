import pool from '../../database/db.js';
import { authenticateRequest } from '../../lib/authUtils.js';

export default async function handler(req, res) {
    const user = authenticateRequest(req);
    if (!user || user.role !== 'admin') return res.status(401).json({ message: 'Unauthorized' });

    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

    try {
        const { election_id, name, party, photo } = req.body;
        if (!election_id || !name) return res.status(400).json({ message: 'Missing fields' });

        await pool.query(
            'INSERT INTO candidates (election_id, name, party, photo) VALUES ($1, $2, $3, $4)',
            [election_id, name, party || null, photo || null]
        );

        return res.status(201).json({ message: 'Candidate added successfully' });
    } catch (err) {
        console.error('Add Candidate Error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
}
