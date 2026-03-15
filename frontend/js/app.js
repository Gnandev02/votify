/**
 * Votify Global API Utility
 * Handles authentication and API requests for the static frontend.
 */

const API_BASE_URL = '/api';

const api = {
    /**
     * Generic fetch wrapper
     */
    async request(endpoint, options = {}) {
        const token = localStorage.getItem('token');
        const defaultHeaders = {
            'Content-Type': 'application/json',
        };

        if (token) {
            defaultHeaders['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers
            }
        };

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Something went wrong');
            }

            return data;
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    },

    get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },

    post(endpoint, body) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    },

    // Auth Helpers
    saveAuth(user, token) {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
    },

    logout() {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = '/';
    },

    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    isAuthenticated() {
        return !!localStorage.getItem('token');
    }
};

// Global reveal-up animation observer
document.addEventListener('DOMContentLoaded', () => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal-up').forEach((el) => observer.observe(el));
});
