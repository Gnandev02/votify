import pool from '../database/db.js';
import { authenticateRequest } from '../lib/authUtils.js';

export default async function handler(req, res) {
    const user = authenticateRequest(req);
    if (!user || user.role !== 'admin') return res.status(401).json({ message: 'Unauthorized. Admin required.' });

    const { action } = req.query;

    if (req.method === 'GET') {
        try {
            const result = await pool.query('SELECT id, name, email, role, verified, created_at FROM users');
            return res.status(200).json(result.rows);
        } catch (err) {
            return res.status(500).json({ message: 'Server error' });
        }
    }

    if (req.method === 'PUT') {
        if (action === 'verify') {
            try {
                const { id, verified } = req.body;
                if (id === undefined || verified === undefined) return res.status(400).json({ message: 'Missing fields' });
                await pool.query('UPDATE users SET verified = $1 WHERE id = $2', [verified, id]);
                return res.status(200).json({ message: 'User verification status updated' });
            } catch (err) {
                return res.status(500).json({ message: 'Server error' });
            }
        }
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
}
