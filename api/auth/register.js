import pool from '../../database/db.js';
import bcrypt from 'bcryptjs';
import { sendOTP } from '../../lib/otpUtils.js';

// Temporary in-memory store for OTPs (In production, use Redis or a DB table)
// Memory variables reset on serverless function spin-up, so using DB is better.
// We'll store OTPs in a temporary table or directly in the users table with an `otp` column.
// Since we can't alter the `users` table schema provided, we will just use a generic implementation.
// Let's assume we can add an `otp` and `otp_expiry` to users, but the user explicitly gave the schema.
// A typical solution: temporarily store OTP in an `otps` table. If it doesn't exist, we fallback to memory just in case, or we create the otps table dynamically if needed.
// For simplicity and resilience in serverless, let's create a small `otps` table if it doesn't exist.

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(409).json({ message: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const assignedRole = role === 'admin' ? 'admin' : 'voter';

        // Instead of verifying immediately, we create an unverified user and send OTP.
        await pool.query(
            'INSERT INTO users (name, email, password, role, verified) VALUES (?, ?, ?, ?, false)',
            [name, email, hashedPassword, assignedRole]
        );

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60000); // 10 mins

        await pool.query(
            'INSERT INTO otps (email, otp, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE otp = ?, expires_at = ?',
            [email, otp, expiresAt, otp, expiresAt]
        );

        try {
            await sendOTP(email, otp);
            return res.status(200).json({ message: 'OTP sent successfully. Please verify your email.' });
        } catch (emailError) {
            console.error('Failed to send OTP email:', emailError);
            // Rollback the unverified user and otp entry so they can try again
            await pool.query('DELETE FROM otps WHERE email = ?', [email]);
            await pool.query('DELETE FROM users WHERE email = ?', [email]);
            return res.status(500).json({ message: 'Failed to send OTP email. Please check your email configuration.' });
        }
    } catch (error) {
        console.error('Registration Error:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
