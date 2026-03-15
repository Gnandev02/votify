import pool from '../database/db.js';
import { authenticateRequest } from '../lib/authUtils.js';

export default async function handler(req, res) {
    const user = authenticateRequest(req);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const { action, election_id } = req.query;

    if (req.method === 'GET') {
        try {
            // Analytics for a specific election
            if (action === 'analytics') {
                if (!election_id) return res.status(400).json({ message: 'Missing election_id' });
                const query = `
                    SELECT c.id, c.name, c.party, c.photo, COUNT(v.id)::int AS vote_count
                    FROM candidates c
                    LEFT JOIN votes v ON c.id = v.candidate_id
                    WHERE c.election_id = $1
                    GROUP BY c.id
                `;
                const result = await pool.query(query, [election_id]);
                const election = await pool.query('SELECT * FROM elections WHERE id = $1', [election_id]);
                return res.status(200).json({ election: election.rows[0], results: result.rows });
            }

            // Global Statistics (Admin)
            if (user.role === 'admin') {
                const electionCount = await pool.query('SELECT COUNT(*) FROM elections');
                const voteCount = await pool.query('SELECT COUNT(*) FROM votes');
                const userCount = await pool.query('SELECT COUNT(*) FROM users');
                const users = await pool.query('SELECT id, name, email, role, verified, created_at FROM users');
                
                return res.status(200).json({
                    stats: {
                        elections: parseInt(electionCount.rows[0].count),
                        votes: parseInt(voteCount.rows[0].count),
                        users: parseInt(userCount.rows[0].count)
                    },
                    users: users.rows
                });
            }

            return res.status(400).json({ message: 'Invalid action' });
        } catch (err) {
            console.error('Dashboard Fetch Error:', err);
            return res.status(500).json({ message: 'Server error' });
        }
    }

    if (req.method === 'PUT') {
        if (user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
        
        // Admin user management (verify user)
        if (action === 'verify-user') {
            try {
                const { id, verified } = req.body;
                await pool.query('UPDATE users SET verified = $1 WHERE id = $2', [verified, id]);
                return res.status(200).json({ message: 'User verification status updated' });
            } catch (err) {
                return res.status(500).json({ message: 'Server error' });
            }
        }
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
}
