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
function putQueries(v) { saveLS('queries', v) }
function putComplaints(v) { saveLS('complaints', v) }

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
    if (currentUser.role !== 'student') {
        window.location.href = 'teacher.html';
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

// Make closeModal globally accessible
window.closeModal = closeModal;

// ========== Main Render ==========
function renderApp() {
    if (!currentUser) return;

    $('user-name').textContent = currentUser.name;
    $('user-role').textContent = 'Student';
    $('user-avatar').textContent = currentUser.name.charAt(0).toUpperCase();

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
        case 'courses':
            contentTitle.innerHTML = '<h2>My Courses</h2><p>View your enrolled courses</p>';
            renderCourses(contentArea, contentActions);
            break;
        case 'attendance':
            contentTitle.innerHTML = '<h2>Attendance</h2><p>Track your attendance records</p>';
            renderAttendance(contentArea, contentActions);
            break;
        case 'grades':
            contentTitle.innerHTML = '<h2>Grades</h2><p>View your academic performance</p>';
            renderGrades(contentArea, contentActions);
            break;
        case 'queries':
            contentTitle.innerHTML = '<h2>Queries</h2><p>Submit and track your queries</p>';
            renderQueries(contentArea, contentActions);
            break;
        case 'complaints':
            contentTitle.innerHTML = '<h2>Complaints</h2><p>Submit and track your complaints</p>';
            renderComplaints(contentArea, contentActions);
            break;
        default:
            contentArea.innerHTML = '<p>Content not found</p>';
    }
}

// ========== Dashboard ==========
function renderDashboard(container, actions) {
    const userCourses = getCourses().filter(c => c.students.includes(currentUser.id));
    const userAttendance = getAttendance().filter(a => a.studentId === currentUser.id);
    const userGrades = getGrades().filter(g => g.studentId === currentUser.id);
    const userQueries = getQueries().filter(q => q.studentId === currentUser.id);
    const userComplaints = getComplaints().filter(c => c.studentId === currentUser.id);

    const presentCount = userAttendance.filter(a => a.present).length;
    const totalAttendance = userAttendance.length;
    const attendancePercent = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

    const avgGrade = userGrades.length > 0
        ? Math.round(userGrades.reduce((sum, g) => sum + g.grade, 0) / userGrades.length)
        : 0;

    container.innerHTML = `
        <div class="cards-grid">
            <div class="stat-card" data-testid="card-enrolled-courses">
                <div class="stat-header">
                    <div>
                        <div class="stat-value">${userCourses.length}</div>
                        <div class="stat-label">Enrolled Courses</div>
                    </div>
                    <div class="stat-icon">
                        <i class="fas fa-book"></i>
                    </div>
                </div>
            </div>
            <div class="stat-card" data-testid="card-attendance">
                <div class="stat-header">
                    <div>
                        <div class="stat-value">${attendancePercent}%</div>
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
            <div class="stat-card" data-testid="card-open-queries">
                <div class="stat-header">
                    <div>
                        <div class="stat-value">${userQueries.filter(q => q.status === 'open').length}</div>
                        <div class="stat-label">Open Queries</div>
                    </div>
                    <div class="stat-icon">
                        <i class="fas fa-question-circle"></i>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="table-container">
            <div class="table-header">
                <div class="table-title">Recent Activity</div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Type</th>
                        <th>Description</th>
                        <th>Date</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${userQueries.slice(0, 3).map(q => `
                        <tr>
                            <td>Query</td>
                            <td>${q.subject}</td>
                            <td>${formatDate(q.createdAt)}</td>
                            <td><span class="status-badge ${q.status === 'open' ? 'status-pending' : 'status-active'}">${q.status}</span></td>
                        </tr>
                    `).join('')}
                    ${userComplaints.slice(0, 2).map(c => `
                        <tr>
                            <td>Complaint</td>
                            <td>${c.subject}</td>
                            <td>${formatDate(c.createdAt)}</td>
                            <td><span class="status-badge ${c.status === 'open' ? 'status-pending' : 'status-active'}">${c.status}</span></td>
                        </tr>
                    `).join('')}
                    ${(userQueries.length === 0 && userComplaints.length === 0) ? `
                        <tr><td colspan="4" style="text-align: center; color: var(--muted);">No recent activity</td></tr>
                    ` : ''}
                </tbody>
            </table>
        </div>
    `;
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
                    <div class="profile-detail-value">Student</div>
                </div>
                <div class="profile-detail">
                    <div class="profile-detail-label">Roll Number</div>
                    <div class="profile-detail-value">${currentUser.roll || 'N/A'}</div>
                </div>
                <div class="profile-detail">
                    <div class="profile-detail-label">Email</div>
                    <div class="profile-detail-value">${currentUser.email}</div>
                </div>
                <div class="profile-detail">
                    <div class="profile-detail-label">Enrolled Courses</div>
                    <div class="profile-detail-value">${getCourses().filter(c => c.students.includes(currentUser.id)).length}</div>
                </div>
            </div>
        </div>
    `;
}

// ========== Courses ==========
function renderCourses(container, actions) {
    const userCourses = getCourses().filter(c => c.students.includes(currentUser.id));

    container.innerHTML = `
        <div class="cards-grid">
            ${userCourses.map(course => {
                const teacher = getUsers().find(u => u.id === course.teacherId);
                return `
                <div class="stat-card" data-testid="card-course-${course.id}">
                    <div class="stat-header">
                        <div>
                            <div class="stat-value">${course.name}</div>
                            <div class="stat-label">${teacher ? teacher.name : 'No Teacher'}</div>
                        </div>
                        <div class="stat-icon">
                            <i class="fas fa-book-open"></i>
                        </div>
                    </div>
                    <div style="margin-top: 15px;">
                        <div class="btn btn-outline" style="width: 100%;" onclick="viewCourseDetails('${course.id}')" data-testid="button-view-course-${course.id}">View Details</div>
                    </div>
                </div>
                `;
            }).join('')}
        </div>
        
        ${userCourses.length === 0 ? `
        <div class="table-container">
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-book" style="font-size: 48px; color: var(--muted); margin-bottom: 15px;"></i>
                <h3 style="color: var(--text-light); margin-bottom: 10px;">No Courses Found</h3>
                <p style="color: var(--muted);">You are not enrolled in any courses yet.</p>
            </div>
        </div>
        ` : ''}
    `;
}

window.viewCourseDetails = function(courseId) {
    const course = getCourses().find(c => c.id === courseId);
    if (!course) return;

    const teacher = getUsers().find(u => u.id === course.teacherId);
    const courseGrades = getGrades().filter(g => g.studentId === currentUser.id && g.courseId === courseId);
    const courseAttendance = getAttendance().filter(a => a.studentId === currentUser.id && a.courseId === courseId);
    const presentCount = courseAttendance.filter(a => a.present).length;
    const attendancePercent = courseAttendance.length > 0 ? Math.round((presentCount / courseAttendance.length) * 100) : 0;

    const content = `
        <div class="form-group">
            <label class="form-label">Course Name</label>
            <input type="text" class="form-input" value="${course.name}" readonly>
        </div>
        <div class="form-group">
            <label class="form-label">Instructor</label>
            <input type="text" class="form-input" value="${teacher ? teacher.name : 'N/A'}" readonly>
        </div>
        <div class="form-group">
            <label class="form-label">Your Attendance</label>
            <input type="text" class="form-input" value="${attendancePercent}% (${presentCount}/${courseAttendance.length} classes)" readonly>
        </div>
        <div class="form-group">
            <label class="form-label">Grades</label>
            ${courseGrades.length > 0 ? `
                <table style="width: 100%;">
                    <thead>
                        <tr>
                            <th>Assessment</th>
                            <th>Grade</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${courseGrades.map(g => `
                            <tr>
                                <td>${g.assessmentType || 'General'}</td>
                                <td>${g.grade}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : '<p style="color: var(--muted);">No grades recorded yet.</p>'}
        </div>
        <div class="modal-actions">
            <button class="btn btn-outline" onclick="closeModal()">Close</button>
        </div>
    `;

    showModal('Course Details', content);
};

// ========== Attendance ==========
function renderAttendance(container, actions) {
    const userAttendance = getAttendance().filter(a => a.studentId === currentUser.id);
    const courses = getCourses().filter(c => c.students.includes(currentUser.id));

    let attendanceHTML = '';

    courses.forEach(course => {
        const courseAttendance = userAttendance.filter(a => a.courseId === course.id);
        const presentCount = courseAttendance.filter(a => a.present).length;
        const totalCount = courseAttendance.length;
        const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

        attendanceHTML += `
            <div class="stat-card" data-testid="card-attendance-${course.id}">
                <div class="stat-header">
                    <div>
                        <div class="stat-value">${percentage}%</div>
                        <div class="stat-label">${course.name}</div>
                    </div>
                    <div class="stat-icon">
                        <i class="fas fa-calendar-check"></i>
                    </div>
                </div>
                <div style="margin-top: 10px; font-size: 14px; color: var(--muted);">
                    ${presentCount} of ${totalCount} classes attended
                </div>
            </div>
        `;
    });

    container.innerHTML = `
        <div class="cards-grid">
            ${attendanceHTML}
        </div>
        
        ${courses.length === 0 ? `
        <div class="table-container">
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-calendar-times" style="font-size: 48px; color: var(--muted); margin-bottom: 15px;"></i>
                <h3 style="color: var(--text-light); margin-bottom: 10px;">No Attendance Records</h3>
                <p style="color: var(--muted);">You are not enrolled in any courses yet.</p>
            </div>
        </div>
        ` : ''}
    `;
}

// ========== Grades ==========
function renderGrades(container, actions) {
    const userGrades = getGrades().filter(g => g.studentId === currentUser.id);
    const courses = getCourses().filter(c => c.students.includes(currentUser.id));

    let finalGradesHTML = '';

    courses.forEach(course => {
        const courseGrades = userGrades.filter(g => g.courseId === course.id);
        const courseSettings = getCourseSettings().find(cs => cs.courseId === course.id);

        if (courseGrades.length > 0) {
            let weightedSum = 0;
            let totalWeight = 0;

            courseGrades.forEach(grade => {
                const weight = courseSettings ?
                    (courseSettings.assessmentWeights[grade.assessmentType] || 0) :
                    grade.weightage || 0;
                weightedSum += grade.grade * (weight / 100);
                totalWeight += weight;
            });

            const finalGrade = totalWeight > 0 ? Math.round(weightedSum * 100 / totalWeight) : 0;

            let letterGrade = 'N/A';
            let gradeClass = '';
            if (courseSettings && courseSettings.gradeScale) {
                if (finalGrade >= courseSettings.gradeScale.A) {
                    letterGrade = 'A';
                    gradeClass = 'grade-a';
                } else if (finalGrade >= courseSettings.gradeScale.B) {
                    letterGrade = 'B';
                    gradeClass = 'grade-b';
                } else if (finalGrade >= courseSettings.gradeScale.C) {
                    letterGrade = 'C';
                    gradeClass = 'grade-c';
                } else if (finalGrade >= courseSettings.gradeScale.D) {
                    letterGrade = 'D';
                    gradeClass = 'grade-d';
                } else {
                    letterGrade = 'F';
                    gradeClass = 'grade-f';
                }
            }

            finalGradesHTML += `
                <div class="stat-card" data-testid="card-grade-${course.id}">
                    <div class="stat-header">
                        <div>
                            <div class="stat-value">${finalGrade}%</div>
                            <div class="stat-label">${course.name}</div>
                        </div>
                        <div class="stat-icon">
                            <i class="fas fa-chart-line"></i>
                        </div>
                    </div>
                    <div style="margin-top: 10px; display: flex; justify-content: space-between; align-items: center;">
                        <span class="grade-badge ${gradeClass}">${letterGrade}</span>
                        <span style="font-size: 14px; color: var(--muted);">Final Grade</span>
                    </div>
                </div>
            `;
        }
    });

    container.innerHTML = `
        ${finalGradesHTML ? `
        <div class="table-container">
            <div class="table-header">
                <div class="table-title">Final Grades</div>
            </div>
            <div class="cards-grid">
                ${finalGradesHTML}
            </div>
        </div>
        ` : ''}
        
        <div class="table-container">
            <div class="table-header">
                <div class="table-title">Detailed Grades</div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Course</th>
                        <th>Assessment</th>
                        <th>Type</th>
                        <th>Grade</th>
                        <th>Weight</th>
                    </tr>
                </thead>
                <tbody>
                    ${userGrades.map(grade => {
                        const course = getCourses().find(c => c.id === grade.courseId);
                        return `
                        <tr>
                            <td>${course ? course.name : 'Unknown Course'}</td>
                            <td>${grade.assessmentType ? grade.assessmentType.charAt(0).toUpperCase() + grade.assessmentType.slice(1) : 'Assignment'}</td>
                            <td>${grade.assessmentType || 'General'}</td>
                            <td>${grade.grade}%</td>
                            <td>${grade.weightage || 0}%</td>
                        </tr>
                        `;
                    }).join('')}
                    
                    ${userGrades.length === 0 ? `
                    <tr>
                        <td colspan="5" style="text-align: center; padding: 30px; color: var(--muted);">
                            No grades recorded yet.
                        </td>
                    </tr>
                    ` : ''}
                </tbody>
            </table>
        </div>
    `;
}

// ========== Queries ==========
function renderQueries(container, actions) {
    const userQueries = getQueries().filter(q => q.studentId === currentUser.id && q.type === 'query');

    container.innerHTML = `
        <div class="table-container">
            <div class="table-header">
                <div class="table-title">My Queries</div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Subject</th>
                        <th>Course</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${userQueries.map(query => {
                        const course = getCourses().find(c => c.id === query.courseId);
                        return `
                        <tr data-testid="row-query-${query.id}">
                            <td>${query.subject}</td>
                            <td>${course ? course.name : 'N/A'}</td>
                            <td>${formatDate(query.createdAt)}</td>
                            <td>
                                <span class="status-badge ${query.status === 'open' ? 'status-pending' : query.status === 'resolved' ? 'status-active' : 'status-closed'}">
                                    ${query.status.charAt(0).toUpperCase() + query.status.slice(1)}
                                </span>
                            </td>
                            <td>
                                <button class="btn btn-outline" onclick="viewQuery('${query.id}')" data-testid="button-view-query-${query.id}">View</button>
                            </td>
                        </tr>
                        `;
                    }).join('')}
                    
                    ${userQueries.length === 0 ? `
                    <tr>
                        <td colspan="5" style="text-align: center; padding: 30px; color: var(--muted);">
                            No queries submitted yet.
                        </td>
                    </tr>
                    ` : ''}
                </tbody>
            </table>
        </div>
    `;

    const addQueryBtn = document.createElement('button');
    addQueryBtn.className = 'btn btn-primary';
    addQueryBtn.innerHTML = '<i class="fas fa-plus"></i> New Query';
    addQueryBtn.setAttribute('data-testid', 'button-new-query');
    addQueryBtn.onclick = () => showNewQueryModal();
    actions.appendChild(addQueryBtn);
}

function showNewQueryModal() {
    const userCourses = getCourses().filter(c => c.students.includes(currentUser.id));

    const content = `
        <div class="form-group">
            <label class="form-label">Course</label>
            <select class="form-select" id="query-course" data-testid="select-query-course">
                <option value="">Select a course</option>
                ${userCourses.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
            </select>
        </div>
        <div class="form-group">
            <label class="form-label">Subject</label>
            <input type="text" class="form-input" id="query-subject" placeholder="Enter query subject" data-testid="input-query-subject">
        </div>
        <div class="form-group">
            <label class="form-label">Message</label>
            <textarea class="form-input" id="query-message" rows="4" placeholder="Enter your query details" data-testid="input-query-message"></textarea>
        </div>
        <div class="modal-actions">
            <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="submitQuery()" data-testid="button-submit-query">Submit Query</button>
        </div>
    `;

    showModal('New Query', content);
}

window.submitQuery = function() {
    const courseId = $('query-course').value;
    const subject = $('query-subject').value.trim();
    const message = $('query-message').value.trim();

    if (!courseId || !subject || !message) {
        alert('Please fill in all fields');
        return;
    }

    const queries = getQueries();
    queries.push({
        id: uid('q'),
        studentId: currentUser.id,
        courseId: courseId,
        subject: subject,
        message: message,
        createdAt: now(),
        status: 'open',
        teacherId: null,
        response: null,
        type: 'query'
    });
    putQueries(queries);

    alert('Query submitted successfully!');
    closeModal();
    loadContent('queries');
};

window.viewQuery = function(queryId) {
    const query = getQueries().find(q => q.id === queryId);
    if (!query) return;

    const course = getCourses().find(c => c.id === query.courseId);
    const teacher = query.teacherId ? getUsers().find(u => u.id === query.teacherId) : null;

    const content = `
        <div class="form-group">
            <label class="form-label">Course</label>
            <input type="text" class="form-input" value="${course ? course.name : 'N/A'}" readonly>
        </div>
        <div class="form-group">
            <label class="form-label">Subject</label>
            <input type="text" class="form-input" value="${query.subject}" readonly>
        </div>
        <div class="form-group">
            <label class="form-label">Message</label>
            <textarea class="form-input" rows="4" readonly>${query.message}</textarea>
        </div>
        <div class="form-group">
            <label class="form-label">Status</label>
            <span class="status-badge ${query.status === 'open' ? 'status-pending' : 'status-active'}">
                ${query.status.charAt(0).toUpperCase() + query.status.slice(1)}
            </span>
        </div>
        ${query.response ? `
        <div class="form-group">
            <label class="form-label">Response from ${teacher ? teacher.name : 'Teacher'}</label>
            <textarea class="form-input" rows="4" readonly>${query.response}</textarea>
        </div>
        ` : ''}
        <div class="modal-actions">
            <button class="btn btn-outline" onclick="closeModal()">Close</button>
        </div>
    `;

    showModal('Query Details', content);
};

// ========== Complaints ==========
function renderComplaints(container, actions) {
    const userComplaints = getComplaints().filter(c => c.studentId === currentUser.id);

    container.innerHTML = `
        <div class="table-container">
            <div class="table-header">
                <div class="table-title">My Complaints</div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Subject</th>
                        <th>Against</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${userComplaints.map(complaint => {
                        const againstUser = complaint.against ? getUsers().find(u => u.id === complaint.against) : null;
                        return `
                        <tr data-testid="row-complaint-${complaint.id}">
                            <td>${complaint.subject}</td>
                            <td>${againstUser ? againstUser.name : 'Other'}</td>
                            <td>${formatDate(complaint.createdAt)}</td>
                            <td>
                                <span class="status-badge ${complaint.status === 'open' ? 'status-pending' : 'status-active'}">
                                    ${complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
                                </span>
                            </td>
                            <td>
                                <button class="btn btn-outline" onclick="viewComplaint('${complaint.id}')" data-testid="button-view-complaint-${complaint.id}">View</button>
                            </td>
                        </tr>
                        `;
                    }).join('')}
                    
                    ${userComplaints.length === 0 ? `
                    <tr>
                        <td colspan="5" style="text-align: center; padding: 30px; color: var(--muted);">
                            No complaints submitted yet.
                        </td>
                    </tr>
                    ` : ''}
                </tbody>
            </table>
        </div>
    `;

    const addComplaintBtn = document.createElement('button');
    addComplaintBtn.className = 'btn btn-primary';
    addComplaintBtn.innerHTML = '<i class="fas fa-plus"></i> New Complaint';
    addComplaintBtn.setAttribute('data-testid', 'button-new-complaint');
    addComplaintBtn.onclick = () => showNewComplaintModal();
    actions.appendChild(addComplaintBtn);
}

function showNewComplaintModal() {
    const teachers = getUsers().filter(u => u.role === 'teacher');

    const content = `
        <div class="form-group">
            <label class="form-label">Against (Optional)</label>
            <select class="form-select" id="complaint-against" data-testid="select-complaint-against">
                <option value="">General/Other</option>
                ${teachers.map(t => `<option value="${t.id}">${t.name} (Teacher)</option>`).join('')}
            </select>
        </div>
        <div class="form-group">
            <label class="form-label">Subject</label>
            <input type="text" class="form-input" id="complaint-subject" placeholder="Enter complaint subject" data-testid="input-complaint-subject">
        </div>
        <div class="form-group">
            <label class="form-label">Details</label>
            <textarea class="form-input" id="complaint-message" rows="4" placeholder="Describe your complaint in detail" data-testid="input-complaint-message"></textarea>
        </div>
        <div class="modal-actions">
            <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="submitComplaint()" data-testid="button-submit-complaint">Submit Complaint</button>
        </div>
    `;

    showModal('New Complaint', content);
}

window.submitComplaint = function() {
    const against = $('complaint-against').value;
    const subject = $('complaint-subject').value.trim();
    const message = $('complaint-message').value.trim();

    if (!subject || !message) {
        alert('Please fill in all required fields');
        return;
    }

    const complaints = getComplaints();
    complaints.push({
        id: uid('c'),
        studentId: currentUser.id,
        subject: subject,
        message: message,
        createdAt: now(),
        status: 'open',
        adminId: null,
        response: null,
        type: 'complaint',
        against: against || null
    });
    putComplaints(complaints);

    alert('Complaint submitted successfully!');
    closeModal();
    loadContent('complaints');
};

window.viewComplaint = function(complaintId) {
    const complaint = getComplaints().find(c => c.id === complaintId);
    if (!complaint) return;

    const againstUser = complaint.against ? getUsers().find(u => u.id === complaint.against) : null;

    const content = `
        <div class="form-group">
            <label class="form-label">Against</label>
            <input type="text" class="form-input" value="${againstUser ? againstUser.name : 'General/Other'}" readonly>
        </div>
        <div class="form-group">
            <label class="form-label">Subject</label>
            <input type="text" class="form-input" value="${complaint.subject}" readonly>
        </div>
        <div class="form-group">
            <label class="form-label">Details</label>
            <textarea class="form-input" rows="4" readonly>${complaint.message}</textarea>
        </div>
        <div class="form-group">
            <label class="form-label">Status</label>
            <span class="status-badge ${complaint.status === 'open' ? 'status-pending' : 'status-active'}">
                ${complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
            </span>
        </div>
        ${complaint.response ? `
        <div class="form-group">
            <label class="form-label">Admin Response</label>
            <textarea class="form-input" rows="4" readonly>${complaint.response}</textarea>
        </div>
        ` : ''}
        <div class="modal-actions">
            <button class="btn btn-outline" onclick="closeModal()">Close</button>
        </div>
    `;

    showModal('Complaint Details', content);
};
