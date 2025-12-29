/**
 * AIENI 2026 - Registration JavaScript
 * Shared between register.html and register-ar.html
 * 
 * DEMO MODE: Currently saves to localStorage
 * BACKEND MODE: Change DEMO_MODE to false and update API_BASE_URL
 */

// ============================================
// CONFIGURATION - WHERE BACKEND IS NEEDED
// ============================================
const DEMO_MODE = true; // ⚠️ Set to false when backend is ready
const API_BASE_URL = 'http://localhost:8000/api'; // ⚠️ Update this URL

const API_ENDPOINTS = {
    register: `${API_BASE_URL}/register`,
};

// Language messages (set by HTML page before this script loads)
const MESSAGES = window.REGISTER_MESSAGES || {
    toast: {
        success: { title: 'Registration Successful!', message: 'Registration ID: {id}. A confirmation email will be sent to your email address.' },
        error: { title: 'Registration Failed', message: 'Please try again or contact Research.Center@Icp.gov.ae' },
        submitting: { title: 'Submitting Registration', message: 'Please wait while we process your registration...' },
        validation: { title: 'Validation Error', message: 'Please fill in all required fields correctly.' },
        invalidEmail: { title: 'Invalid Email', message: 'Please enter a valid email address.' },
        invalidPhone: { title: 'Invalid Phone', message: 'Please enter a valid phone number.' },
        duplicateEmail: { title: 'Email Already Registered', message: 'This email address is already registered. Please use a different email.' },
        networkError: { title: 'Connection Error', message: 'Unable to connect to the server. Please check your internet connection and try again.' },
        serverError: { title: 'Server Error', message: 'The server encountered an error. Please try again later or contact Research.Center@Icp.gov.ae' }
    },
    submitting: 'Submitting...',
    submitText: 'Submit Application'
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
// FORM SUBMISSION HANDLER
// ============================================
function initFormSubmission() {
    const registrationForm = document.getElementById('registrationForm');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const btnArrow = document.getElementById('btnArrow');
    const btnSpinner = document.getElementById('btnSpinner');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');

    if (!registrationForm) return;

    registrationForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Hide previous messages
        successMessage?.classList.add('hidden');
        errorMessage?.classList.add('hidden');

        // Show loading state
        submitBtn.disabled = true;
        const originalText = btnText.textContent;
        btnText.textContent = MESSAGES.submitting;
        btnArrow?.classList.add('hidden');
        btnSpinner?.classList.remove('hidden');

        try {
            if (DEMO_MODE) {
                // DEMO MODE: Save to localStorage
                const fullName = document.getElementById('full_name').value.trim();

                const registration = {
                    id: 'REG-' + Date.now(),
                    registrationType: document.querySelector('input[name="registration_type"]:checked')?.value || '',
                    fullName: fullName,
                    jobTitle: document.getElementById('job_title').value.trim(),
                    email: document.getElementById('email').value.trim().toLowerCase(),
                    phone: document.getElementById('phone').value.trim(),
                    country: document.getElementById('country').value,
                    organization: document.getElementById('organization').value.trim(),
                    registeredAt: new Date().toISOString(),
                    type: 'registration'
                };

                let registrations = JSON.parse(localStorage.getItem('aieni_registrations') || '[]');
                registrations.push(registration);
                localStorage.setItem('aieni_registrations', JSON.stringify(registrations));

                console.log('DEMO MODE: Registration saved:', registration);
                await new Promise(resolve => setTimeout(resolve, 1500));

                const successMsg = MESSAGES.toast.success.message.replace('{id}', registration.id);
                showToast('success', MESSAGES.toast.success.title, successMsg);
            } else {
                // BACKEND MODE: Send to API
                const fullName = document.getElementById('full_name').value.trim();

                const formData = {
                    registrationType: document.querySelector('input[name="registration_type"]:checked')?.value || '',
                    fullName: fullName,
                    jobTitle: document.getElementById('job_title').value.trim(),
                    email: document.getElementById('email').value.trim().toLowerCase(),
                    phone: document.getElementById('phone').value.trim(),
                    country: document.getElementById('country').value,
                    organization: document.getElementById('organization').value.trim()
                };

                const response = await fetch(API_ENDPOINTS.register, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                if (!response.ok) throw new Error('Registration failed');
                const result = await response.json();
                showToast('success', MESSAGES.toast.success.title, MESSAGES.toast.success.message.replace('{id}', result.id || 'N/A'));
            }

            successMessage?.classList.remove('hidden');
            registrationForm.reset();
            successMessage?.scrollIntoView({ behavior: 'smooth', block: 'center' });

        } catch (error) {
            console.error('Error:', error);
            showToast('error', MESSAGES.toast.error.title, MESSAGES.toast.error.message);
            errorMessage?.classList.remove('hidden');
            errorMessage?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } finally {
            submitBtn.disabled = false;
            btnText.textContent = originalText;
            btnArrow?.classList.remove('hidden');
            btnSpinner?.classList.add('hidden');
        }
    });
}

// ============================================
// INITIALIZE ON DOM READY
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initFormSubmission();
});

