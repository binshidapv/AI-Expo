/**
 * AIENI 2026 - Admin Login JavaScript
 * 
 * DEMO MODE: Currently uses hardcoded credentials
 * BACKEND MODE: Change DEMO_MODE to false and update API_BASE_URL
 */

// ============================================
// CONFIGURATION - WHERE BACKEND IS NEEDED
// ============================================
const DEMO_MODE = true; // ⚠️ Set to false when backend is ready
const API_BASE_URL = 'http://localhost:8000/api'; // ⚠️ Update this URL

const API_ENDPOINTS = {
    login: `${API_BASE_URL}/admin/login`,
};

// Demo credentials (only used in DEMO_MODE)
const DEMO_CREDENTIALS = {
    email: 'admin@eaic.ae',
    password: 'admin123'
};

// Language messages (set by HTML page before this script loads)
const MESSAGES = window.LOGIN_MESSAGES || {
    toast: {
        success: { title: 'Login Successful', message: 'Redirecting to dashboard...' },
        error: { title: 'Login Failed', message: 'Invalid email or password.' }
    }
};

// ============================================
// TOAST NOTIFICATION SYSTEM
// ============================================
function showToast(type, title, message, duration = 4000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
        success: `<svg class="toast-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
        error: `<svg class="toast-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
        warning: `<svg class="toast-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`,
        info: `<svg class="toast-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`
    };

    toast.innerHTML = `
        ${icons[type]}
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <div class="toast-close" onclick="this.parentElement.classList.add('hide'); setTimeout(() => this.parentElement.remove(), 400);">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </div>
        <div class="toast-progress" style="animation-duration: ${duration}ms;"></div>
    `;

    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 400);
    }, duration);
}

// ============================================
// LOGIN FORM HANDLER
// ============================================
function initLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const btnText = document.getElementById('btnText');
    const btnSpinner = document.getElementById('btnSpinner');
    const errorMessage = document.getElementById('errorMessage');

    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Show loading
        btnText?.classList.add('hidden');
        btnSpinner?.classList.remove('hidden');
        loginBtn.disabled = true;
        errorMessage?.classList.add('hidden');

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            if (DEMO_MODE) {
                // DEMO MODE: Simple credential check
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                if (email === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password) {
                    showToast('success', MESSAGES.toast.success.title, MESSAGES.toast.success.message);
                    localStorage.setItem('adminToken', 'demo-token-' + Date.now());
                    setTimeout(() => {
                        window.location.href = 'admin-dashboard.html';
                    }, 1500);
                    return;
                } else {
                    throw new Error('Invalid credentials');
                }
            } else {
                // BACKEND MODE: Call API
                const response = await fetch(API_ENDPOINTS.login, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                if (!response.ok) throw new Error('Login failed');
                
                const result = await response.json();
                localStorage.setItem('adminToken', result.token);
                showToast('success', MESSAGES.toast.success.title, MESSAGES.toast.success.message);
                setTimeout(() => {
                    window.location.href = 'admin-dashboard.html';
                }, 1500);
                return;
            }
        } catch (error) {
            console.error('Login error:', error);
            showToast('error', MESSAGES.toast.error.title, MESSAGES.toast.error.message);
            errorMessage?.classList.remove('hidden');
        } finally {
            btnText?.classList.remove('hidden');
            btnSpinner?.classList.add('hidden');
            loginBtn.disabled = false;
        }
    });
}

// ============================================
// INITIALIZE ON DOM READY
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initLoginForm();
});

