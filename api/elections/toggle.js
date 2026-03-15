import pool from '../../database/db.js';
import { authenticateRequest } from '../../lib/authUtils.js';

export default async function handler(req, res) {
    const user = authenticateRequest(req);
    if (!user || user.role !== 'admin') return res.status(401).json({ message: 'Unauthorized' });

    if (req.method !== 'PUT') return res.status(405).json({ message: 'Method Not Allowed' });

    try {
        const { id, status } = req.body;
        if (!id || !status) return res.status(400).json({ message: 'Missing fields' });

        await pool.query('UPDATE elections SET status = ? WHERE id = ?', [status, id]);
        return res.status(200).json({ message: 'Election status updated' });
    } catch (err) {
        console.error('Toggle Election Error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
}
