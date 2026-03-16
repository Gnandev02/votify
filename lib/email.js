import nodemailer from 'nodemailer';

export async function sendOTP(email, otp) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn("EMAIL_USER or EMAIL_PASS environment variables are not set. OTP will not be sent.");
        return;
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: `"Votify" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Your Votify OTP Code",
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #2563eb;">Verify Your Email</h2>
                <p>Hello,</p>
                <p>Thank you for joining Votify. Your verification code is:</p>
                <h1 style="background: #f3f4f6; padding: 10px; display: inline-block; border-radius: 5px; color: #1e293b;">${otp}</h1>
                <p>This code will expire in 10 minutes.</p>
                <p>If you didn't request this, please ignore this email.</p>
                <br>
                <p>Best regards,<br>The Votify Team</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[Email Success] OTP sent to ${email}`);
    } catch (error) {
        console.error("[Email Error] Failed to send OTP email:", error);
        throw new Error("Failed to send OTP email. Please check server logs.");
    }
}
