// ========== Utilities ==========
const $ = id => document.getElementById(id);
const uid = (p = 'id') => p + '-' + Math.random().toString(36).slice(2, 9);
function saveLS(k, v) { localStorage.setItem(k, JSON.stringify(v)) }
function getLS(k, def) { try { return JSON.parse(localStorage.getItem(k)) || def } catch (e) { return def } }
function now() { return new Date().toISOString() }
function formatDate(d) { const dt = new Date(d); return dt.toLocaleDateString() }

// ========== Data Helpers ==========
function getUsers() { return getLS('users', []) }
function getCourses() { return getLS('courses', []) }
function getAttendance() { return getLS('attendance', []) }
function getGrades() { return getLS('grades', []) }
function getQueries() { return getLS('queries', []) }
function getComplaints() { return getLS('complaints', []) }
function getCourseSettings() { return getLS('courseSettings', []) }

function putUsers(v) { saveLS('users', v) }
function putCourses(v) { saveLS('courses', v) }
function putAttendance(v) { saveLS('attendance', v) }
function putGrades(v) { saveLS('grades', v) }
function putQueries(v) { saveLS('queries', v) }
function putComplaints(v) { saveLS('complaints', v) }
function putCourseSettings(v) { saveLS('courseSettings', v) }

// ========== Auth ==========
let currentUser = null;

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// Check session on load
(function checkSession() {
    const stored = localStorage.getItem('currentUser');
    if (!stored) {
        window.location.href = 'login.html';
        return;
    }
    currentUser = JSON.parse(stored);
    if (currentUser.role === 'student') {
        window.location.href = 'student.html';
        return;
    }
    renderApp();
})();

// ========== UI Helpers ==========
function show(el) { el.classList.remove('hidden') }
function hide(el) { el.classList.add('hidden') }

function showModal(title, content) {
    const modalContainer = $('modal-container');
    modalContainer.innerHTML = `
        <div class="modal-overlay active" onclick="closeModal(event)">
            <div class="modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <div class="modal-title">${title}</div>
                    <button class="modal-close" onclick="closeModal()" data-testid="button-modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        </div>
    `;
}

function closeModal(event) {
    if (event && event.target !== event.currentTarget) return;
    $('modal-container').innerHTML = '';
}

window.closeModal = closeModal;

// ========== Main Render ==========
function renderApp() {
    if (!currentUser) return;

    $('user-name').textContent = currentUser.name;
    $('user-role').textContent = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
    $('user-avatar').textContent = currentUser.name.charAt(0).toUpperCase();

    // Show/hide admin section
    const adminSection = $('admin-section');
    if (currentUser.role === 'admin') {
        adminSection.style.display = 'block';
    } else {
        adminSection.style.display = 'none';
    }

    // Show/hide role-specific nav items
    // For teachers: show teacher-only items
    // For admin: hide teacher-only items (My Courses, Grade Management), show admin-only items
    document.querySelectorAll('.teacher-only').forEach(el => {
        if (currentUser.role === 'teacher') {
            el.style.display = 'flex';
        } else {
            // Admin should NOT see "My Courses" and "Grade Management"
            el.style.display = 'none';
        }
    });
    
    document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = currentUser.role === 'admin' ? 'flex' : 'none';
    });

    // Setup navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            loadContent(item.dataset.target);
        });
    });

    // Setup logout
    $('btn-logout').addEventListener('click', logout);

    // Load initial content
    loadContent('dashboard');
}

function loadContent(target) {
    const contentArea = $('content-area');
    const contentTitle = document.querySelector('.content-title');
    const contentActions = $('content-actions');
    contentActions.innerHTML = '';

    switch (target) {
        case 'dashboard':
            contentTitle.innerHTML = '<h2>Dashboard</h2><p>Welcome to your personalized dashboard</p>';
            renderDashboard(contentArea, contentActions);
            break;
        case 'profile':
            contentTitle.innerHTML = '<h2>Profile</h2><p>Manage your profile information</p>';
            renderProfile(contentArea, contentActions);
            break;
        case 'teacher-courses':
            contentTitle.innerHTML = '<h2>My Courses</h2><p>Manage your assigned courses</p>';
            renderTeacherCourses(contentArea, contentActions);
            break;
        case 'grade-management':
            contentTitle.innerHTML = '<h2>Grade Management</h2><p>Manage student grades</p>';
            renderGradeManagement(contentArea, contentActions);
            break;
        case 'attendance-management':
            contentTitle.innerHTML = '<h2>Attendance Management</h2><p>Track and manage attendance</p>';
            renderAttendanceManagement(contentArea, contentActions);
            break;
        case 'query-management':
            contentTitle.innerHTML = '<h2>Query Management</h2><p>View and resolve student queries</p>';
            renderQueryManagement(contentArea, contentActions);
            break;
        case 'manage-courses':
            contentTitle.innerHTML = '<h2>Manage Courses</h2><p>Add, edit, or remove courses</p>';
            renderManageCourses(contentArea, contentActions);
            break;
        case 'manage-users':
            contentTitle.innerHTML = '<h2>Manage Users</h2><p>Manage students and teachers</p>';
            renderManageUsers(contentArea, contentActions);
            break;
        case 'performance-reports':
            contentTitle.innerHTML = '<h2>Performance Reports</h2><p>View attendance and grade reports</p>';
            renderPerformanceReports(contentArea, contentActions);
            break;
        case 'complaint-management':
            contentTitle.innerHTML = '<h2>Complaint Management</h2><p>Review and resolve student complaints</p>';
            renderComplaintManagement(contentArea, contentActions);
            break;
        default:
            contentArea.innerHTML = '<p>Content not found</p>';
    }
}

// ========== Dashboard ==========
function renderDashboard(container, actions) {
    if (currentUser.role === 'admin') {
        renderAdminDashboard(container, actions);
    } else {
        renderTeacherDashboard(container, actions);
    }
}

function renderTeacherDashboard(container, actions) {
    const teacherCourses = getCourses().filter(c => c.teacherId === currentUser.id);
    const totalStudents = teacherCourses.reduce((sum, c) => sum + c.students.length, 0);
    const teacherQueries = getQueries().filter(q => {
        const course = getCourses().find(c => c.id === q.courseId);
        return course && course.teacherId === currentUser.id;
    });

    container.innerHTML = `
        <div class="cards-grid">
            <div class="stat-card" data-testid="card-assigned-courses">
                <div class="stat-header">
                    <div>
                        <div class="stat-value">${teacherCourses.length}</div>
                        <div class="stat-label">Assigned Courses</div>
                    </div>
                    <div class="stat-icon">
                        <i class="fas fa-chalkboard-teacher"></i>
                    </div>
                </div>
            </div>
            <div class="stat-card" data-testid="card-total-students">
                <div class="stat-header">
                    <div>
                        <div class="stat-value">${totalStudents}</div>
                        <div class="stat-label">Total Students</div>
                    </div>
                    <div class="stat-icon">
                        <i class="fas fa-users"></i>
                    </div>
                </div>
            </div>
            <div class="stat-card" data-testid="card-pending-queries">
                <div class="stat-header">
                    <div>
                        <div class="stat-value">${teacherQueries.filter(q => q.status === 'open').length}</div>
                        <div class="stat-label">Pending Queries</div>
                    </div>
                    <div class="stat-icon">
                        <i class="fas fa-question-circle"></i>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="table-container">
            <div class="table-header">
                <div class="table-title">My Courses</div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Course</th>
                        <th>Students</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${teacherCourses.map(course => `
                        <tr>
                            <td>${course.name}</td>
                            <td>${course.students.length}</td>
                            <td>
                                <button class="btn btn-outline" onclick="showMarkAttendanceModal('${course.id}')" data-testid="button-mark-attendance-${course.id}">Mark Attendance</button>
                                <button class="btn btn-primary" onclick="showAddGradeModal('${course.id}')" data-testid="button-add-grade-${course.id}">Add Grades</button>
                            </td>
                        </tr>
                    `).join('')}
                    ${teacherCourses.length === 0 ? `
                        <tr><td colspan="3" style="text-align: center; color: var(--muted);">No courses assigned</td></tr>
                    ` : ''}
                </tbody>
            </table>
        </div>
        
        <div class="table-container">
            <div class="table-header">
                <div class="table-title">Recent Student Queries</div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Subject</th>
                        <th>Student</th>
                        <th>Course</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${teacherQueries.slice(0, 5).map(query => {
                        const student = getUsers().find(u => u.id === query.studentId);
                        const course = getCourses().find(c => c.id === query.courseId);
                        return `
                        <tr>
                            <td>${query.subject}</td>
                            <td>${student ? student.name : 'Unknown'}</td>
                            <td>${course ? course.name : 'N/A'}</td>
                            <td>
                                <span class="status-badge ${query.status === 'open' ? 'status-pending' : 'status-active'}">
                                    ${query.status}
                                </span>
                            </td>
                            <td>
                                <button class="btn btn-outline" onclick="respondToQuery('${query.id}')" data-testid="button-respond-query-${query.id}">
                                    ${query.status === 'open' ? 'Respond' : 'View'}
                                </button>
                            </td>
                        </tr>
                        `;
                    }).join('')}
                    ${teacherQueries.length === 0 ? `
                        <tr><td colspan="5" style="text-align: center; color: var(--muted);">No queries</td></tr>
                    ` : ''}
                </tbody>
            </table>
        </div>
    `;
}

function renderAdminDashboard(container, actions) {
    const allCourses = getCourses();
    const allStudents = getUsers().filter(u => u.role === 'student');
    const allTeachers = getUsers().filter(u => u.role === 'teacher');
    const allComplaints = getComplaints();
    const openComplaints = allComplaints.filter(c => c.status === 'open');

    container.innerHTML = `
        <div class="cards-grid">
            <div class="stat-card" data-testid="card-total-courses">
                <div class="stat-header">
                    <div>
                        <div class="stat-value">${allCourses.length}</div>
                        <div class="stat-label">Total Courses</div>
                    </div>
                    <div class="stat-icon">
                        <i class="fas fa-book"></i>
                    </div>
                </div>
            </div>
            <div class="stat-card" data-testid="card-total-students">
                <div class="stat-header">
                    <div>
                        <div class="stat-value">${allStudents.length}</div>
                        <div class="stat-label">Total Students</div>
                    </div>
                    <div class="stat-icon">
                        <i class="fas fa-user-graduate"></i>
                    </div>
                </div>
            </div>
            <div class="stat-card" data-testid="card-total-teachers">
                <div class="stat-header">
                    <div>
                        <div class="stat-value">${allTeachers.length}</div>
                        <div class="stat-label">Total Teachers</div>
                    </div>
                    <div class="stat-icon">
                        <i class="fas fa-chalkboard-teacher"></i>
                    </div>
                </div>
            </div>
            <div class="stat-card" data-testid="card-open-complaints">
                <div class="stat-header">
                    <div>
                        <div class="stat-value">${openComplaints.length}</div>
                        <div class="stat-label">Open Complaints</div>
                    </div>
                    <div class="stat-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="chart-container">
            <div class="table-title" style="margin-bottom: 15px;">Course Enrollment Overview</div>
            <canvas id="admin-performance-chart"></canvas>
        </div>
        
        <div class="table-container">
            <div class="table-header">
                <div class="table-title">Recent Complaints</div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Subject</th>
                        <th>From</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${allComplaints.slice(0, 5).map(complaint => {
                        const student = getUsers().find(u => u.id === complaint.studentId);
                        return `
                        <tr>
                            <td>${complaint.subject}</td>
                            <td>${student ? student.name : 'Unknown'}</td>
                            <td>${formatDate(complaint.createdAt)}</td>
                            <td>
                                <span class="status-badge ${complaint.status === 'open' ? 'status-pending' : 'status-active'}">
                                    ${complaint.status}
                                </span>
                            </td>
                            <td>
                                <button class="btn btn-outline" onclick="respondToComplaint('${complaint.id}')" data-testid="button-respond-complaint-${complaint.id}">
                                    ${complaint.status === 'open' ? 'Respond' : 'View'}
                                </button>
                            </td>
                        </tr>
                        `;
                    }).join('')}
                    ${allComplaints.length === 0 ? `
                        <tr><td colspan="5" style="text-align: center; color: var(--muted);">No complaints</td></tr>
                    ` : ''}
                </tbody>
            </table>
        </div>
    `;

    // Render chart
    setTimeout(() => {
        const ctx = document.getElementById('admin-performance-chart');
        if (ctx) {
            const courses = getCourses();
            const labels = courses.map(c => c.name);
            const enrollmentData = courses.map(c => c.students.length);

            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Student Enrollment',
                        data: enrollmentData,
                        backgroundColor: 'rgba(45, 212, 191, 0.5)',
                        borderColor: 'rgba(45, 212, 191, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                        },
                        x: {
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                        }
                    },
                    plugins: {
                        legend: { labels: { color: 'rgba(255, 255, 255, 0.7)' } }
                    }
                }
            });
        }
    }, 100);
}

// ========== Profile ==========
function renderProfile(container, actions) {
    container.innerHTML = `
        <div class="profile-section">
            <div class="profile-header">
                <div class="profile-avatar">${currentUser.name.charAt(0).toUpperCase()}</div>
                <div class="profile-info">
                    <h3>${currentUser.name}</h3>
                    <p>${currentUser.email}</p>
                </div>
            </div>
            <div class="profile-details">
                <div class="profile-detail">
                    <div class="profile-detail-label">Role</div>
                    <div class="profile-detail-value">${currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}</div>
                </div>
                <div class="profile-detail">
                    <div class="profile-detail-label">Email</div>
                    <div class="profile-detail-value">${currentUser.email}</div>
                </div>
                <div class="profile-detail">
                    <div class="profile-detail-label">Assigned Courses</div>
                    <div class="profile-detail-value">${getCourses().filter(c => c.teacherId === currentUser.id).length}</div>
                </div>
            </div>
        </div>
    `;
}

// ========== Teacher Courses ==========
function renderTeacherCourses(container, actions) {
    const teacherCourses = getCourses().filter(c => c.teacherId === currentUser.id);

    container.innerHTML = `
        <div class="cards-grid">
            ${teacherCourses.map(course => {
                const students = getUsers().filter(u => u.role === 'student' && course.students.includes(u.id));
                return `
                <div class="stat-card" data-testid="card-course-${course.id}">
                    <div class="stat-header">
                        <div>
                            <div class="stat-value">${course.name}</div>
                            <div class="stat-label">${students.length} students</div>
                        </div>
                        <div class="stat-icon">
                            <i class="fas fa-chalkboard-teacher"></i>
                        </div>
                    </div>
                    <div style="margin-top: 15px;">
                        <div class="btn btn-primary" style="width: 100%; margin-bottom: 10px;" onclick="showMarkAttendanceModal('${course.id}')" data-testid="button-mark-attendance-${course.id}">Mark Attendance</div>
                        <div class="btn btn-outline" style="width: 100%;" onclick="showCourseSettingsModal('${course.id}')" data-testid="button-course-settings-${course.id}">Course Settings</div>
                    </div>
                </div>
                `;
            }).join('')}
        </div>
        
        ${teacherCourses.length === 0 ? `
        <div class="table-container">
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-chalkboard-teacher" style="font-size: 48px; color: var(--muted); margin-bottom: 15px;"></i>
                <h3 style="color: var(--text-light); margin-bottom: 10px;">No Courses Assigned</h3>
                <p style="color: var(--muted);">You are not assigned to any courses yet.</p>
            </div>
        </div>
        ` : ''}
    `;
}

// ========== Query Management (Teacher) ==========
function renderQueryManagement(container, actions) {
    const teacherCourses = getCourses().filter(c => c.teacherId === currentUser.id);
    const teacherQueries = getQueries().filter(q => {
        const course = getCourses().find(c => c.id === q.courseId);
        return course && course.teacherId === currentUser.id;
    });

    const openQueries = teacherQueries.filter(q => q.status === 'open');
    const resolvedQueries = teacherQueries.filter(q => q.status === 'resolved');

    container.innerHTML = `
        <div class="cards-grid">
            <div class="stat-card" data-testid="card-open-queries">
                <div class="stat-header">
                    <div>
                        <div class="stat-value">${openQueries.length}</div>
                        <div class="stat-label">Open Queries</div>
                    </div>
                    <div class="stat-icon" style="background: linear-gradient(135deg, var(--warn), #d97706);">
                        <i class="fas fa-clock"></i>
                    </div>
                </div>
            </div>
            <div class="stat-card" data-testid="card-resolved-queries">
                <div class="stat-header">
                    <div>
                        <div class="stat-value">${resolvedQueries.length}</div>
                        <div class="stat-label">Resolved Queries</div>
                    </div>
                    <div class="stat-icon" style="background: linear-gradient(135deg, var(--ok), #059669);">
                        <i class="fas fa-check-circle"></i>
                    </div>
                </div>
            </div>
            <div class="stat-card" data-testid="card-total-queries">
                <div class="stat-header">
                    <div>
                        <div class="stat-value">${teacherQueries.length}</div>
                        <div class="stat-label">Total Queries</div>
                    </div>
                    <div class="stat-icon">
                        <i class="fas fa-question-circle"></i>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="table-container">
            <div class="table-header">
                <div class="table-title">Student Queries</div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Subject</th>
                        <th>Student</th>
                        <th>Course</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${teacherQueries.map(query => {
                        const student = getUsers().find(u => u.id === query.studentId);
                        const course = getCourses().find(c => c.id === query.courseId);
                        return `
                        <tr data-testid="row-query-${query.id}">
                            <td>${query.subject}</td>
                            <td>${student ? student.name : 'Unknown'}</td>
                            <td>${course ? course.name : 'N/A'}</td>
                            <td>${formatDate(query.createdAt)}</td>
                            <td>
                                <span class="status-badge ${query.status === 'open' ? 'status-pending' : 'status-active'}">
                                    ${query.status.charAt(0).toUpperCase() + query.status.slice(1)}
                                </span>
                            </td>
                            <td>
                                <button class="btn btn-outline" onclick="respondToQuery('${query.id}')" data-testid="button-respond-query-${query.id}">
                                    ${query.status === 'open' ? 'Respond' : 'View'}
                                </button>
                            </td>
                        </tr>
                        `;
                    }).join('')}
                    ${teacherQueries.length === 0 ? `
                        <tr><td colspan="6" style="text-align: center; color: var(--muted);">No queries from students</td></tr>
                    ` : ''}
                </tbody>
            </table>
        </div>
    `;
}

window.respondToQuery = function(queryId) {
    const query = getQueries().find(q => q.id === queryId);
    if (!query) return;

    const student = getUsers().find(u => u.id === query.studentId);
    const course = getCourses().find(c => c.id === query.courseId);

    const content = `
        <div class="form-group">
            <label class="form-label">Student</label>
            <input type="text" class="form-input" value="${student ? student.name : 'Unknown'}" readonly>
        </div>
        <div class="form-group">
            <label class="form-label">Course</label>
            <input type="text" class="form-input" value="${course ? course.name : 'N/A'}" readonly>
        </div>
        <div class="form-group">
            <label class="form-label">Subject</label>
            <input type="text" class="form-input" value="${query.subject}" readonly>
        </div>
        <div class="form-group">
            <label class="form-label">Query Details</label>
            <textarea class="form-input" rows="4" readonly>${query.message}</textarea>
        </div>
        ${query.status === 'open' ? `
        <div class="form-group">
            <label class="form-label">Your Response</label>
            <textarea class="form-input" id="query-response" rows="4" placeholder="Enter your response to the student" data-testid="input-query-response"></textarea>
        </div>
        <div class="modal-actions">
            <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="saveQueryResponse('${queryId}')" data-testid="button-save-query-response">Resolve Query</button>
        </div>
        ` : `
        <div class="form-group">
            <label class="form-label">Response</label>
            <textarea class="form-input" rows="4" readonly>${query.response || 'No response'}</textarea>
        </div>
        <div class="modal-actions">
            <button class="btn btn-outline" onclick="closeModal()">Close</button>
        </div>
        `}
    `;

    showModal(query.status === 'open' ? 'Respond to Query' : 'View Query', content);
};

window.saveQueryResponse = function(queryId) {
    const response = $('query-response').value.trim();

    if (!response) {
        alert('Please enter a response');
        return;
    }

    const queries = getQueries();
    const queryIndex = queries.findIndex(q => q.id === queryId);

    if (queryIndex !== -1) {
        queries[queryIndex].response = response;
        queries[queryIndex].status = 'resolved';
        queries[queryIndex].teacherId = currentUser.id;
        putQueries(queries);
        alert('Query resolved successfully!');
        closeModal();
        loadContent('query-management');
    }
};

// ========== Grade Management ==========
function renderGradeManagement(container, actions) {
    const teacherCourses = getCourses().filter(c => c.teacherId === currentUser.id);

    container.innerHTML = `
        <div class="cards-grid">
            ${teacherCourses.map(course => {
                const grades = getGrades().filter(g => g.courseId === course.id);
                const students = getUsers().filter(u => u.role === 'student' && course.students.includes(u.id));

                return `
                <div class="stat-card" data-testid="card-grade-course-${course.id}">
                    <div class="stat-header">
                        <div>
                            <div class="stat-value">${course.name}</div>
                            <div class="stat-label">${grades.length} grades recorded</div>
                        </div>
                        <div class="stat-icon">
                            <i class="fas fa-calculator"></i>
                        </div>
                    </div>
                    <div style="margin-top: 15px;">
                        <div class="btn btn-primary" style="width: 100%; margin-bottom: 10px;" onclick="showAddGradeModal('${course.id}')" data-testid="button-add-grade-${course.id}">Add/Edit Grades</div>
                        <div class="btn btn-outline" style="width: 100%;" onclick="viewCourseGrades('${course.id}')" data-testid="button-view-grades-${course.id}">View Grades</div>
                    </div>
                </div>
                `;
            }).join('')}
        </div>
        
        ${teacherCourses.length === 0 ? `
        <div class="table-container">
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-calculator" style="font-size: 48px; color: var(--muted); margin-bottom: 15px;"></i>
                <h3 style="color: var(--text-light); margin-bottom: 10px;">No Courses Assigned</h3>
                <p style="color: var(--muted);">You are not assigned to any courses yet.</p>
            </div>
        </div>
        ` : ''}
    `;
}

window.showAddGradeModal = function(courseId) {
    const course = getCourses().find(c => c.id === courseId);
    if (!course) return;

    const students = getUsers().filter(u => u.role === 'student' && course.students.includes(u.id));
    const courseSettings = getCourseSettings().find(cs => cs.courseId === courseId) || {
        assessmentWeights: { quiz: 15, assignment: 25, mid: 30, final: 30 }
    };

    if (students.length === 0) {
        alert('No students enrolled in this course');
        return;
    }

    const content = `
        <div class="form-group">
            <label class="form-label">Course: ${course.name}</label>
        </div>
        <div class="form-group">
            <label class="form-label">Select Student</label>
            <select class="form-select" id="grade-student" data-testid="select-grade-student">
                ${students.map(s => `<option value="${s.id}">${s.name} (${s.roll || 'N/A'})</option>`).join('')}
            </select>
        </div>
        <div class="form-group">
            <label class="form-label">Assessment Type</label>
            <select class="form-select" id="grade-type" data-testid="select-grade-type">
                <option value="quiz">Quiz (${courseSettings.assessmentWeights.quiz || 0}%)</option>
                <option value="assignment">Assignment (${courseSettings.assessmentWeights.assignment || 0}%)</option>
                <option value="mid">Midterm (${courseSettings.assessmentWeights.mid || 0}%)</option>
                <option value="final">Final (${courseSettings.assessmentWeights.final || 0}%)</option>
            </select>
        </div>
        <div class="form-group">
            <label class="form-label">Grade (%)</label>
            <input type="number" class="form-input" id="grade-value" min="0" max="100" placeholder="Enter grade (0-100)" data-testid="input-grade-value">
        </div>
        <div class="modal-actions">
            <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="saveGrade('${courseId}')" data-testid="button-save-grade">Save Grade</button>
        </div>
    `;

    showModal('Add Grade', content);
};

window.saveGrade = function(courseId) {
    const studentId = $('grade-student').value;
    const assessmentType = $('grade-type').value;
    const gradeValue = parseInt($('grade-value').value);

    if (!studentId || !assessmentType || isNaN(gradeValue)) {
        alert('Please fill in all fields');
        return;
    }

    if (gradeValue < 0 || gradeValue > 100) {
        alert('Grade must be between 0 and 100');
        return;
    }

    const courseSettings = getCourseSettings().find(cs => cs.courseId === courseId) || {
        assessmentWeights: { quiz: 15, assignment: 25, mid: 30, final: 30 }
    };

    const grades = getGrades();
    const existingGradeIndex = grades.findIndex(g => 
        g.studentId === studentId && 
        g.courseId === courseId && 
        g.assessmentType === assessmentType
    );

    if (existingGradeIndex !== -1) {
        grades[existingGradeIndex].grade = gradeValue;
    } else {
        grades.push({
            id: uid('g'),
            studentId,
            courseId,
            grade: gradeValue,
            assessmentType,
            weightage: courseSettings.assessmentWeights[assessmentType] || 0
        });
    }

    putGrades(grades);
    alert('Grade saved successfully!');
    closeModal();
};

window.viewCourseGrades = function(courseId) {
    const course = getCourses().find(c => c.id === courseId);
    if (!course) return;

    const students = getUsers().filter(u => u.role === 'student' && course.students.includes(u.id));
    const courseGrades = getGrades().filter(g => g.courseId === courseId);

    let gradesHTML = '';
    students.forEach(student => {
        const studentGrades = courseGrades.filter(g => g.studentId === student.id);
        gradesHTML += `
            <tr>
                <td>${student.name}</td>
                <td>${student.roll || 'N/A'}</td>
                ${['quiz', 'assignment', 'mid', 'final'].map(type => {
                    const grade = studentGrades.find(g => g.assessmentType === type);
                    return `<td>${grade ? grade.grade + '%' : '-'}</td>`;
                }).join('')}
            </tr>
        `;
    });

    const content = `
        <div style="overflow-x: auto;">
            <table style="width: 100%; min-width: 500px;">
                <thead>
                    <tr>
                        <th>Student</th>
                        <th>Roll</th>
                        <th>Quiz</th>
                        <th>Assignment</th>
                        <th>Midterm</th>
                        <th>Final</th>
                    </tr>
                </thead>
                <tbody>
                    ${gradesHTML || '<tr><td colspan="6" style="text-align: center; color: var(--muted);">No grades recorded</td></tr>'}
                </tbody>
            </table>
        </div>
        <div class="modal-actions">
            <button class="btn btn-outline" onclick="closeModal()">Close</button>
        </div>
    `;

    showModal(`${course.name} - Grades`, content);
};

// ========== Attendance Management ==========
function renderAttendanceManagement(container, actions) {
    const teacherCourses = getCourses().filter(c => c.teacherId === currentUser.id);

    container.innerHTML = `
        <div class="cards-grid">
            ${teacherCourses.map(course => {
                const courseAttendance = getAttendance().filter(a => a.courseId === course.id);
                const students = getUsers().filter(u => u.role === 'student' && course.students.includes(u.id));

                return `
                <div class="stat-card" data-testid="card-attendance-course-${course.id}">
                    <div class="stat-header">
                        <div>
                            <div class="stat-value">${course.name}</div>
                            <div class="stat-label">${students.length} students, ${courseAttendance.length} records</div>
                        </div>
                        <div class="stat-icon">
                            <i class="fas fa-user-check"></i>
                        </div>
                    </div>
                    <div style="margin-top: 15px;">
                        <div class="btn btn-primary" style="width: 100%; margin-bottom: 10px;" onclick="showMarkAttendanceModal('${course.id}')" data-testid="button-mark-attendance-${course.id}">Mark Attendance</div>
                        <div class="btn btn-outline" style="width: 100%;" onclick="viewCourseAttendance('${course.id}')" data-testid="button-view-attendance-${course.id}">View Records</div>
                    </div>
                </div>
                `;
            }).join('')}
        </div>
        
        ${teacherCourses.length === 0 ? `
        <div class="table-container">
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-user-check" style="font-size: 48px; color: var(--muted); margin-bottom: 15px;"></i>
                <h3 style="color: var(--text-light); margin-bottom: 10px;">No Courses Assigned</h3>
                <p style="color: var(--muted);">You are not assigned to any courses yet.</p>
            </div>
        </div>
        ` : ''}
    `;
}

window.showMarkAttendanceModal = function(courseId) {
    const course = getCourses().find(c => c.id === courseId);
    if (!course) return;

    const students = getUsers().filter(u => u.role === 'student' && course.students.includes(u.id));
    const today = new Date().toISOString().split('T')[0];

    if (students.length === 0) {
        alert('No students enrolled in this course');
        return;
    }

    const content = `
        <div class="form-group">
            <label class="form-label">Course: ${course.name}</label>
        </div>
        <div class="form-group">
            <label class="form-label">Date</label>
            <input type="date" class="form-input" id="attendance-date" value="${today}" data-testid="input-attendance-date">
        </div>
        <div class="form-group">
            <label class="form-label">Students</label>
            <div class="attendance-grid">
                ${students.map(s => `
                    <div class="attendance-item">
                        <label class="toggle-switch">
                            <input type="checkbox" id="att-${s.id}" checked data-testid="checkbox-attendance-${s.id}">
                            <span class="toggle-slider"></span>
                        </label>
                        <span>${s.name} (${s.roll || 'N/A'})</span>
                    </div>
                `).join('')}
            </div>
        </div>
        <div class="modal-actions">
            <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="saveAttendance('${courseId}')" data-testid="button-save-attendance">Save Attendance</button>
        </div>
    `;

    showModal('Mark Attendance', content);
};

window.saveAttendance = function(courseId) {
    const date = $('attendance-date').value;
    const course = getCourses().find(c => c.id === courseId);
    if (!course) return;

    const students = getUsers().filter(u => u.role === 'student' && course.students.includes(u.id));
    const attendance = getAttendance();

    students.forEach(student => {
        const checkbox = $(`att-${student.id}`);
        const present = checkbox ? checkbox.checked : false;

        // Check if attendance exists for this date
        const existingIndex = attendance.findIndex(a => 
            a.studentId === student.id && 
            a.courseId === courseId && 
            a.date.split('T')[0] === date
        );

        if (existingIndex !== -1) {
            attendance[existingIndex].present = present;
        } else {
            attendance.push({
                id: uid('att'),
                studentId: student.id,
                courseId,
                date: new Date(date).toISOString(),
                present
            });
        }
    });

    putAttendance(attendance);
    alert('Attendance saved successfully!');
    closeModal();
};

window.viewCourseAttendance = function(courseId) {
    const course = getCourses().find(c => c.id === courseId);
    if (!course) return;

    const students = getUsers().filter(u => u.role === 'student' && course.students.includes(u.id));
    const courseAttendance = getAttendance().filter(a => a.courseId === courseId);

    let attendanceHTML = '';
    students.forEach(student => {
        const studentAttendance = courseAttendance.filter(a => a.studentId === student.id);
        const present = studentAttendance.filter(a => a.present).length;
        const total = studentAttendance.length;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

        attendanceHTML += `
            <tr>
                <td>${student.name}</td>
                <td>${student.roll || 'N/A'}</td>
                <td>${present}/${total}</td>
                <td>
                    <span class="status-badge ${percentage >= 75 ? 'status-active' : percentage >= 50 ? 'status-pending' : 'status-closed'}">
                        ${percentage}%
                    </span>
                </td>
            </tr>
        `;
    });

    const content = `
        <table style="width: 100%;">
            <thead>
                <tr>
                    <th>Student</th>
                    <th>Roll</th>
                    <th>Classes Attended</th>
                    <th>Percentage</th>
                </tr>
            </thead>
            <tbody>
                ${attendanceHTML || '<tr><td colspan="4" style="text-align: center; color: var(--muted);">No attendance records</td></tr>'}
            </tbody>
        </table>
        <div class="modal-actions">
            <button class="btn btn-outline" onclick="closeModal()">Close</button>
        </div>
    `;

    showModal(`${course.name} - Attendance`, content);
};

window.showCourseSettingsModal = function(courseId) {
    const course = getCourses().find(c => c.id === courseId);
    if (!course) return;

    const settings = getCourseSettings().find(cs => cs.courseId === courseId) || {
        assessmentWeights: { quiz: 15, assignment: 25, mid: 30, final: 30 },
        gradeScale: { A: 90, B: 80, C: 70, D: 60, F: 0 }
    };

    const content = `
        <div class="form-group">
            <label class="form-label">Assessment Weights (must total 100%)</label>
            <div class="weightage-input">
                <span>Quiz:</span>
                <input type="number" class="form-input" id="weight-quiz" value="${settings.assessmentWeights.quiz}" min="0" max="100">
                <span>%</span>
            </div>
            <div class="weightage-input">
                <span>Assignment:</span>
                <input type="number" class="form-input" id="weight-assignment" value="${settings.assessmentWeights.assignment}" min="0" max="100">
                <span>%</span>
            </div>
            <div class="weightage-input">
                <span>Midterm:</span>
                <input type="number" class="form-input" id="weight-mid" value="${settings.assessmentWeights.mid}" min="0" max="100">
                <span>%</span>
            </div>
            <div class="weightage-input">
                <span>Final:</span>
                <input type="number" class="form-input" id="weight-final" value="${settings.assessmentWeights.final}" min="0" max="100">
                <span>%</span>
            </div>
        </div>
        <div class="form-group">
            <label class="form-label">Grade Scale (minimum percentage for each grade)</label>
            <div class="weightage-input">
                <span>A:</span>
                <input type="number" class="form-input" id="scale-A" value="${settings.gradeScale.A}" min="0" max="100">
                <span>%</span>
            </div>
            <div class="weightage-input">
                <span>B:</span>
                <input type="number" class="form-input" id="scale-B" value="${settings.gradeScale.B}" min="0" max="100">
                <span>%</span>
            </div>
            <div class="weightage-input">
                <span>C:</span>
                <input type="number" class="form-input" id="scale-C" value="${settings.gradeScale.C}" min="0" max="100">
                <span>%</span>
            </div>
            <div class="weightage-input">
                <span>D:</span>
                <input type="number" class="form-input" id="scale-D" value="${settings.gradeScale.D}" min="0" max="100">
                <span>%</span>
            </div>
        </div>
        <div class="modal-actions">
            <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="saveCourseSettings('${courseId}')">Save Settings</button>
        </div>
    `;

    showModal(`${course.name} - Settings`, content);
};

window.saveCourseSettings = function(courseId) {
    const quiz = parseInt($('weight-quiz').value) || 0;
    const assignment = parseInt($('weight-assignment').value) || 0;
    const mid = parseInt($('weight-mid').value) || 0;
    const final = parseInt($('weight-final').value) || 0;

    const total = quiz + assignment + mid + final;
    if (total !== 100) {
        alert(`Assessment weights must total 100%. Current total: ${total}%`);
        return;
    }

    const settings = getCourseSettings();
    const existingIndex = settings.findIndex(cs => cs.courseId === courseId);

    const newSettings = {
        courseId,
        assessmentWeights: { quiz, assignment, mid, final },
        gradeScale: {
            A: parseInt($('scale-A').value) || 90,
            B: parseInt($('scale-B').value) || 80,
            C: parseInt($('scale-C').value) || 70,
            D: parseInt($('scale-D').value) || 60,
            F: 0
        }
    };

    if (existingIndex !== -1) {
        settings[existingIndex] = newSettings;
    } else {
        settings.push(newSettings);
    }

    putCourseSettings(settings);
    alert('Course settings saved successfully!');
    closeModal();
};

// ========== Admin: Manage Courses ==========
function renderManageCourses(container, actions) {
    const allCourses = getCourses();

    container.innerHTML = `
        <div class="table-container">
            <div class="table-header">
                <div class="table-title">All Courses</div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Course Name</th>
                        <th>Teacher</th>
                        <th>Students</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${allCourses.map(course => {
                        const teacher = getUsers().find(u => u.id === course.teacherId);
                        return `
                        <tr data-testid="row-course-${course.id}">
                            <td>${course.name}</td>
                            <td>${teacher ? teacher.name : 'Not Assigned'}</td>
                            <td>${course.students.length}</td>
                            <td>
                                <button class="btn btn-outline" onclick="editCourse('${course.id}')" data-testid="button-edit-course-${course.id}">Edit</button>
                                <button class="btn btn-primary" onclick="showEnrollStudentsModal('${course.id}')" data-testid="button-enroll-course-${course.id}">Enroll</button>
                                <button class="btn btn-outline" onclick="deleteCourse('${course.id}')" style="color: var(--danger);" data-testid="button-delete-course-${course.id}">Delete</button>
                            </td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;

    const addCourseBtn = document.createElement('button');
    addCourseBtn.className = 'btn btn-primary';
    addCourseBtn.innerHTML = '<i class="fas fa-plus"></i> Add Course';
    addCourseBtn.setAttribute('data-testid', 'button-add-course');
    addCourseBtn.onclick = () => showAddCourseModal();
    actions.appendChild(addCourseBtn);
}

function showAddCourseModal() {
    const teachers = getUsers().filter(u => u.role === 'teacher');

    const content = `
        <div class="form-group">
            <label class="form-label">Course Name</label>
            <input type="text" class="form-input" id="course-name" placeholder="Enter course name" data-testid="input-course-name">
        </div>
        <div class="form-group">
            <label class="form-label">Assign Teacher</label>
            <select class="form-select" id="course-teacher" data-testid="select-course-teacher">
                <option value="">Select a teacher</option>
                ${teachers.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
            </select>
        </div>
        <div class="modal-actions">
            <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="createCourse()" data-testid="button-create-course">Create Course</button>
        </div>
    `;

    showModal('Add New Course', content);
}

window.createCourse = function() {
    const name = $('course-name').value.trim();
    const teacherId = $('course-teacher').value;

    if (!name) {
        alert('Please enter a course name');
        return;
    }

    const courseId = uid('c');
    const courses = getCourses();
    courses.push({
        id: courseId,
        name,
        teacherId: teacherId || null,
        students: []
    });
    putCourses(courses);

    // Initialize default courseSettings for the new course
    const courseSettings = getCourseSettings();
    courseSettings.push({
        courseId: courseId,
        assessmentWeights: { quiz: 15, assignment: 25, mid: 30, final: 30 },
        gradeScale: { A: 90, B: 80, C: 70, D: 60, F: 0 }
    });
    putCourseSettings(courseSettings);

    alert('Course created successfully!');
    closeModal();
    loadContent('manage-courses');
};

window.editCourse = function(courseId) {
    const course = getCourses().find(c => c.id === courseId);
    if (!course) return;

    const teachers = getUsers().filter(u => u.role === 'teacher');

    const content = `
        <div class="form-group">
            <label class="form-label">Course Name</label>
            <input type="text" class="form-input" id="edit-course-name" value="${course.name}" data-testid="input-edit-course-name">
        </div>
        <div class="form-group">
            <label class="form-label">Assign Teacher</label>
            <select class="form-select" id="edit-course-teacher" data-testid="select-edit-course-teacher">
                <option value="">Select a teacher</option>
                ${teachers.map(t => `<option value="${t.id}" ${course.teacherId === t.id ? 'selected' : ''}>${t.name}</option>`).join('')}
            </select>
        </div>
        <div class="modal-actions">
            <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="updateCourse('${courseId}')" data-testid="button-update-course">Update Course</button>
        </div>
    `;

    showModal('Edit Course', content);
};

window.updateCourse = function(courseId) {
    const name = $('edit-course-name').value.trim();
    const teacherId = $('edit-course-teacher').value;

    if (!name) {
        alert('Please enter a course name');
        return;
    }

    const courses = getCourses();
    const courseIndex = courses.findIndex(c => c.id === courseId);

    if (courseIndex !== -1) {
        courses[courseIndex].name = name;
        courses[courseIndex].teacherId = teacherId || null;
        putCourses(courses);
        alert('Course updated successfully!');
        closeModal();
        loadContent('manage-courses');
    }
};

// ========== Enroll Students Modal ==========
window.showEnrollStudentsModal = function(courseId) {
    const course = getCourses().find(c => c.id === courseId);
    if (!course) return;

    const allStudents = getUsers().filter(u => u.role === 'student');

    const content = `
        <div class="form-group">
            <label class="form-label">Course: ${course.name}</label>
        </div>
        <div class="form-group">
            <label class="form-label">Select Students to Enroll</label>
            <div style="max-height: 300px; overflow-y: auto; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 15px;">
                ${allStudents.map(s => `
                    <label style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px; cursor: pointer; padding: 8px; border-radius: 6px; background: rgba(255,255,255,0.02);">
                        <input type="checkbox" id="enroll-${s.id}" ${course.students.includes(s.id) ? 'checked' : ''} data-testid="checkbox-enroll-${s.id}">
                        <div>
                            <div style="font-weight: 600;">${s.name}</div>
                            <div style="font-size: 12px; color: var(--muted);">Roll: ${s.roll || 'N/A'} | ${s.email}</div>
                        </div>
                    </label>
                `).join('')}
                ${allStudents.length === 0 ? '<p style="color: var(--muted); text-align: center;">No students available</p>' : ''}
            </div>
        </div>
        <div class="modal-actions">
            <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="saveEnrollment('${courseId}')" data-testid="button-save-enrollment">Save Enrollment</button>
        </div>
    `;

    showModal('Enroll Students', content);
};

window.saveEnrollment = function(courseId) {
    const allStudents = getUsers().filter(u => u.role === 'student');
    const enrolledStudents = [];

    allStudents.forEach(s => {
        const checkbox = $(`enroll-${s.id}`);
        if (checkbox && checkbox.checked) {
            enrolledStudents.push(s.id);
        }
    });

    const courses = getCourses();
    const courseIndex = courses.findIndex(c => c.id === courseId);

    if (courseIndex !== -1) {
        courses[courseIndex].students = enrolledStudents;
        putCourses(courses);
        alert('Enrollment updated successfully!');
        closeModal();
        loadContent('manage-courses');
    }
};

window.deleteCourse = function(courseId) {
    if (!confirm('Are you sure you want to delete this course? This will also remove all associated grades, attendance records, and settings.')) return;

    // Remove course
    const courses = getCourses().filter(c => c.id !== courseId);
    putCourses(courses);

    // Clean up related courseSettings
    const courseSettings = getCourseSettings().filter(cs => cs.courseId !== courseId);
    putCourseSettings(courseSettings);

    // Clean up related grades
    const grades = getGrades().filter(g => g.courseId !== courseId);
    putGrades(grades);

    // Clean up related attendance
    const attendance = getAttendance().filter(a => a.courseId !== courseId);
    putAttendance(attendance);

    // Clean up related queries
    const queries = getQueries().filter(q => q.courseId !== courseId);
    putQueries(queries);

    alert('Course deleted successfully!');
    loadContent('manage-courses');
};

// ========== Admin: Manage Users ==========
function renderManageUsers(container, actions) {
    const allUsers = getUsers().filter(u => u.role !== 'admin');

    container.innerHTML = `
        <div class="table-container">
            <div class="table-header">
                <div class="table-title">All Users</div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Roll Number</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${allUsers.map(user => `
                        <tr data-testid="row-user-${user.id}">
                            <td>${user.name}</td>
                            <td>${user.email}</td>
                            <td>${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</td>
                            <td>${user.roll || 'N/A'}</td>
                            <td>
                                <button class="btn btn-outline" onclick="editUser('${user.id}')" data-testid="button-edit-user-${user.id}">Edit</button>
                                <button class="btn btn-outline" onclick="deleteUser('${user.id}')" style="color: var(--danger);" data-testid="button-delete-user-${user.id}">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

window.editUser = function(userId) {
    const user = getUsers().find(u => u.id === userId);
    if (!user) return;

    const content = `
        <div class="form-group">
            <label class="form-label">Name</label>
            <input type="text" class="form-input" id="edit-user-name" value="${user.name}" data-testid="input-edit-user-name">
        </div>
        <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-input" id="edit-user-email" value="${user.email}" data-testid="input-edit-user-email">
        </div>
        <div class="form-group">
            <label class="form-label">Role</label>
            <select class="form-select" id="edit-user-role" data-testid="select-edit-user-role">
                <option value="student" ${user.role === 'student' ? 'selected' : ''}>Student</option>
                <option value="teacher" ${user.role === 'teacher' ? 'selected' : ''}>Teacher</option>
            </select>
        </div>
        <div class="form-group">
            <label class="form-label">Roll Number (for students)</label>
            <input type="text" class="form-input" id="edit-user-roll" value="${user.roll || ''}" data-testid="input-edit-user-roll">
        </div>
        <div class="modal-actions">
            <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="updateUser('${userId}')" data-testid="button-update-user">Update User</button>
        </div>
    `;

    showModal('Edit User', content);
};

window.updateUser = function(userId) {
    const name = $('edit-user-name').value.trim();
    const email = $('edit-user-email').value.trim();
    const role = $('edit-user-role').value;
    const roll = $('edit-user-roll').value.trim();

    if (!name || !email) {
        alert('Please fill in all required fields');
        return;
    }

    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex !== -1) {
        users[userIndex].name = name;
        users[userIndex].email = email;
        users[userIndex].role = role;
        users[userIndex].roll = role === 'student' ? roll : null;
        putUsers(users);
        alert('User updated successfully!');
        closeModal();
        loadContent('manage-users');
    }
};

window.deleteUser = function(userId) {
    if (!confirm('Are you sure you want to delete this user? This will also remove all associated grades, attendance, queries, and complaints.')) return;

    const user = getUsers().find(u => u.id === userId);
    
    // Remove user
    const users = getUsers().filter(u => u.id !== userId);
    putUsers(users);

    // If student, remove from course enrollments
    if (user && user.role === 'student') {
        const courses = getCourses();
        courses.forEach(c => {
            c.students = c.students.filter(sid => sid !== userId);
        });
        putCourses(courses);

        // Clean up student's grades
        const grades = getGrades().filter(g => g.studentId !== userId);
        putGrades(grades);

        // Clean up student's attendance
        const attendance = getAttendance().filter(a => a.studentId !== userId);
        putAttendance(attendance);

        // Clean up student's queries
        const queries = getQueries().filter(q => q.studentId !== userId);
        putQueries(queries);

        // Clean up student's complaints
        const complaints = getComplaints().filter(c => c.studentId !== userId);
        putComplaints(complaints);
    }

    // If teacher, reassign their courses to null
    if (user && user.role === 'teacher') {
        const courses = getCourses();
        courses.forEach(c => {
            if (c.teacherId === userId) {
                c.teacherId = null;
            }
        });
        putCourses(courses);
    }

    alert('User deleted successfully!');
    loadContent('manage-users');
};

// ========== Admin: Performance Reports ==========
function renderPerformanceReports(container, actions) {
    const allCourses = getCourses();
    const allStudents = getUsers().filter(u => u.role === 'student');
    const allGrades = getGrades();
    const allAttendance = getAttendance();

    // Calculate overall attendance percentage
    const totalPresent = allAttendance.filter(a => a.present).length;
    const overallAttendance = allAttendance.length > 0 ? Math.round((totalPresent / allAttendance.length) * 100) : 0;

    // Calculate average grade
    const avgGrade = allGrades.length > 0 ? Math.round(allGrades.reduce((sum, g) => sum + g.grade, 0) / allGrades.length) : 0;

    container.innerHTML = `
        <div class="cards-grid">
            <div class="stat-card" data-testid="card-total-courses">
                <div class="stat-header">
                    <div>
                        <div class="stat-value">${allCourses.length}</div>
                        <div class="stat-label">Total Courses</div>
                    </div>
                    <div class="stat-icon">
                        <i class="fas fa-book"></i>
                    </div>
                </div>
            </div>
            <div class="stat-card" data-testid="card-total-students">
                <div class="stat-header">
                    <div>
                        <div class="stat-value">${allStudents.length}</div>
                        <div class="stat-label">Total Students</div>
                    </div>
                    <div class="stat-icon">
                        <i class="fas fa-users"></i>
                    </div>
                </div>
            </div>
            <div class="stat-card" data-testid="card-overall-attendance">
                <div class="stat-header">
                    <div>
                        <div class="stat-value">${overallAttendance}%</div>
                        <div class="stat-label">Overall Attendance</div>
                    </div>
                    <div class="stat-icon">
                        <i class="fas fa-calendar-check"></i>
                    </div>
                </div>
            </div>
            <div class="stat-card" data-testid="card-average-grade">
                <div class="stat-header">
                    <div>
                        <div class="stat-value">${avgGrade}%</div>
                        <div class="stat-label">Average Grade</div>
                    </div>
                    <div class="stat-icon">
                        <i class="fas fa-chart-line"></i>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="chart-container">
            <div class="table-title" style="margin-bottom: 15px;">Course Attendance Overview</div>
            <canvas id="attendance-chart"></canvas>
        </div>
        
        <div class="chart-container">
            <div class="table-title" style="margin-bottom: 15px;">Course Grade Average</div>
            <canvas id="grade-chart"></canvas>
        </div>
        
        <div class="table-container">
            <div class="table-header">
                <div class="table-title">Detailed Student Performance</div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Student</th>
                        <th>Roll</th>
                        <th>Courses</th>
                        <th>Attendance</th>
                        <th>Avg Grade</th>
                    </tr>
                </thead>
                <tbody>
                    ${allStudents.map(student => {
                        const studentCourses = allCourses.filter(c => c.students.includes(student.id));
                        const studentAttendance = allAttendance.filter(a => a.studentId === student.id);
                        const studentGrades = allGrades.filter(g => g.studentId === student.id);
                        const present = studentAttendance.filter(a => a.present).length;
                        const attPercent = studentAttendance.length > 0 ? Math.round((present / studentAttendance.length) * 100) : 0;
                        const gradeAvg = studentGrades.length > 0 ? Math.round(studentGrades.reduce((sum, g) => sum + g.grade, 0) / studentGrades.length) : 0;

                        return `
                        <tr>
                            <td>${student.name}</td>
                            <td>${student.roll || 'N/A'}</td>
                            <td>${studentCourses.length}</td>
                            <td>
                                <span class="status-badge ${attPercent >= 75 ? 'status-active' : attPercent >= 50 ? 'status-pending' : 'status-closed'}">
                                    ${attPercent}%
                                </span>
                            </td>
                            <td>
                                <span class="grade-badge ${gradeAvg >= 90 ? 'grade-a' : gradeAvg >= 80 ? 'grade-b' : gradeAvg >= 70 ? 'grade-c' : gradeAvg >= 60 ? 'grade-d' : 'grade-f'}">
                                    ${gradeAvg}%
                                </span>
                            </td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;

    // Render charts
    setTimeout(() => {
        // Attendance Chart
        const attCtx = document.getElementById('attendance-chart');
        if (attCtx) {
            const labels = allCourses.map(c => c.name);
            const attendanceData = allCourses.map(course => {
                const courseAtt = allAttendance.filter(a => a.courseId === course.id);
                const present = courseAtt.filter(a => a.present).length;
                return courseAtt.length > 0 ? Math.round((present / courseAtt.length) * 100) : 0;
            });

            new Chart(attCtx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Attendance %',
                        data: attendanceData,
                        backgroundColor: 'rgba(16, 185, 129, 0.5)',
                        borderColor: 'rgba(16, 185, 129, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                        },
                        x: {
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                        }
                    },
                    plugins: {
                        legend: { labels: { color: 'rgba(255, 255, 255, 0.7)' } }
                    }
                }
            });
        }

        // Grade Chart
        const gradeCtx = document.getElementById('grade-chart');
        if (gradeCtx) {
            const labels = allCourses.map(c => c.name);
            const gradeData = allCourses.map(course => {
                const courseGrades = allGrades.filter(g => g.courseId === course.id);
                return courseGrades.length > 0 ? Math.round(courseGrades.reduce((sum, g) => sum + g.grade, 0) / courseGrades.length) : 0;
            });

            new Chart(gradeCtx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Average Grade %',
                        data: gradeData,
                        backgroundColor: 'rgba(45, 212, 191, 0.2)',
                        borderColor: 'rgba(45, 212, 191, 1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                        },
                        x: {
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                        }
                    },
                    plugins: {
                        legend: { labels: { color: 'rgba(255, 255, 255, 0.7)' } }
                    }
                }
            });
        }
    }, 100);

    // Add PDF report buttons
    const attendanceReportBtn = document.createElement('button');
    attendanceReportBtn.className = 'btn btn-outline';
    attendanceReportBtn.innerHTML = '<i class="fas fa-file-pdf"></i> Attendance Report';
    attendanceReportBtn.setAttribute('data-testid', 'button-attendance-report');
    attendanceReportBtn.onclick = () => generateAttendanceReport();
    actions.appendChild(attendanceReportBtn);

    const gradeReportBtn = document.createElement('button');
    gradeReportBtn.className = 'btn btn-outline';
    gradeReportBtn.innerHTML = '<i class="fas fa-file-pdf"></i> Grade Report';
    gradeReportBtn.setAttribute('data-testid', 'button-grade-report');
    gradeReportBtn.onclick = () => generateGradeReport();
    actions.appendChild(gradeReportBtn);

    const fullReportBtn = document.createElement('button');
    fullReportBtn.className = 'btn btn-primary';
    fullReportBtn.innerHTML = '<i class="fas fa-file-pdf"></i> Full Report';
    fullReportBtn.setAttribute('data-testid', 'button-full-report');
    fullReportBtn.onclick = () => generateFullReport();
    actions.appendChild(fullReportBtn);
}

window.generateAttendanceReport = function() {
    const allCourses = getCourses();
    const allStudents = getUsers().filter(u => u.role === 'student');
    const allAttendance = getAttendance();

    let studentsHTML = '';
    allStudents.forEach(student => {
        const studentAttendance = allAttendance.filter(a => a.studentId === student.id);
        const present = studentAttendance.filter(a => a.present).length;
        const percentage = studentAttendance.length > 0 ? Math.round((present / studentAttendance.length) * 100) : 0;
        studentsHTML += `
            <tr>
                <td style="padding: 12px 15px; border: 1px solid #ddd;">${student.name}</td>
                <td style="padding: 12px 15px; border: 1px solid #ddd;">${student.roll || 'N/A'}</td>
                <td style="padding: 12px 15px; border: 1px solid #ddd;">${present}/${studentAttendance.length}</td>
                <td style="padding: 12px 15px; border: 1px solid #ddd;">${percentage}%</td>
            </tr>
        `;
    });

    const reportHTML = `
        <div style="background: white; color: #333; padding: 30px; font-family: Arial, sans-serif;">
            <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2dd4bf; padding-bottom: 20px;">
                <h1 style="font-size: 28px; margin-bottom: 10px; color: #0d2329;">Attendance Report</h1>
                <p style="color: #666; font-size: 16px;">Campus Portal - Generated on ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div style="margin-bottom: 25px;">
                <h2 style="font-size: 20px; margin-bottom: 15px; color: #0d2329;">Student Attendance Summary</h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <th style="padding: 12px 15px; border: 1px solid #ddd; background-color: #f5f5f5; text-align: left;">Student</th>
                        <th style="padding: 12px 15px; border: 1px solid #ddd; background-color: #f5f5f5; text-align: left;">Roll</th>
                        <th style="padding: 12px 15px; border: 1px solid #ddd; background-color: #f5f5f5; text-align: left;">Classes</th>
                        <th style="padding: 12px 15px; border: 1px solid #ddd; background-color: #f5f5f5; text-align: left;">Percentage</th>
                    </tr>
                    ${studentsHTML}
                </table>
            </div>
        </div>
    `;

    const element = document.createElement('div');
    element.innerHTML = reportHTML;
    html2pdf().from(element).save('attendance-report.pdf');
};

window.generateGradeReport = function() {
    const allCourses = getCourses();
    const allStudents = getUsers().filter(u => u.role === 'student');
    const allGrades = getGrades();

    let studentsHTML = '';
    allStudents.forEach(student => {
        const studentGrades = allGrades.filter(g => g.studentId === student.id);
        const avgGrade = studentGrades.length > 0 ? Math.round(studentGrades.reduce((sum, g) => sum + g.grade, 0) / studentGrades.length) : 0;
        studentsHTML += `
            <tr>
                <td style="padding: 12px 15px; border: 1px solid #ddd;">${student.name}</td>
                <td style="padding: 12px 15px; border: 1px solid #ddd;">${student.roll || 'N/A'}</td>
                <td style="padding: 12px 15px; border: 1px solid #ddd;">${studentGrades.length}</td>
                <td style="padding: 12px 15px; border: 1px solid #ddd;">${avgGrade}%</td>
            </tr>
        `;
    });

    const reportHTML = `
        <div style="background: white; color: #333; padding: 30px; font-family: Arial, sans-serif;">
            <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2dd4bf; padding-bottom: 20px;">
                <h1 style="font-size: 28px; margin-bottom: 10px; color: #0d2329;">Grade Report</h1>
                <p style="color: #666; font-size: 16px;">Campus Portal - Generated on ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div style="margin-bottom: 25px;">
                <h2 style="font-size: 20px; margin-bottom: 15px; color: #0d2329;">Student Grade Summary</h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <th style="padding: 12px 15px; border: 1px solid #ddd; background-color: #f5f5f5; text-align: left;">Student</th>
                        <th style="padding: 12px 15px; border: 1px solid #ddd; background-color: #f5f5f5; text-align: left;">Roll</th>
                        <th style="padding: 12px 15px; border: 1px solid #ddd; background-color: #f5f5f5; text-align: left;">Assessments</th>
                        <th style="padding: 12px 15px; border: 1px solid #ddd; background-color: #f5f5f5; text-align: left;">Average</th>
                    </tr>
                    ${studentsHTML}
                </table>
            </div>
        </div>
    `;

    const element = document.createElement('div');
    element.innerHTML = reportHTML;
    html2pdf().from(element).save('grade-report.pdf');
};

window.generateFullReport = function() {
    const allCourses = getCourses();
    const allStudents = getUsers().filter(u => u.role === 'student');
    const allTeachers = getUsers().filter(u => u.role === 'teacher');
    const allGrades = getGrades();
    const allAttendance = getAttendance();

    let coursesHTML = '';
    allCourses.forEach(course => {
        const teacher = getUsers().find(u => u.id === course.teacherId);
        coursesHTML += `
            <tr>
                <td style="padding: 12px 15px; border: 1px solid #ddd;">${course.name}</td>
                <td style="padding: 12px 15px; border: 1px solid #ddd;">${teacher ? teacher.name : 'Not Assigned'}</td>
                <td style="padding: 12px 15px; border: 1px solid #ddd;">${course.students.length}</td>
            </tr>
        `;
    });

    let studentsHTML = '';
    allStudents.forEach(student => {
        const studentCourses = allCourses.filter(c => c.students.includes(student.id));
        const studentAttendance = allAttendance.filter(a => a.studentId === student.id);
        const studentGrades = allGrades.filter(g => g.studentId === student.id);
        const present = studentAttendance.filter(a => a.present).length;
        const attPercent = studentAttendance.length > 0 ? Math.round((present / studentAttendance.length) * 100) : 0;
        const avgGrade = studentGrades.length > 0 ? Math.round(studentGrades.reduce((sum, g) => sum + g.grade, 0) / studentGrades.length) : 0;
        
        studentsHTML += `
            <tr>
                <td style="padding: 12px 15px; border: 1px solid #ddd;">${student.name}</td>
                <td style="padding: 12px 15px; border: 1px solid #ddd;">${student.roll || 'N/A'}</td>
                <td style="padding: 12px 15px; border: 1px solid #ddd;">${studentCourses.length}</td>
                <td style="padding: 12px 15px; border: 1px solid #ddd;">${attPercent}%</td>
                <td style="padding: 12px 15px; border: 1px solid #ddd;">${avgGrade}%</td>
            </tr>
        `;
    });

    const reportHTML = `
        <div style="background: white; color: #333; padding: 30px; font-family: Arial, sans-serif;">
            <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2dd4bf; padding-bottom: 20px;">
                <h1 style="font-size: 28px; margin-bottom: 10px; color: #0d2329;">Campus Portal Performance Report</h1>
                <p style="color: #666; font-size: 16px;">Generated on ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div style="margin-bottom: 25px;">
                <h2 style="font-size: 20px; margin-bottom: 15px; color: #0d2329;">System Overview</h2>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <tr>
                        <th style="padding: 12px 15px; border: 1px solid #ddd; background-color: #f5f5f5; text-align: left;">Metric</th>
                        <th style="padding: 12px 15px; border: 1px solid #ddd; background-color: #f5f5f5; text-align: left;">Value</th>
                    </tr>
                    <tr>
                        <td style="padding: 12px 15px; border: 1px solid #ddd;">Total Students</td>
                        <td style="padding: 12px 15px; border: 1px solid #ddd;">${allStudents.length}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 15px; border: 1px solid #ddd;">Total Teachers</td>
                        <td style="padding: 12px 15px; border: 1px solid #ddd;">${allTeachers.length}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 15px; border: 1px solid #ddd;">Total Courses</td>
                        <td style="padding: 12px 15px; border: 1px solid #ddd;">${allCourses.length}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 15px; border: 1px solid #ddd;">Total Attendance Records</td>
                        <td style="padding: 12px 15px; border: 1px solid #ddd;">${allAttendance.length}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 15px; border: 1px solid #ddd;">Total Grades Recorded</td>
                        <td style="padding: 12px 15px; border: 1px solid #ddd;">${allGrades.length}</td>
                    </tr>
                </table>
            </div>
            
            <div style="margin-bottom: 25px;">
                <h2 style="font-size: 20px; margin-bottom: 15px; color: #0d2329;">Course Details</h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <th style="padding: 12px 15px; border: 1px solid #ddd; background-color: #f5f5f5; text-align: left;">Course</th>
                        <th style="padding: 12px 15px; border: 1px solid #ddd; background-color: #f5f5f5; text-align: left;">Teacher</th>
                        <th style="padding: 12px 15px; border: 1px solid #ddd; background-color: #f5f5f5; text-align: left;">Students</th>
                    </tr>
                    ${coursesHTML}
                </table>
            </div>
            
            <div style="margin-bottom: 25px;">
                <h2 style="font-size: 20px; margin-bottom: 15px; color: #0d2329;">Student Performance</h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <th style="padding: 12px 15px; border: 1px solid #ddd; background-color: #f5f5f5; text-align: left;">Student</th>
                        <th style="padding: 12px 15px; border: 1px solid #ddd; background-color: #f5f5f5; text-align: left;">Roll</th>
                        <th style="padding: 12px 15px; border: 1px solid #ddd; background-color: #f5f5f5; text-align: left;">Courses</th>
                        <th style="padding: 12px 15px; border: 1px solid #ddd; background-color: #f5f5f5; text-align: left;">Attendance</th>
                        <th style="padding: 12px 15px; border: 1px solid #ddd; background-color: #f5f5f5; text-align: left;">Avg Grade</th>
                    </tr>
                    ${studentsHTML}
                </table>
            </div>
        </div>
    `;

    const element = document.createElement('div');
    element.innerHTML = reportHTML;
    html2pdf().from(element).save('campus-portal-full-report.pdf');
};

// ========== Admin: Complaint Management ==========
function renderComplaintManagement(container, actions) {
    const allComplaints = getComplaints();
    const openComplaints = allComplaints.filter(c => c.status === 'open');
    const resolvedComplaints = allComplaints.filter(c => c.status === 'resolved');

    container.innerHTML = `
        <div class="cards-grid">
            <div class="stat-card" data-testid="card-open-complaints">
                <div class="stat-header">
                    <div>
                        <div class="stat-value">${openComplaints.length}</div>
                        <div class="stat-label">Open Complaints</div>
                    </div>
                    <div class="stat-icon" style="background: linear-gradient(135deg, var(--warn), #d97706);">
                        <i class="fas fa-exclamation-circle"></i>
                    </div>
                </div>
            </div>
            <div class="stat-card" data-testid="card-resolved-complaints">
                <div class="stat-header">
                    <div>
                        <div class="stat-value">${resolvedComplaints.length}</div>
                        <div class="stat-label">Resolved Complaints</div>
                    </div>
                    <div class="stat-icon" style="background: linear-gradient(135deg, var(--ok), #059669);">
                        <i class="fas fa-check-circle"></i>
                    </div>
                </div>
            </div>
            <div class="stat-card" data-testid="card-total-complaints">
                <div class="stat-header">
                    <div>
                        <div class="stat-value">${allComplaints.length}</div>
                        <div class="stat-label">Total Complaints</div>
                    </div>
                    <div class="stat-icon">
                        <i class="fas fa-gavel"></i>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="table-container">
            <div class="table-header">
                <div class="table-title">All Complaints</div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Subject</th>
                        <th>From</th>
                        <th>Against</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${allComplaints.map(complaint => {
                        const student = getUsers().find(u => u.id === complaint.studentId);
                        const againstUser = getUsers().find(u => u.id === complaint.against);
                        return `
                        <tr data-testid="row-complaint-${complaint.id}">
                            <td>${complaint.subject}</td>
                            <td>${student ? student.name : 'Unknown'}</td>
                            <td>${againstUser ? againstUser.name : 'Other'}</td>
                            <td>${formatDate(complaint.createdAt)}</td>
                            <td>
                                <span class="status-badge ${complaint.status === 'open' ? 'status-pending' : 'status-active'}">
                                    ${complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
                                </span>
                            </td>
                            <td>
                                <button class="btn btn-outline" onclick="respondToComplaint('${complaint.id}')" data-testid="button-respond-complaint-${complaint.id}">
                                    ${complaint.status === 'open' ? 'Respond' : 'View'}
                                </button>
                            </td>
                        </tr>
                        `;
                    }).join('')}
                    ${allComplaints.length === 0 ? `
                        <tr><td colspan="6" style="text-align: center; color: var(--muted);">No complaints</td></tr>
                    ` : ''}
                </tbody>
            </table>
        </div>
    `;
}

window.respondToComplaint = function(complaintId) {
    const complaint = getComplaints().find(c => c.id === complaintId);
    if (!complaint) return;

    const student = getUsers().find(u => u.id === complaint.studentId);
    const againstUser = getUsers().find(u => u.id === complaint.against);

    const content = `
        <div class="form-group">
            <label class="form-label">Subject</label>
            <input type="text" class="form-input" value="${complaint.subject}" readonly>
        </div>
        <div class="form-group">
            <label class="form-label">From</label>
            <input type="text" class="form-input" value="${student ? student.name : 'Unknown'}" readonly>
        </div>
        <div class="form-group">
            <label class="form-label">Against</label>
            <input type="text" class="form-input" value="${againstUser ? againstUser.name : 'Other'}" readonly>
        </div>
        <div class="form-group">
            <label class="form-label">Complaint Details</label>
            <textarea class="form-input" rows="4" readonly>${complaint.message}</textarea>
        </div>
        ${complaint.status === 'open' ? `
        <div class="form-group">
            <label class="form-label">Your Response</label>
            <textarea class="form-input" id="complaint-response" rows="4" placeholder="Enter your response to resolve this complaint" data-testid="input-complaint-response"></textarea>
        </div>
        <div class="modal-actions">
            <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="saveComplaintResponse('${complaintId}')" data-testid="button-save-complaint-response">Resolve Complaint</button>
        </div>
        ` : `
        <div class="form-group">
            <label class="form-label">Response</label>
            <textarea class="form-input" rows="4" readonly>${complaint.response || 'No response'}</textarea>
        </div>
        <div class="modal-actions">
            <button class="btn btn-outline" onclick="closeModal()">Close</button>
        </div>
        `}
    `;

    showModal(complaint.status === 'open' ? 'Respond to Complaint' : 'View Complaint', content);
};

window.saveComplaintResponse = function(complaintId) {
    const response = $('complaint-response').value.trim();

    if (!response) {
        alert('Please enter a response');
        return;
    }

    const complaints = getComplaints();
    const complaintIndex = complaints.findIndex(c => c.id === complaintId);

    if (complaintIndex !== -1) {
        complaints[complaintIndex].response = response;
        complaints[complaintIndex].status = 'resolved';
        complaints[complaintIndex].adminId = currentUser.id;
        putComplaints(complaints);
        alert('Complaint resolved successfully!');
        closeModal();
        loadContent('complaint-management');
    }
};
