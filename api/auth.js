import pool from '../database/db.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../lib/authUtils.js';
import { sendOTP } from '../lib/otpUtils.js';

export default async function handler(req, res) {
    res.setHeader('Content-Type', 'application/json');
    const { action } = req.query;

    if (req.method === 'POST') {
        try {
            if (action === 'register') {
                const { name, email, password, role, resend } = req.body;

                if (resend) {
                    if (!email) return res.status(400).json({ success: false, message: 'Email required for resend' });
                    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
                    if (userCheck.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
                    const otp = Math.floor(100000 + Math.random() * 900000).toString();
                    const expiresAt = new Date(Date.now() + 10 * 60000);
                    await pool.query('INSERT INTO otps (email, otp, expires_at) ON CONFLICT (email) DO UPDATE SET otp = $2, expires_at = $3', [email, otp, expiresAt]);
                    await sendOTP(email, otp);
                    return res.status(200).json({ success: true, message: 'New OTP sent.' });
                }

                if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Missing required fields' });
                const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
                if (existing.rows.length > 0) return res.status(409).json({ message: 'Email already exists' });

                const hashedPassword = await bcrypt.hash(password, 10);
                const assignedRole = role === 'admin' ? 'admin' : 'voter';
                await pool.query('INSERT INTO users (name, email, password, role, verified) VALUES ($1, $2, $3, $4, false)', [name, email, hashedPassword, assignedRole]);
                
                const otp = Math.floor(100000 + Math.random() * 900000).toString();
                const expiresAt = new Date(Date.now() + 10 * 60000);
                await pool.query('INSERT INTO otps (email, otp, expires_at) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET otp = $2, expires_at = $3', [email, otp, expiresAt]);
                
                try {
                    await sendOTP(email, otp);
                    return res.status(200).json({ success: true, message: 'OTP sent successfully. Please verify your email.' });
                } catch (emailError) {
                    await pool.query('DELETE FROM otps WHERE email = $1', [email]);
                    await pool.query('DELETE FROM users WHERE email = $1', [email]);
                    return res.status(500).json({ success: false, message: 'Failed to send OTP email.' });
                }
            }

            if (action === 'login') {
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
            }

            if (action === 'verify') {
                const { email, otp } = req.body;
                if (!email || !otp) return res.status(400).json({ success: false, message: 'Missing fields' });
                const result = await pool.query('SELECT * FROM otps WHERE email = $1 AND otp = $2', [email, otp]);
                if (result.rows.length === 0) return res.status(400).json({ success: false, message: 'Invalid OTP' });
                if (new Date() > new Date(result.rows[0].expires_at)) return res.status(400).json({ success: false, message: 'OTP has expired' });
                await pool.query('UPDATE users SET verified = true WHERE email = $1', [email]);
                await pool.query('DELETE FROM otps WHERE email = $1', [email]);
                return res.status(200).json({ success: true, message: 'Email verified successfully.' });
            }

            if (action === 'forgot-password') {
                const { email } = req.body;
                if (!email) return res.status(400).json({ message: 'Missing email' });
                const users = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
                if (users.rows.length === 0) return res.status(404).json({ message: 'User not found' });
                const otp = Math.floor(100000 + Math.random() * 900000).toString();
                const expiresAt = new Date(Date.now() + 10 * 60000);
                await pool.query('INSERT INTO otps (email, otp, expires_at) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET otp = $2, expires_at = $3', [email, otp, expiresAt]);
                await sendOTP(email, otp);
                return res.status(200).json({ message: 'Reset OTP sent successfully.' });
            }

            return res.status(400).json({ message: 'Invalid action' });
        } catch (error) {
            console.error('Auth Error:', error);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
}
