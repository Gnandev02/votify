/**
 * Votify OTP Verification Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    const otpForm = document.getElementById('otpForm');
    const otpInputs = document.querySelectorAll('.otp-input');
    const verifyBtn = document.getElementById('verifyBtn');
    const pendingEmail = localStorage.getItem('pendingEmail');

    if (!pendingEmail) {
        alert('No pending registration found. Please register first.');
        window.location.href = 'register.html';
        return;
    }

    // Auto-focus next input
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            if (e.target.value.length === 1 && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                otpInputs[index - 1].focus();
            }
        });
    });

    if (otpForm) {
        otpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const originalText = verifyBtn.innerHTML;
            
            try {
                verifyBtn.disabled = true;
                verifyBtn.innerHTML = 'Verifying...';
                
                const otp = Array.from(otpInputs).map(i => i.value).join('');
                if (otp.length !== 6) throw new Error('Please enter all 6 digits');

                const response = await fetch("/api/auth?action=verify-otp", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: pendingEmail, otp })
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Verification failed');

                alert('Account verified successfully! You can now log in.');
                localStorage.removeItem('pendingEmail');
                window.location.href = 'login.html';
            } catch (err) {
                alert(err.message);
                verifyBtn.innerHTML = originalText;
                verifyBtn.disabled = false;
            }
        });
    }
});

async function resendOTP() {
    const pendingEmail = localStorage.getItem('pendingEmail');
    if (!pendingEmail) return;

    try {
        const response = await fetch("/api/auth?action=register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: pendingEmail, resend: true }) // Note: I should probably update back-end to handle this specific resend flag if needed, but the current register logic will handle it if I pass minimal info or add a resend action. Actually, the user's initial auth.js had a resend flag. Let me re-add it or use action=resend-otp.
        });
        // For now, I'll just stick to the requirements. The user's original code had a resend flag in register action.
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to resend OTP');
        alert('A new OTP has been sent to your email.');
    } catch (err) {
        alert(err.message);
    }
}
window.resendOTP = resendOTP;
