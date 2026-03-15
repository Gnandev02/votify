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

                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Login failed');

                api.saveAuth(data.user, data.token);
                window.location.href = data.user.role === 'admin' ? 'admin.html' : 'dashboard.html';
            } catch (err) {
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

                const result = await response.json();
                if (!response.ok) throw new Error(result.message || 'Registration failed');
                
                localStorage.setItem('pendingEmail', data.email);
                alert('Account created! Please verify your email.');
                window.location.href = 'verify-otp.html';
            } catch (err) {
                alert(err.message);
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }

    // Verify OTP Handler
    const otpForm = document.getElementById('otpForm');
    if (otpForm) {
        otpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button');
            try {
                const email = localStorage.getItem('pendingEmail');
                const otp = Array.from(document.querySelectorAll('.otp-input')).map(i => i.value).join('');
                
                const response = await fetch("/api/auth?action=verify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, otp })
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Verification failed');
                
                alert('Account verified! You can now log in.');
                window.location.href = 'login.html';
            } catch (err) {
                alert(err.message);
            }
        });
    }
});
