/**
 * AIENI 2026 - Admin Dashboard JavaScript
 *
 * DEMO MODE: Currently loads from localStorage
 * BACKEND MODE: Change DEMO_MODE to false and update API_BASE_URL
 */

// ============================================
// CONFIGURATION - WHERE BACKEND IS NEEDED
// ============================================
const DEMO_MODE = true; // ⚠️ Set to false when backend is ready
const API_BASE_URL = 'http://localhost:8000/api'; // ⚠️ Update this URL

const API_ENDPOINTS = {
    login: `${API_BASE_URL}/admin/login`,
    getSubmissions: `${API_BASE_URL}/submissions`,
    getSubmission: (id) => `${API_BASE_URL}/submissions/${id}`,
    updateStatus: (id) => `${API_BASE_URL}/submissions/${id}/status`,
    deleteSubmission: (id) => `${API_BASE_URL}/submissions/${id}`,
    exportCSV: `${API_BASE_URL}/submissions/export`,
};

// ============================================
// STATE MANAGEMENT
// ============================================
let allSubmissions = [];
let filteredSubmissions = [];
let currentPage = 1;
let perPage = 25;

// Registrations state
let allRegistrations = [];
let filteredRegistrations = [];
let currentRegPage = 1;
let regPerPage = 25;
let currentTab = 'abstracts';

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
// AUTHENTICATION
// ============================================
function checkAuth() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        showToast('warning', 'Authentication Required', 'Please login to access the dashboard.', 3000);
        setTimeout(() => {
            window.location.href = 'admin-login.html';
        }, 1000);
    }
}

function logout() {
    showToast('info', 'Logging Out', 'You are being logged out...', 2000);
    setTimeout(() => {
        localStorage.removeItem('adminToken');
        window.location.href = 'admin-login.html';
    }, 1000);
}

// ============================================
// LOAD SUBMISSIONS
// ============================================
async function loadSubmissions() {
    console.log('DEMO MODE: Loading from localStorage');

    try {
        const storedSubmissions = JSON.parse(localStorage.getItem('aieni_submissions') || '[]');
        const storedRegistrations = JSON.parse(localStorage.getItem('aieni_registrations') || '[]');

        const abstractSubmissions = storedSubmissions.map((sub, index) => ({
            id: sub.id || index + 1,
            fullName: sub.fullName || '',
            email: sub.email || '',
            phone: sub.phone || '',
            institution: sub.institution || '',
            country: sub.country || '',
            title: sub.title || 'Research Abstract',
            abstract: sub.abstract || '',
            coAuthors: sub.coAuthors || [],
            fileName: sub.fileName || '',
            status: sub.status || 'Pending Review',
            submittedAt: sub.submittedAt || new Date().toISOString(),
            type: 'abstract'
        }));

        // Store registrations
        allRegistrations = storedRegistrations.map((reg, index) => ({
            id: reg.id || 'REG-' + (index + 1),
            fullName: reg.fullName || '',
            jobTitle: reg.jobTitle || '',
            email: reg.email || '',
            phone: reg.phone || '',
            country: reg.country || '',
            organization: reg.organization || '',
            registrationType: reg.registrationType || 'Attendee',
            registeredAt: reg.registeredAt || new Date().toISOString(),
            type: 'registration'
        }));

        filteredRegistrations = [...allRegistrations];

        allSubmissions = abstractSubmissions;
        filteredSubmissions = [...allSubmissions];

        updateStats();
        renderTable();
        renderRegistrationsTable();

        if (allSubmissions.length === 0) {
            showToast('info', 'No Submissions', 'No submissions found. Waiting for new submissions.');
        } else {
            showToast('success', 'Data Loaded Successfully', `${allSubmissions.length} submission${allSubmissions.length !== 1 ? 's' : ''} loaded successfully.`);
        }
    } catch (error) {
        console.error('Error loading submissions:', error);
        showToast('error', 'Loading Failed', 'Failed to load submissions. Please refresh the page.');
    }
}

// ============================================
// CREATE DEMO DATA (FOR TESTING)
// ============================================
function createDemoData() {
    const demoAbstracts = [
        {
            id: 'ABS-' + Date.now() + '-1',
            fullName: 'Dr. Sarah Johnson',
            jobTitle: 'AI Research Scientist',
            email: 'sarah.johnson@university.edu',
            phone: '+1-555-0101',
            institution: 'MIT AI Lab',
            country: 'United States',
            title: 'Deep Learning Applications in Healthcare Diagnostics',
            abstract: 'This research explores the application of deep learning models in medical image analysis, specifically focusing on early detection of diseases through automated diagnostic systems. Our approach combines convolutional neural networks with attention mechanisms to achieve state-of-the-art accuracy in identifying anomalies in medical scans.',
            coAuthors: ['Dr. Michael Chen', 'Prof. Emily Rodriguez'],
            fileName: 'healthcare-ai-research.pdf',
            status: 'Pending Review',
            submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            type: 'abstract'
        },
        {
            id: 'ABS-' + Date.now() + '-2',
            fullName: 'Prof. Ahmed Al-Mansouri',
            jobTitle: 'Professor of Computer Science',
            email: 'ahmed.almansouri@uae.ac.ae',
            phone: '+971-50-1234567',
            institution: 'UAE University',
            country: 'United Arab Emirates',
            title: 'Natural Language Processing for Arabic Text Analysis',
            abstract: 'We present a novel approach to Arabic NLP that addresses the unique challenges of processing Arabic text, including morphological complexity and dialectal variations. Our transformer-based model achieves significant improvements in sentiment analysis and named entity recognition tasks.',
            coAuthors: ['Dr. Fatima Hassan', 'Dr. Omar Khalid'],
            fileName: 'arabic-nlp-research.pdf',
            status: 'Accepted',
            submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            type: 'abstract'
        },
        {
            id: 'ABS-' + Date.now() + '-3',
            fullName: 'Dr. Maria Garcia',
            jobTitle: 'Senior Data Scientist',
            email: 'maria.garcia@techcorp.com',
            phone: '+34-600-123456',
            institution: 'Barcelona Tech Institute',
            country: 'Spain',
            title: 'Reinforcement Learning for Autonomous Vehicle Navigation',
            abstract: 'This paper presents a reinforcement learning framework for autonomous vehicle navigation in complex urban environments. We demonstrate how our approach handles dynamic obstacles and unpredictable traffic patterns while maintaining safety and efficiency.',
            coAuthors: ['Dr. Carlos Martinez'],
            fileName: 'autonomous-vehicles-rl.pdf',
            status: 'Pending Review',
            submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            type: 'abstract'
        },
        {
            id: 'ABS-' + Date.now() + '-4',
            fullName: 'Dr. Raj Kumar',
            jobTitle: 'AI Ethics Researcher',
            email: 'raj.kumar@iisc.in',
            phone: '+91-98765-43210',
            institution: 'Indian Institute of Science',
            country: 'India',
            title: 'Ethical Considerations in AI-Powered Decision Making Systems',
            abstract: 'We examine the ethical implications of deploying AI systems in critical decision-making scenarios, including healthcare, criminal justice, and financial services. Our framework provides guidelines for ensuring fairness, transparency, and accountability in AI applications.',
            coAuthors: ['Prof. Priya Sharma', 'Dr. Anil Verma'],
            fileName: 'ai-ethics-framework.pdf',
            status: 'Accepted',
            submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            type: 'abstract'
        },
        {
            id: 'ABS-' + Date.now() + '-5',
            fullName: 'Dr. Lisa Chen',
            jobTitle: 'Machine Learning Engineer',
            email: 'lisa.chen@ailab.sg',
            phone: '+65-9123-4567',
            institution: 'Singapore AI Research Lab',
            country: 'Singapore',
            title: 'Federated Learning for Privacy-Preserving AI Models',
            abstract: 'This research introduces an improved federated learning approach that enables collaborative model training across distributed datasets while preserving data privacy. Our method reduces communication overhead and improves convergence speed compared to existing approaches.',
            coAuthors: ['Dr. Wei Zhang', 'Prof. John Tan'],
            fileName: 'federated-learning-privacy.pdf',
            status: 'Pending Review',
            submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            type: 'abstract'
        }
    ];

    const demoRegistrations = [
        {
            id: 'REG-' + Date.now() + '-1',
            firstName: 'John',
            lastName: 'Smith',
            fullName: 'John Smith',
            email: 'john.smith@email.com',
            phone: '+1-555-0201',
            country: 'United States',
            organization: 'Tech Innovations Inc',
            registrationType: 'Speaker',
            registeredAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            type: 'registration'
        },
        {
            id: 'REG-' + Date.now() + '-2',
            firstName: 'Aisha',
            lastName: 'Mohammed',
            fullName: 'Aisha Mohammed',
            email: 'aisha.mohammed@email.ae',
            phone: '+971-50-9876543',
            country: 'United Arab Emirates',
            organization: 'Dubai AI Center',
            registrationType: 'Attendee',
            registeredAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
            type: 'registration'
        },
        {
            id: 'REG-' + Date.now() + '-3',
            firstName: 'Emma',
            lastName: 'Wilson',
            fullName: 'Emma Wilson',
            email: 'emma.wilson@university.edu',
            phone: '+44-7700-123456',
            country: 'United Kingdom',
            organization: 'Oxford University',
            registrationType: 'Student',
            registeredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            type: 'registration'
        }
    ];

    // Save to localStorage
    localStorage.setItem('aieni_submissions', JSON.stringify(demoAbstracts));
    localStorage.setItem('aieni_registrations', JSON.stringify(demoRegistrations));

    showToast('success', 'Demo Data Created', 'Sample abstracts and registrations have been added!', 3000);

    // Reload the data
    setTimeout(() => {
        loadSubmissions();
    }, 1000);
}

// ============================================
// UPDATE STATS
// ============================================
function updateStats() {
    const total = allSubmissions.length;
    const pending = allSubmissions.filter(s => s.status === 'Pending Review').length;
    const accepted = allSubmissions.filter(s => s.status === 'Accepted').length;
    const registrations = allRegistrations.length;

    document.getElementById('totalCount').textContent = total;
    document.getElementById('pendingCount').textContent = pending;
    document.getElementById('acceptedCount').textContent = accepted;
    document.getElementById('registrationCount').textContent = registrations;

    // Update registration stats
    document.getElementById('regTotalCount').textContent = registrations;
}


// ============================================
// RENDER TABLE
// ============================================
function renderTable() {
    const tbody = document.getElementById('submissionsTable');

    if (filteredSubmissions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="px-6 py-12 text-center text-gray-500">
                    <p class="text-lg">No submissions found</p>
                    <p class="text-sm mt-1">Try adjusting your filters</p>
                </td>
            </tr>
        `;
        updatePagination();
        return;
    }

    const startIndex = (currentPage - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedData = filteredSubmissions.slice(startIndex, endIndex);

    tbody.innerHTML = paginatedData.map(submission => `
        <tr class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4">
                <span class="text-sm font-mono text-gray-900">${submission.id}</span>
            </td>
            <td class="px-6 py-4">
                <div class="text-sm font-medium text-gray-900">${submission.fullName}</div>
                <div class="text-sm text-gray-500">${submission.jobTitle || 'N/A'}</div>
            </td>
            <td class="px-6 py-4">
                <span class="text-sm text-gray-600">${submission.email}</span>
            </td>
            <td class="px-6 py-4">
                <div class="text-sm text-gray-900 line-clamp-2">${submission.title}</div>
            </td>
            <td class="px-6 py-4">
                <span class="text-sm text-gray-600">${submission.institution}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="status-badge status-${submission.status.toLowerCase().replace(' ', '-')}">${submission.status}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(submission.submittedAt)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
                <button onclick="viewDetails('${submission.id}')" class="px-3 py-1.5 bg-cyan-primary text-white rounded-lg hover:bg-cyan-600 transition-all text-sm font-semibold">View</button>
            </td>
        </tr>
    `).join('');

    updatePagination();
}

// ============================================
// PAGINATION
// ============================================
function updatePagination() {
    const totalPages = Math.ceil(filteredSubmissions.length / perPage);
    const startIndex = (currentPage - 1) * perPage + 1;
    const endIndex = Math.min(currentPage * perPage, filteredSubmissions.length);

    document.getElementById('showingStart').textContent = filteredSubmissions.length > 0 ? startIndex : 0;
    document.getElementById('showingEnd').textContent = endIndex;
    document.getElementById('showingTotal').textContent = filteredSubmissions.length;

    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = currentPage === totalPages || totalPages === 0;

    const pageNumbers = document.getElementById('pageNumbers');
    pageNumbers.innerHTML = '';

    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) {
            pageNumbers.innerHTML += createPageButton(i);
        }
    } else {
        pageNumbers.innerHTML += createPageButton(1);
        if (currentPage > 3) pageNumbers.innerHTML += '<span class="px-2">...</span>';
        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
            pageNumbers.innerHTML += createPageButton(i);
        }
        if (currentPage < totalPages - 2) pageNumbers.innerHTML += '<span class="px-2">...</span>';
        if (totalPages > 1) pageNumbers.innerHTML += createPageButton(totalPages);
    }
}

function createPageButton(pageNum) {
    const isActive = pageNum === currentPage;
    return `
        <button onclick="goToPage(${pageNum})" class="px-3 py-1 rounded ${isActive ? 'bg-cyan-600 text-white' : 'hover:bg-gray-100'}">${pageNum}</button>
    `;
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        renderTable();
    }
}

function nextPage() {
    const totalPages = Math.ceil(filteredSubmissions.length / perPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderTable();
    }
}

function goToPage(page) {
    currentPage = page;
    renderTable();
}

function changePerPage() {
    const newPerPage = parseInt(document.getElementById('perPageSelect').value);
    if (newPerPage !== perPage) {
        perPage = newPerPage;
        currentPage = 1;
        renderTable();
        showToast('info', 'Display Updated', `Showing ${perPage} submissions per page.`, 2000);
    }
}


// ============================================
// FILTER & SEARCH & SORT
// ============================================
function filterSubmissions() {
    const statusFilter = document.getElementById('statusFilter').value;

    if (statusFilter === 'all') {
        filteredSubmissions = [...allSubmissions];
    } else {
        filteredSubmissions = allSubmissions.filter(s => s.status === statusFilter);
    }

    currentPage = 1;
    renderTable();

    // Show toast notification for filter
    const statusLabels = {
        'all': 'All Submissions',
        'Pending Review': 'Pending Review',
        'Accepted': 'Accepted',
        'Rejected': 'Rejected'
    };
    showToast('info', 'Filter Applied', `Showing ${filteredSubmissions.length} ${statusLabels[statusFilter] || statusFilter} submission${filteredSubmissions.length !== 1 ? 's' : ''}.`, 2500);
}

function searchSubmissions() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    if (!searchTerm) {
        filterSubmissions();
        return;
    }

    filteredSubmissions = allSubmissions.filter(s =>
        s.firstName.toLowerCase().includes(searchTerm) ||
        s.lastName.toLowerCase().includes(searchTerm) ||
        s.email.toLowerCase().includes(searchTerm) ||
        s.title.toLowerCase().includes(searchTerm) ||
        s.institution.toLowerCase().includes(searchTerm)
    );

    currentPage = 1;
    renderTable();

    // Show toast notification for search
    if (filteredSubmissions.length === 0) {
        showToast('warning', 'No Results', `No submissions found matching "${searchTerm}".`, 3000);
    } else {
        showToast('success', 'Search Complete', `Found ${filteredSubmissions.length} submission${filteredSubmissions.length !== 1 ? 's' : ''} matching "${searchTerm}".`, 2500);
    }
}

function sortSubmissions() {
    const sortBy = document.getElementById('sortBy').value;

    const sortLabels = {
        'date_desc': 'Newest First',
        'date_asc': 'Oldest First',
        'name_asc': 'Name (A-Z)',
        'name_desc': 'Name (Z-A)'
    };

    switch (sortBy) {
        case 'date_desc':
            filteredSubmissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
            break;
        case 'date_asc':
            filteredSubmissions.sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));
            break;
        case 'name_asc':
            filteredSubmissions.sort((a, b) => a.lastName.localeCompare(b.lastName));
            break;
        case 'name_desc':
            filteredSubmissions.sort((a, b) => b.lastName.localeCompare(a.lastName));
            break;
    }
    renderTable();

    // Show toast notification for sort
    showToast('info', 'Sorted', `Submissions sorted by ${sortLabels[sortBy] || sortBy}.`, 2000);
}


// ============================================
// VIEW DETAILS
// ============================================
function viewDetails(id) {
    const submission = allSubmissions.find(s => s.id === id);
    if (!submission) {
        showToast('error', 'Not Found', 'Submission not found.', 3000);
        return;
    }

    const detailContent = document.getElementById('detailContent');

    // Handle both full backend data and simplified localStorage data
    const abstractText = submission.abstract?.text || submission.abstract || '';
    const abstractTitle = submission.abstract?.title || submission.title || 'Research Abstract';
    const abstractKeywords = submission.abstract?.keywords || [];
    const wordCount = submission.abstract?.wordCount || abstractText.split(/\s+/).filter(w => w).length;
    const fileName = submission.file?.fileName || submission.fileName || 'N/A';
    const fileSize = submission.file?.fileSizeMB || 'N/A';
    const fileUrl = submission.file?.fileUrl || '#';
    const coAuthors = submission.coAuthors || [];

    detailContent.innerHTML = `
        <div class="space-y-6">
            <!-- Author Information -->
            <div>
                <h3 class="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-gray-200">Author Information</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p class="text-sm text-gray-600 font-semibold">Name</p>
                        <p class="text-gray-800">${submission.fullName}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600 font-semibold">Job Title</p>
                        <p class="text-gray-800">${submission.jobTitle || 'N/A'}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600 font-semibold">Email</p>
                        <p class="text-gray-800">${submission.email}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600 font-semibold">Phone</p>
                        <p class="text-gray-800">${submission.phone || 'N/A'}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600 font-semibold">Institution</p>
                        <p class="text-gray-800">${submission.institution}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600 font-semibold">Country</p>
                        <p class="text-gray-800">${submission.country}</p>
                    </div>
                    ${coAuthors.length > 0 ? `
                    <div class="md:col-span-2">
                        <p class="text-sm text-gray-600 font-semibold">Co-Authors</p>
                        <p class="text-gray-800">${coAuthors.join(', ')}</p>
                    </div>
                    ` : ''}
                </div>
            </div>

            <!-- Abstract Details -->
            <div>
                <h3 class="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-gray-200">Abstract Details</h3>
                <div class="space-y-3">
                    <div>
                        <p class="text-sm text-gray-600 font-semibold">Title</p>
                        <p class="text-gray-800 font-semibold">${abstractTitle}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600 font-semibold">Abstract Text</p>
                        <p class="text-gray-800 text-sm leading-relaxed">${abstractText}</p>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-sm text-gray-600 font-semibold">Word Count</p>
                            <p class="text-gray-800">${wordCount} words</p>
                        </div>
                        ${abstractKeywords.length > 0 ? `
                        <div>
                            <p class="text-sm text-gray-600 font-semibold">Keywords</p>
                            <p class="text-gray-800">${abstractKeywords.join(', ')}</p>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>

            <!-- File Information -->
            <div>
                <h3 class="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-gray-200">File Information</h3>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <p class="text-sm text-gray-600 font-semibold">File Name</p>
                        <p class="text-gray-800">${fileName}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600 font-semibold">File Size</p>
                        <p class="text-gray-800">${fileSize} ${fileSize !== 'N/A' ? 'MB' : ''}</p>
                    </div>
                </div>
                ${fileUrl !== '#' ? `
                <a href="${fileUrl}" target="_blank" class="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-cyan-primary text-white rounded-lg hover:bg-blue-primary transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    Download File
                </a>
                ` : '<p class="mt-3 text-gray-500 text-sm">File stored in browser (demo mode)</p>'}
            </div>

            <!-- Status & Actions -->
            <div>
                <h3 class="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-gray-200">Status & Actions</h3>
                <div class="space-y-4">
                    <div>
                        <p class="text-sm text-gray-600 font-semibold mb-2">Current Status</p>
                        <span class="status-badge status-${submission.status.toLowerCase().replace(' ', '-')}">${submission.status}</span>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600 font-semibold mb-3">Update Status</p>
                        <div class="flex flex-wrap gap-3">
                            <button onclick="updateStatus('${submission.id}', 'Pending Review')" class="flex items-center gap-2 px-5 py-2.5 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-all font-semibold">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                Pending
                            </button>
                            <button onclick="updateStatus('${submission.id}', 'Accepted')" class="flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all font-semibold">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                Accept
                            </button>
                            <button onclick="updateStatus('${submission.id}', 'Rejected')" class="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all font-semibold">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                Reject
                            </button>
                        </div>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600 font-semibold mb-2">Submitted</p>
                        <p class="text-gray-800">${formatDate(submission.submittedAt)}</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('detailModal').classList.add('active');
}


// ============================================
// UPDATE STATUS
// ============================================
async function updateStatus(id, newStatus) {
    const submission = allSubmissions.find(s => s.id === id);
    if (!submission) {
        showToast('error', 'Update Failed', 'Submission not found.', 3000);
        return;
    }

    const oldStatus = submission.status;

    // Don't update if status is the same
    if (oldStatus === newStatus) {
        showToast('info', 'No Change', `Submission is already marked as ${newStatus}.`, 3000);
        return;
    }

    try {
        submission.status = newStatus;

        // Also update in localStorage
        const storedSubmissions = JSON.parse(localStorage.getItem('aieni_submissions') || '[]');
        const storedIndex = storedSubmissions.findIndex(s => s.id === id);
        if (storedIndex !== -1) {
            storedSubmissions[storedIndex].status = newStatus;
            localStorage.setItem('aieni_submissions', JSON.stringify(storedSubmissions));
        }

        updateStats();
        renderTable();
        closeModal();

        // Show appropriate toast based on new status
        const statusMessages = {
            'Pending Review': {
                type: 'info',
                title: 'Status Updated',
                message: `Submission moved to Pending Review.`
            },
            'Accepted': {
                type: 'success',
                title: 'Submission Accepted',
                message: `Submission by ${submission.fullName} has been accepted.`
            },
            'Rejected': {
                type: 'warning',
                title: 'Submission Rejected',
                message: `Submission by ${submission.fullName} has been rejected.`
            }
        };

        const statusMsg = statusMessages[newStatus] || {
            type: 'success',
            title: 'Status Updated',
            message: `Submission status changed to ${newStatus}.`
        };

        showToast(statusMsg.type, statusMsg.title, statusMsg.message, 4000);
    } catch (error) {
        console.error('Error updating status:', error);
        submission.status = oldStatus; // Revert on error
        showToast('error', 'Update Failed', 'Failed to update submission status. Please try again.', 4000);
    }
}

// ============================================
// MODAL CONTROL
// ============================================
function closeModal() {
    document.getElementById('detailModal').classList.remove('active');
}

// ============================================
// REFRESH DATA
// ============================================
function refreshData() {
    showToast('info', 'Refreshing Data', 'Loading latest submissions...', 2000);
    setTimeout(() => {
        loadSubmissions();
    }, 500);
}

// ============================================
// EXPORT TO CSV
// ============================================
function exportToCSV() {
    if (allSubmissions.length === 0) {
        showToast('warning', 'No Data to Export', 'There are no submissions to export. Please wait for submissions to be added.', 4000);
        return;
    }

    try {
        showToast('info', 'Preparing Export', 'Generating CSV file...', 2000);

        const csv = [
            ['ID', 'Full Name', 'Job Title', 'Email', 'Phone', 'Institution', 'Country', 'Title', 'Co-Authors', 'File Name', 'Status', 'Submitted'],
            ...allSubmissions.map(s => [
                s.id,
                s.fullName,
                s.jobTitle || '',
                s.email,
                s.phone,
                s.institution,
                s.country,
                s.title,
                (s.coAuthors || []).join('; '),
                s.fileName || '',
                s.status,
                formatDate(s.submittedAt)
            ])
        ].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const fileName = `aieni-2026-submissions-${new Date().toISOString().split('T')[0]}.csv`;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);

        setTimeout(() => {
            showToast('success', 'Export Successful', `${allSubmissions.length} submission${allSubmissions.length !== 1 ? 's' : ''} exported to ${fileName}`, 5000);
        }, 500);
    } catch (error) {
        console.error('Export error:', error);
        showToast('error', 'Export Failed', 'Failed to export submissions. Please try again.', 4000);
    }
}

// ============================================
// FORMAT DATE
// ============================================
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ============================================
// SECTION SWITCHING (SIDEBAR NAVIGATION)
// ============================================
function switchSection(section) {
    currentTab = section;

    // Update sidebar menu items
    document.getElementById('abstractsMenuItem').classList.remove('active');
    document.getElementById('registrationsMenuItem').classList.remove('active');

    if (section === 'abstracts') {
        document.getElementById('abstractsMenuItem').classList.add('active');
        document.getElementById('abstractsSection').style.display = 'block';
        document.getElementById('registrationsSection').style.display = 'none';
        document.getElementById('pageTitle').textContent = 'Abstract Submissions';
        showToast('info', 'Abstract Submissions', 'Viewing abstract submissions', 2000);
    } else if (section === 'registrations') {
        document.getElementById('registrationsMenuItem').classList.add('active');
        document.getElementById('abstractsSection').style.display = 'none';
        document.getElementById('registrationsSection').style.display = 'block';
        document.getElementById('pageTitle').textContent = 'Registrations';
        showToast('info', 'Registrations', 'Viewing conference registrations', 2000);
    }
}

// ============================================
// REGISTRATIONS FUNCTIONS
// ============================================

// Render Registrations Table
function renderRegistrationsTable() {
    const start = (currentRegPage - 1) * regPerPage;
    const end = start + regPerPage;
    const paginatedRegs = filteredRegistrations.slice(start, end);

    const tbody = document.getElementById('registrationsTable');

    if (paginatedRegs.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="px-6 py-12 text-center text-gray-500">
                    <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                    </svg>
                    <p class="text-lg font-semibold">No registrations found</p>
                    <p class="text-sm text-gray-400 mt-2">Try adjusting your filters or search criteria</p>
                </td>
            </tr>
        `;
        updateRegPagination();
        return;
    }

    tbody.innerHTML = paginatedRegs.map(reg => `
        <tr class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4">
                <span class="text-sm font-mono text-gray-900">${reg.id}</span>
            </td>
            <td class="px-6 py-4">
                <span class="text-sm font-semibold text-gray-900">${reg.fullName}</span>
            </td>
            <td class="px-6 py-4">
                <span class="text-sm text-gray-600">${reg.jobTitle || 'N/A'}</span>
            </td>
            <td class="px-6 py-4">
                <span class="text-sm text-gray-600">${reg.email}</span>
            </td>
            <td class="px-6 py-4">
                <span class="text-sm text-gray-600">${reg.phone}</span>
            </td>
            <td class="px-6 py-4">
                <span class="text-sm text-gray-600">${reg.country}</span>
            </td>
            <td class="px-6 py-4">
                <span class="px-3 py-1 rounded-full text-xs font-semibold ${
                    reg.registrationType === 'Speaker'
                        ? 'bg-blue-100 text-blue-700'
                        : reg.registrationType === 'Student'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-purple-100 text-purple-700'
                }">
                    ${reg.registrationType}
                </span>
            </td>
            <td class="px-6 py-4">
                <span class="text-sm text-gray-600">${formatDate(reg.registeredAt)}</span>
            </td>
            <td class="px-6 py-4 text-center">
                <button onclick="viewRegistrationDetails('${reg.id}')" class="px-3 py-1.5 bg-cyan-primary text-white rounded-lg hover:bg-cyan-600 transition-all text-sm font-semibold">
                    View
                </button>
            </td>
        </tr>
    `).join('');

    updateRegPagination();
}

// Filter Registrations
function filterRegistrations() {
    const typeFilter = document.getElementById('regTypeFilter').value;
    const searchTerm = document.getElementById('regSearchInput').value.toLowerCase();

    filteredRegistrations = allRegistrations.filter(reg => {
        const matchesType = typeFilter === 'all' || reg.registrationType === typeFilter;
        const matchesSearch = !searchTerm ||
            reg.fullName.toLowerCase().includes(searchTerm) ||
            reg.email.toLowerCase().includes(searchTerm) ||
            reg.organization.toLowerCase().includes(searchTerm) ||
            reg.country.toLowerCase().includes(searchTerm);

        return matchesType && matchesSearch;
    });

    currentRegPage = 1;
    renderRegistrationsTable();

    showToast('success', 'Filter Applied', `Found ${filteredRegistrations.length} registration${filteredRegistrations.length !== 1 ? 's' : ''}`, 2000);
}

// Search Registrations
function searchRegistrations() {
    filterRegistrations();
}

// Refresh Registrations
function refreshRegistrations() {
    showToast('info', 'Refreshing...', 'Reloading registration data', 2000);
    loadSubmissions();
}

// Update Registration Pagination
function updateRegPagination() {
    const totalPages = Math.ceil(filteredRegistrations.length / regPerPage);
    const start = (currentRegPage - 1) * regPerPage + 1;
    const end = Math.min(currentRegPage * regPerPage, filteredRegistrations.length);

    document.getElementById('regShowingStart').textContent = filteredRegistrations.length > 0 ? start : 0;
    document.getElementById('regShowingEnd').textContent = end;
    document.getElementById('totalRegistrations').textContent = filteredRegistrations.length;

    // Update buttons
    document.getElementById('regPrevBtn').disabled = currentRegPage === 1;
    document.getElementById('regNextBtn').disabled = currentRegPage === totalPages || totalPages === 0;

    // Generate page numbers
    const pageNumbersDiv = document.getElementById('regPageNumbers');
    pageNumbersDiv.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentRegPage - 1 && i <= currentRegPage + 1)) {
            const btn = document.createElement('button');
            btn.textContent = i;
            btn.className = `px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                i === currentRegPage
                    ? 'bg-gradient-to-r from-cyan-primary to-blue-primary text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`;
            btn.onclick = () => goToRegPage(i);
            pageNumbersDiv.appendChild(btn);
        } else if (i === currentRegPage - 2 || i === currentRegPage + 2) {
            const dots = document.createElement('span');
            dots.textContent = '...';
            dots.className = 'px-2 text-gray-400';
            pageNumbersDiv.appendChild(dots);
        }
    }
}

// Pagination Functions
function previousRegPage() {
    if (currentRegPage > 1) {
        currentRegPage--;
        renderRegistrationsTable();
    }
}

function nextRegPage() {
    const totalPages = Math.ceil(filteredRegistrations.length / regPerPage);
    if (currentRegPage < totalPages) {
        currentRegPage++;
        renderRegistrationsTable();
    }
}

function goToRegPage(page) {
    currentRegPage = page;
    renderRegistrationsTable();
}

function changeRegPerPage() {
    regPerPage = parseInt(document.getElementById('regPerPageSelect').value);
    currentRegPage = 1;
    renderRegistrationsTable();
}

// View Registration Details
function viewRegistrationDetails(id) {
    const reg = allRegistrations.find(r => r.id === id);
    if (!reg) return;

    const modal = document.getElementById('regDetailModal');
    const content = document.getElementById('regDetailContent');

    content.innerHTML = `
        <div class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="detail-item">
                    <label class="detail-label">Registration ID</label>
                    <p class="detail-value font-mono">${reg.id}</p>
                </div>
                <div class="detail-item">
                    <label class="detail-label">Registration Type</label>
                    <p class="detail-value">
                        <span class="px-3 py-1 rounded-full text-sm font-semibold ${
                            reg.registrationType === 'In-Person'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-purple-100 text-purple-700'
                        }">
                            ${reg.registrationType}
                        </span>
                    </p>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="detail-item">
                    <label class="detail-label">Full Name</label>
                    <p class="detail-value">${reg.fullName}</p>
                </div>
                <div class="detail-item">
                    <label class="detail-label">Job Title</label>
                    <p class="detail-value">${reg.jobTitle || 'N/A'}</p>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="detail-item">
                    <label class="detail-label">Email</label>
                    <p class="detail-value">${reg.email}</p>
                </div>
                <div class="detail-item">
                    <label class="detail-label">Phone</label>
                    <p class="detail-value">${reg.phone}</p>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="detail-item">
                    <label class="detail-label">Country</label>
                    <p class="detail-value">${reg.country}</p>
                </div>
                <div class="detail-item">
                    <label class="detail-label">Organization</label>
                    <p class="detail-value">${reg.organization || 'N/A'}</p>
                </div>
            </div>

            <div class="detail-item">
                <label class="detail-label">Registered At</label>
                <p class="detail-value">${formatDate(reg.registeredAt)}</p>
            </div>
        </div>
    `;

    modal.style.display = 'flex';
    showToast('info', 'Registration Details', `Viewing details for ${reg.fullName}`, 2000);
}

// Close Registration Modal
function closeRegModal() {
    document.getElementById('regDetailModal').style.display = 'none';
}

// Export Registrations to CSV
function exportRegistrationsCSV() {
    try {
        showToast('info', 'Exporting...', 'Preparing CSV file for download', 2000);

        const headers = ['ID', 'Full Name', 'Job Title', 'Email', 'Phone', 'Country', 'Organization', 'Registration Type', 'Registered At'];
        const rows = allRegistrations.map(reg => [
            reg.id,
            reg.fullName,
            reg.jobTitle || '',
            reg.email,
            reg.phone,
            reg.country,
            reg.organization || '',
            reg.registrationType,
            formatDate(reg.registeredAt)
        ]);

        let csvContent = headers.join(',') + '\n';
        rows.forEach(row => {
            csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        const fileName = `AIENI_2026_Registrations_${new Date().toISOString().split('T')[0]}.csv`;
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => {
            showToast('success', 'Export Successful', `${allRegistrations.length} registration${allRegistrations.length !== 1 ? 's' : ''} exported to ${fileName}`, 5000);
        }, 500);
    } catch (error) {
        console.error('Export error:', error);
        showToast('error', 'Export Failed', 'Failed to export registrations. Please try again.', 4000);
    }
}

// ============================================
// INITIALIZE ON DOM READY
// ============================================
window.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadSubmissions();
});
