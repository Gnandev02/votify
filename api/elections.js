import pool from '../database/db.js';
import { authenticateRequest } from '../lib/authUtils.js';

export default async function handler(req, res) {
    const user = authenticateRequest(req);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const { action, election_id } = req.query;

    if (req.method === 'GET') {
        try {
            // If election_id is provided, list candidates for that election
            if (election_id) {
                const result = await pool.query('SELECT * FROM candidates WHERE election_id = $1', [election_id]);
                return res.status(200).json(result.rows);
            }
            // Otherwise, list all elections
            const result = await pool.query('SELECT * FROM elections ORDER BY created_at DESC');
            return res.status(200).json(result.rows);
        } catch (err) {
            console.error('Election Fetch Error:', err);
            return res.status(500).json({ message: 'Server error' });
        }
    }

    if (req.method === 'POST') {
        if (user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
        
        try {
            // Create Election
            if (action === 'create') {
                const { title, description, start_date, end_date } = req.body;
                if (!title || !start_date || !end_date) return res.status(400).json({ message: 'Missing fields' });
                await pool.query('INSERT INTO elections (title, description, start_date, end_date, status) VALUES ($1, $2, $3, $4, $5)', [title, description || '', start_date, end_date, 'upcoming']);
                return res.status(201).json({ message: 'Election created successfully' });
            }

            // Add Candidate
            if (action === 'add-candidate') {
                const { election_id, name, party, photo } = req.body;
                if (!election_id || !name) return res.status(400).json({ message: 'Missing fields' });
                await pool.query('INSERT INTO candidates (election_id, name, party, photo) VALUES ($1, $2, $3, $4)', [election_id, name, party || null, photo || null]);
                return res.status(201).json({ message: 'Candidate added successfully' });
            }

            // Toggle Election Status
            if (action === 'toggle') {
                const { id, status } = req.body;
                if (!id || !status) return res.status(400).json({ message: 'Missing fields' });
                await pool.query('UPDATE elections SET status = $1 WHERE id = $2', [status, id]);
                return res.status(200).json({ message: 'Election status updated' });
            }

            // Delete Election
            if (action === 'delete') {
                const { id } = req.body;
                await pool.query('DELETE FROM elections WHERE id = $1', [id]);
                return res.status(200).json({ message: 'Election deleted' });
            }

            // Delete Candidate
            if (action === 'delete-candidate') {
                const { candidate_id } = req.body;
                await pool.query('DELETE FROM candidates WHERE id = $1', [candidate_id]);
                return res.status(200).json({ message: 'Candidate deleted' });
            }

            return res.status(400).json({ message: 'Invalid action' });
        } catch (error) {
            console.error('Election Action Error:', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
}
