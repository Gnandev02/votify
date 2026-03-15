import pool from '../../database/db.js';
import { authenticateRequest } from '../../lib/authUtils.js';

export default async function handler(req, res) {
    const user = authenticateRequest(req);
    if (!user || user.role !== 'admin') {
        return res.status(401).json({ message: 'Unauthorized. Admin access required.' });
    }

    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

    try {
        const { title, description, start_date, end_date } = req.body;

        if (!title || !start_date || !end_date) {
            return res.status(400).json({ message: 'Missing fields' });
        }

        await pool.query(
            'INSERT INTO elections (title, description, start_date, end_date, status) VALUES ($1, $2, $3, $4, $5)',
            [title, description || '', start_date, end_date, 'upcoming']
        );

        return res.status(201).json({ message: 'Election created successfully' });
    } catch (error) {
        console.error('Create Election Error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}
