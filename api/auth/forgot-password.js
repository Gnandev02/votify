import pool from '../../database/db.js';
import { sendOTP } from '../../lib/otpUtils.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Missing email' });

        const users = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (users.rows.length === 0) return res.status(404).json({ message: 'User not found' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60000); // 10 mins

        await pool.query(
            `INSERT INTO otps (email, otp, expires_at) VALUES ($1, $2, $3)
             ON CONFLICT (email) DO UPDATE SET otp = $2, expires_at = $3`,
            [email, otp, expiresAt]
        );

        await sendOTP(email, otp);
        return res.status(200).json({ message: 'Reset OTP sent successfully.' });
    } catch (error) {
        console.error('Forgot Password Error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}
