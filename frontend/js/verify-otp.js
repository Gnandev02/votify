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

                const contentType = response.headers.get("content-type");
                let data;
                if (contentType && contentType.includes("application/json")) {
                    data = await response.json();
                } else {
                    const text = await response.text();
                    throw new Error(`Server Error: ${text.substring(0, 100)}...`);
                }

                if (!response.ok) throw new Error(data.message || 'Verification failed');

                alert('Account verified successfully! You can now log in.');
                localStorage.removeItem('pendingEmail');
                window.location.href = 'login.html';
            } catch (err) {
                console.error('Verification Error:', err);
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
            body: JSON.stringify({ email: pendingEmail, resend: true })
        });
        
        const contentType = response.headers.get("content-type");
        let data;
        if (contentType && contentType.includes("application/json")) {
            data = await response.json();
        } else {
            const text = await response.text();
            throw new Error(`Server Error: ${text.substring(0, 100)}...`);
        }

        if (!response.ok) throw new Error(data.message || 'Failed to resend OTP');
        alert('A new OTP has been sent to your email.');
    } catch (err) {
        console.error('Resend Error:', err);
        alert(err.message);
    }
}
window.resendOTP = resendOTP;
