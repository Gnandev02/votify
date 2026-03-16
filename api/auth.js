import pool from '../database/db.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../lib/authUtils.js';
import { sendOTP } from '../lib/email.js';

// In-memory storage for pending registrations
// NOTE: This will be cleared on Vercel cold starts/restarts
let pendingUsers = {};

export default async function handler(req, res) {
    // Ensure all responses are JSON
    res.setHeader('Content-Type', 'application/json');
    
    try {
        const { action } = req.query;

        if (req.method !== 'POST') {
            return res.status(405).json({ success: false, message: 'Method Not Allowed' });
        }

        if (action === 'register') {
            const { name, email, password, role, resend } = req.body;

            if (resend) {
                if (!email) return res.status(400).json({ success: false, message: 'Email required for resend' });
                
                // Check pending users first
                const pendingUser = pendingUsers[email];
                if (!pendingUser) return res.status(404).json({ success: false, message: 'No pending registration found for this email' });
                
                const otp = Math.floor(100000 + Math.random() * 900000).toString();
                pendingUser.otp = otp;
                pendingUser.expiresAt = new Date(Date.now() + 10 * 60000);
                
                await sendOTP(email, otp);
                return res.status(200).json({ success: true, message: 'New OTP sent successfully.' });
            }

            if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Missing required fields' });
            
            // Still check if email is already in the DB (verified users)
            const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
            if (existing.rows.length > 0) return res.status(409).json({ success: false, message: 'Email already exists and is verified' });

            const hashedPassword = await bcrypt.hash(password, 10);
            const assignedRole = role === 'admin' ? 'admin' : 'voter';
            
            // Generate OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 10 * 60000);
            
            // Store user data in memory temporarily
            pendingUsers[email] = {
                name,
                email,
                password: hashedPassword,
                role: assignedRole,
                otp,
                expiresAt
            };
            
            try {
                await sendOTP(email, otp);
                return res.status(200).json({ success: true, message: 'OTP sent to your email. Please verify to complete registration.' });
            } catch (emailError) {
                console.error('[Registration Error] Failed to send OTP:', emailError);
                delete pendingUsers[email]; // Cleanup
                return res.status(500).json({ success: false, message: 'Failed to send OTP email.' });
            }
        }

        if (action === 'verify-otp') {
            const { email, otp } = req.body;
            if (!email || !otp) return res.status(400).json({ success: false, message: 'Missing required fields' });
            
            const pendingUser = pendingUsers[email];
            if (!pendingUser) {
                return res.status(400).json({ success: false, message: 'No pending registration found. Please register again.' });
            }
            
            if (pendingUser.otp !== otp) {
                return res.status(400).json({ success: false, message: 'Invalid OTP' });
            }
            
            if (new Date() > new Date(pendingUser.expiresAt)) {
                delete pendingUsers[email];
                return res.status(400).json({ success: false, message: 'OTP has expired' });
            }
            
            // OTP is valid, now create the user in the database
            try {
                await pool.query(
                    'INSERT INTO users (name, email, password, role, verified) VALUES ($1, $2, $3, $4, true)', 
                    [pendingUser.name, pendingUser.email, pendingUser.password, pendingUser.role]
                );
                
                // Remove from pending storage
                delete pendingUsers[email];
                
                return res.status(200).json({ success: true, message: 'Account verified and created successfully!' });
            } catch (dbError) {
                console.error('[DB Error] Failed to create user:', dbError);
                return res.status(500).json({ success: false, message: 'Failed to create user account.' });
            }
        }

        if (action === 'login') {
            const { email, password } = req.body;
            if (!email || !password) return res.status(400).json({ success: false, message: 'Missing fields' });
            
            const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
            if (result.rows.length === 0) return res.status(401).json({ success: false, message: 'Invalid credentials' });
            
            const user = result.rows[0];
            // Since we only create users after verification now, user.verified should be true, but we'll check anyway
            if (!user.verified) return res.status(403).json({ success: false, message: 'Please verify your email first' });
            
            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) return res.status(401).json({ success: false, message: 'Invalid credentials' });
            
            const token = generateToken({ id: user.id, email: user.email, role: user.role });
            delete user.password;
            
            return res.status(200).json({ success: true, token, user });
        }

        return res.status(400).json({ success: false, message: 'Invalid action provided' });

    } catch (error) {
        console.error('[API Error] Auth Handler:', error);
        return res.status(500).json({ 
            success: false, 
            error: "Internal server error",
            message: "A server error occurred. Please try again later."
        });
    }
}
