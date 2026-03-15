import pool from '../database/db.js';
import { authenticateRequest } from '../lib/authUtils.js';

export default async function handler(req, res) {
    const user = authenticateRequest(req);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const { action } = req.query;

    if (req.method === 'GET') {
        try {
            const result = await pool.query('SELECT * FROM elections ORDER BY start_date DESC');
            return res.status(200).json(result.rows);
        } catch (err) {
            return res.status(500).json({ message: 'Server error' });
        }
    }

    if (req.method === 'POST') {
        if (user.role !== 'admin') return res.status(401).json({ message: 'Admin required' });
        
        try {
            if (action === 'create') {
                const { title, description, start_date, end_date } = req.body;
                if (!title || !start_date || !end_date) return res.status(400).json({ message: 'Missing fields' });
                await pool.query('INSERT INTO elections (title, description, start_date, end_date, status) VALUES ($1, $2, $3, $4, $5)', [title, description || '', start_date, end_date, 'upcoming']);
                return res.status(201).json({ message: 'Election created successfully' });
            }

            if (action === 'delete') {
                const { id } = req.body;
                if (!id) return res.status(400).json({ message: 'Missing ID' });
                await pool.query('DELETE FROM elections WHERE id = $1', [id]);
                return res.status(200).json({ message: 'Election deleted' });
            }

            if (action === 'toggle') {
                const { id, status } = req.body;
                if (!id || !status) return res.status(400).json({ message: 'Missing fields' });
                await pool.query('UPDATE elections SET status = $1 WHERE id = $2', [status, id]);
                return res.status(200).json({ message: 'Election status updated' });
            }

            return res.status(400).json({ message: 'Invalid action' });
        } catch (error) {
            console.error('Election Error:', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
}
