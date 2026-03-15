import pool from '../../database/db.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ success: false, message: 'Missing fields' });

        const result = await pool.query('SELECT * FROM otps WHERE email = $1 AND otp = $2', [email, otp]);
        if (result.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        const { expires_at } = result.rows[0];
        if (new Date() > new Date(expires_at)) {
            return res.status(400).json({ success: false, message: 'OTP has expired' });
        }

        await pool.query('UPDATE users SET verified = true WHERE email = $1', [email]);
        await pool.query('DELETE FROM otps WHERE email = $1', [email]);

        return res.status(200).json({ success: true, message: 'Email verified successfully.' });
    } catch (err) {
        console.error('Verify OTP Error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}
