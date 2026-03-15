import nodemailer from 'nodemailer';

export const sendOTP = async (email, otp) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error(`[OTP Error] EMAIL_USER or EMAIL_PASS is not configured.`);
        throw new Error('Email server configuration is missing.');
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail', // Usually required for Gmail App Passwords to work consistently
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '465'),
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: `"Online Voting System" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your Verification OTP',
        text: `Your OTP for the Online Voting System is: ${otp}. It will expire in 10 minutes.`,
        html: `<p>Your OTP for the Online Voting System is: <strong>${otp}</strong>. It will expire in 10 minutes.</p>`,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`OTP email sent successfully to ${email}. Message ID: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('Error sending OTP email:', error);
        throw error;
    }
};
