import pool from '../../database/db.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../../lib/authUtils.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method Not Allowed' });

    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ success: false, message: 'Missing fields' });

        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(401).json({ success: false, message: 'Invalid credentials' });

        const user = result.rows[0];
        if (!user.verified) return res.status(403).json({ success: false, message: 'Please verify your email first' });

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return res.status(401).json({ success: false, message: 'Invalid credentials' });

        const token = generateToken({ id: user.id, email: user.email, role: user.role });
        delete user.password;

        return res.status(200).json({ success: true, token, user });
    } catch (error) {
        console.error('Login Error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}
