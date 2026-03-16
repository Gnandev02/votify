import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOTP(email, otp) {
    if (!process.env.RESEND_API_KEY) {
        console.warn("RESEND_API_KEY is not set. OTP will not be sent.");
        return;
    }

    try {
        await resend.emails.send({
            from: "Votify <onboarding@resend.dev>",
            to: email,
            subject: "Your Votify OTP Code",
            html: `<h2>Your OTP is ${otp}</h2>`
        });
        console.log(`OTP sent successfully to ${email}`);
    } catch (error) {
        console.error("Failed to send OTP email via Resend:", error);
        throw new Error("Failed to send OTP email");
    }
}
