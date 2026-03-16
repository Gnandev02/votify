/**
 * Votify Authentication Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // Login Form Handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button');
            const originalText = btn.innerHTML;
            try {
                btn.disabled = true;
                btn.innerHTML = 'Authenticating...';
                
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                
                const response = await fetch("/api/auth?action=login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password })
                });

                const contentType = response.headers.get("content-type");
                let data;
                if (contentType && contentType.includes("application/json")) {
                    data = await response.json();
                } else {
                    const text = await response.text();
                    throw new Error(`Server Error: ${text.substring(0, 100)}...`);
                }

                if (!response.ok) throw new Error(data.message || 'Login failed');

                api.saveAuth(data.user, data.token);
                window.location.href = data.user.role === 'admin' ? 'admin.html' : 'dashboard.html';
            } catch (err) {
                console.error('Login Error:', err);
                alert(err.message);
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }

    // Register Form Handler
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button');
            const originalText = btn.innerHTML;
            try {
                btn.disabled = true;
                btn.innerHTML = 'Creating Account...';
                
                const data = {
                    name: document.getElementById('name').value,
                    email: document.getElementById('email').value,
                    password: document.getElementById('password').value,
                    role: window.selectedRole || 'voter'
                };
                
                const response = await fetch("/api/auth?action=register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data)
                });

                const contentType = response.headers.get("content-type");
                let result;
                if (contentType && contentType.includes("application/json")) {
                    result = await response.json();
                } else {
                    const text = await response.text();
                    throw new Error(`Server Error: ${text.substring(0, 100)}...`);
                }

                if (!response.ok) throw new Error(result.message || 'Registration failed');
                
                // Show OTP Section instead of redirecting
                localStorage.setItem('pendingEmail', data.email);
                document.getElementById('displayEmail').textContent = data.email;
                registerForm.classList.add('hidden');
                document.getElementById('otpSection').classList.remove('hidden');
                
                // Auto-focus first OTP input
                const firstInput = document.querySelector('.otp-input');
                if (firstInput) firstInput.focus();

            } catch (err) {
                console.error('Registration Error:', err);
                alert(err.message);
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }

    // New OTP Input Logic (In-Page)
    const otpInputs = document.querySelectorAll('.otp-input');
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

    const otpForm = document.getElementById('otpForm');
    if (otpForm) {
        otpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const verifyBtn = document.getElementById('verifyBtn');
            const originalText = verifyBtn.innerHTML;
            
            try {
                verifyBtn.disabled = true;
                verifyBtn.innerHTML = 'Verifying...';
                
                const pendingEmail = localStorage.getItem('pendingEmail');
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
