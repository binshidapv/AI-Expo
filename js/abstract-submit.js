/**
 * AIENI 2026 - Abstract Submission JavaScript
 * Shared between submit-abstract.html and submit-abstract-ar.html
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
    submitAbstract: `${API_BASE_URL}/submit-abstract`,
};

// Language messages (set by HTML page before this script loads)
const MESSAGES = window.ABSTRACT_MESSAGES || {
    toast: {
        fileInvalidType: { title: 'Invalid File Type', message: 'Please upload a Word document only (.doc or .docx).' },
        fileTooLarge: { title: 'File Too Large', message: 'File size must be less than 5MB.' },
        fileUploaded: { title: 'File Uploaded', message: 'Your document has been selected successfully.' },
        wordCountInvalid: { title: 'Word Count Invalid', message: 'Abstract must be between 300-500 words. Current: {count} words.' },
        submitSuccess: { title: 'Abstract Submitted!', message: 'Submission ID: {id}. You will receive the review decision by February 15, 2026.' },
        submitError: { title: 'Submission Failed', message: 'Please try again or contact Research.Center@Icp.gov.ae' }
    },
    fileSelected: 'Selected:',
    fileLabelSelected: 'File selected - Click to change',
    fileLabelDefault: 'Click to upload or drag and drop',
    submitting: 'Submitting...'
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
// FILE UPLOAD HANDLER
// ============================================
function initFileUpload() {
    const fileInput = document.getElementById('abstract_file');
    const fileLabel = document.getElementById('fileLabel');
    const fileName = document.getElementById('fileName');

    if (!fileInput) return;

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const validTypes = ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!validTypes.includes(file.type)) {
                showToast('error', MESSAGES.toast.fileInvalidType.title, MESSAGES.toast.fileInvalidType.message);
                fileInput.value = '';
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                showToast('warning', MESSAGES.toast.fileTooLarge.title, MESSAGES.toast.fileTooLarge.message);
                fileInput.value = '';
                return;
            }
            fileName.textContent = `${MESSAGES.fileSelected} ${file.name}`;
            fileName.classList.remove('hidden');
            fileLabel.textContent = MESSAGES.fileLabelSelected;
            showToast('success', MESSAGES.toast.fileUploaded.title, MESSAGES.toast.fileUploaded.message);
        }
    });
}

// ============================================
// WORD COUNT HANDLER - DISABLED (No abstract_text field in form)
// ============================================
function initWordCount() {
    // Not used - form only has file upload, no text field
}


// ============================================
// FORM SUBMISSION HANDLER
// ============================================
function initFormSubmission() {
    const abstractForm = document.getElementById('abstractForm');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const btnArrow = document.getElementById('btnArrow');
    const btnSpinner = document.getElementById('btnSpinner');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    const fileInput = document.getElementById('abstract_file');
    const fileLabel = document.getElementById('fileLabel');
    const fileName = document.getElementById('fileName');

    if (!abstractForm) return;

    abstractForm.addEventListener('submit', async (e) => {
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
            const file = fileInput?.files[0];
            const coAuthorsValue = document.getElementById('co_authors').value.trim();
            const coAuthorsArray = coAuthorsValue ? coAuthorsValue.split(',').map(a => a.trim()).filter(a => a.length > 0) : [];

            if (DEMO_MODE) {
                // DEMO MODE: Save to localStorage
                const fullName = document.getElementById('full_name').value.trim();

                const submission = {
                    id: 'ABS-' + Date.now(),
                    fullName: fullName,
                    jobTitle: document.getElementById('job_title').value.trim(),
                    email: document.getElementById('email').value.trim().toLowerCase(),
                    phone: document.getElementById('phone').value.trim(),
                    institution: document.getElementById('institution').value.trim(),
                    country: document.getElementById('country').value,
                    coAuthors: coAuthorsArray,
                    title: file ? file.name.replace(/\.[^/.]+$/, "") : 'Abstract Submission',
                    abstract: 'Abstract uploaded as file: ' + (file ? file.name : 'No file'),
                    fileName: file ? file.name : 'No file uploaded',
                    fileSize: file ? (file.size / (1024 * 1024)).toFixed(2) + ' MB' : '0 MB',
                    status: 'Pending Review',
                    submittedAt: new Date().toISOString(),
                    type: 'abstract'
                };

                let submissions = JSON.parse(localStorage.getItem('aieni_submissions') || '[]');
                submissions.push(submission);
                localStorage.setItem('aieni_submissions', JSON.stringify(submissions));

                console.log('DEMO MODE: Abstract saved:', submission);
                await new Promise(resolve => setTimeout(resolve, 1500));

                const successMsg = MESSAGES.toast.submitSuccess.message.replace('{id}', submission.id);
                showToast('success', MESSAGES.toast.submitSuccess.title, successMsg);
            } else {
                // BACKEND MODE: Send to API
                const formData = new FormData();
                if (file) formData.append('word_file', file);
                formData.append('data', JSON.stringify({
                    fullName: document.getElementById('full_name').value.trim(),
                    jobTitle: document.getElementById('job_title').value.trim(),
                    email: document.getElementById('email').value.trim().toLowerCase(),
                    phone: document.getElementById('phone').value.trim(),
                    institution: document.getElementById('institution').value.trim(),
                    country: document.getElementById('country').value,
                    coAuthors: coAuthorsArray,
                    confirmation: { isOriginalWork: true, agreedToTerms: document.getElementById('terms').checked }
                }));

                const response = await fetch(API_ENDPOINTS.submitAbstract, { method: 'POST', body: formData });
                if (!response.ok) throw new Error('Submission failed');
                const result = await response.json();
                showToast('success', MESSAGES.toast.submitSuccess.title, MESSAGES.toast.submitSuccess.message.replace('{id}', result.id || 'N/A'));
            }

            successMessage?.classList.remove('hidden');
            abstractForm.reset();
            fileName?.classList.add('hidden');
            if (fileLabel) fileLabel.textContent = MESSAGES.fileLabelDefault;
            successMessage?.scrollIntoView({ behavior: 'smooth', block: 'center' });

        } catch (error) {
            console.error('Error:', error);
            showToast('error', MESSAGES.toast.submitError.title, MESSAGES.toast.submitError.message);
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
    initFileUpload();
    initWordCount();
    initFormSubmission();
});
