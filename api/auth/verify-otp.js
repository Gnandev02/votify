import pool from '../../database/db.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ message: 'Missing fields' });

        const [rows] = await pool.query('SELECT * FROM otps WHERE email = ? AND otp = ?', [email, otp]);
        if (rows.length === 0) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        const { expires_at } = rows[0];
        if (new Date() > new Date(expires_at)) {
            return res.status(400).json({ message: 'OTP has expired' });
        }

        await pool.query('UPDATE users SET verified = true WHERE email = ?', [email]);
        await pool.query('DELETE FROM otps WHERE email = ?', [email]);

        return res.status(200).json({ message: 'Email verified successfully.' });
    } catch (err) {
        console.error('Verify OTP Error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
}
