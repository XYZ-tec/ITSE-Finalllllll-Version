// ========== Utilities ==========
const $ = id => document.getElementById(id);
const uid = (p = 'id') => p + '-' + Math.random().toString(36).slice(2, 9);
function saveLS(k, v) { localStorage.setItem(k, JSON.stringify(v)) }
function getLS(k, def) { try { return JSON.parse(localStorage.getItem(k)) || def } catch (e) { return def } }
function now() { return new Date().toISOString() }

// ========== Initial Data Seed ==========
function seed() {
    if (getLS('seeded')) return;
    const users = [
        { id: 'u-admin', name: 'Admin User', email: 'Ahmed@cfd.edu', password: '123', role: 'admin', roll: null, courses: [] },
        { id: 'u-teacher', name: 'Teacher One', email: 'Azka@cfd.edu', password: '456', role: 'teacher', roll: null, courses: [] },
        { id: 'u-student', name: 'Student One', email: 'Misbah@cfd.edu', password: '789', role: 'student', roll: 'ISE001', courses: [] },
        { id: 'u-student2', name: 'Student Two', email: 'Ali@cfd.edu', password: '111', role: 'student', roll: 'ISE002', courses: [] },
    ];
    const courses = [
        { id: 'c-ise101', name: 'ISE 101', teacherId: 'u-teacher', students: ['u-student'] },
        { id: 'c-ds', name: 'Data Structures', teacherId: 'u-teacher', students: ['u-student', 'u-student2'] },
        { id: 'c-pf', name: 'Programming Fundamentals', teacherId: 'u-teacher', students: [] },
        { id: 'c-calc', name: 'Calculus', teacherId: 'u-teacher', students: [] },
        { id: 'c-pfl', name: 'Programming Fundamentals Lab', teacherId: 'u-teacher', students: [] },
    ];
    const attendance = [
        { id: uid('att'), studentId: 'u-student', courseId: 'c-ise101', date: new Date().toISOString(), present: true },
        { id: uid('att'), studentId: 'u-student', courseId: 'c-ise101', date: new Date(Date.now() - 86400000).toISOString(), present: false },
        { id: uid('att'), studentId: 'u-student', courseId: 'c-ise101', date: new Date(Date.now() - 172800000).toISOString(), present: true },
        { id: uid('att'), studentId: 'u-student', courseId: 'c-ds', date: new Date().toISOString(), present: true },
        { id: uid('att'), studentId: 'u-student2', courseId: 'c-ds', date: new Date().toISOString(), present: true },
    ];
    const grades = [
        { id: uid('g'), studentId: 'u-student', courseId: 'c-ise101', grade: 85, assessmentType: 'assignment', weightage: 20 },
        { id: uid('g'), studentId: 'u-student', courseId: 'c-ise101', grade: 92, assessmentType: 'quiz', weightage: 15 },
        { id: uid('g'), studentId: 'u-student', courseId: 'c-ds', grade: 78, assessmentType: 'mid', weightage: 30 },
        { id: uid('g'), studentId: 'u-student2', courseId: 'c-ds', grade: 88, assessmentType: 'mid', weightage: 30 },
    ];
    const queries = [
        { id: uid('q'), studentId: 'u-student', courseId: 'c-ise101', subject: 'Course Material', message: 'When will the course materials be available?', createdAt: now(), status: 'open', teacherId: null, response: null, type: 'query' },
        { id: uid('q'), studentId: 'u-student', courseId: 'c-ds', subject: 'Assignment Deadline', message: 'Can I get an extension for assignment 2?', createdAt: now(), status: 'resolved', teacherId: 'u-teacher', response: 'Extension granted until Friday.', type: 'query' },
        { id: uid('q'), studentId: 'u-student2', courseId: 'c-ds', subject: 'Lecture Recording', message: 'Is the lecture from last week recorded?', createdAt: now(), status: 'open', teacherId: null, response: null, type: 'query' }
    ];
    const complaints = [
        { id: uid('c'), studentId: 'u-student', subject: 'Teacher Behavior', message: 'The teacher is not responding to emails and is always late to class.', createdAt: now(), status: 'open', adminId: null, response: null, type: 'complaint', against: 'u-teacher' },
        { id: uid('c'), studentId: 'u-student2', subject: 'Lab Equipment', message: 'The lab computers are very slow and outdated.', createdAt: now(), status: 'open', adminId: null, response: null, type: 'complaint', against: null }
    ];
    const notifications = [];
    const courseSettings = [
        { courseId: 'c-ise101', assessmentWeights: { quiz: 15, assignment: 25, mid: 30, final: 30 }, gradeScale: { A: 90, B: 80, C: 70, D: 60, F: 0 } },
        { courseId: 'c-ds', assessmentWeights: { quiz: 20, assignment: 30, mid: 25, final: 25 }, gradeScale: { A: 85, B: 75, C: 65, D: 55, F: 0 } },
        { courseId: 'c-pf', assessmentWeights: { quiz: 10, assignment: 40, mid: 20, final: 30 }, gradeScale: { A: 92, B: 82, C: 72, D: 62, F: 0 } },
        { courseId: 'c-calc', assessmentWeights: { quiz: 25, assignment: 25, mid: 25, final: 25 }, gradeScale: { A: 88, B: 78, C: 68, D: 58, F: 0 } },
        { courseId: 'c-pfl', assessmentWeights: { quiz: 10, assignment: 60, mid: 0, final: 30 }, gradeScale: { A: 90, B: 80, C: 70, D: 60, F: 0 } }
    ];

    saveLS('users', users);
    saveLS('courses', courses);
    saveLS('attendance', attendance);
    saveLS('grades', grades);
    saveLS('queries', queries);
    saveLS('notifs', notifications);
    saveLS('complaints', complaints);
    saveLS('courseSettings', courseSettings);
    saveLS('seeded', true);
}

// Initialize seed data
seed();

// ========== Auth Functions ==========
function getUsers() { return getLS('users', []) }
function putUsers(v) { saveLS('users', v) }

function login(email, pass) {
    const users = getUsers();
    const u = users.find(x => x.email.toLowerCase() === email.toLowerCase() && x.password === pass);
    if (!u) return null;
    localStorage.setItem('currentUser', JSON.stringify(u));
    return u;
}

function signup({ name, email, password, role, roll }) {
    const users = getUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        return { error: 'Email already used' };
    }
    const id = uid('u');
    const user = { id, name, email, password, role, roll: role === 'student' ? (roll || '') : null, courses: [] };
    users.push(user);
    putUsers(users);
    return { ok: user };
}

// ========== Check Session on Load ==========
(function checkSession() {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        const user = JSON.parse(currentUser);
        redirectToDashboard(user.role);
    }
})();

function redirectToDashboard(role) {
    if (role === 'student') {
        window.location.href = 'student.html';
    } else if (role === 'teacher' || role === 'admin') {
        window.location.href = 'teacher.html';
    }
}

// ========== Panel Switching Animation ==========
const signUpBtn = $('sign-up-btn');
const signInBtn = $('sign-in-btn');
const container = $('auth-container');

signUpBtn.addEventListener('click', () => {
    container.classList.add('sign-up-mode');
});

signInBtn.addEventListener('click', () => {
    container.classList.remove('sign-up-mode');
});

// ========== Login Handler ==========
$('btn-login').addEventListener('click', () => {
    const email = $('login-email').value.trim();
    const password = $('login-password').value;

    if (!email || !password) {
        alert('Please enter email and password');
        return;
    }

    const user = login(email, password);
    if (user) {
        redirectToDashboard(user.role);
    } else {
        alert('Invalid email or password');
    }
});

// ========== Signup Handler ==========
$('btn-signup').addEventListener('click', () => {
    const name = $('signup-name').value.trim();
    const email = $('signup-email').value.trim();
    const password = $('signup-password').value;
    const role = $('signup-role').value;
    const roll = $('signup-roll').value.trim();

    if (!name || !email || !password) {
        alert('Please fill in all required fields');
        return;
    }

    if (role === 'student' && !roll) {
        alert('Please enter your roll number');
        return;
    }

    const result = signup({ name, email, password, role, roll });

    if (result.error) {
        alert(result.error);
    } else {
        alert('Account created successfully! Please login.');
        container.classList.remove('sign-up-mode');
        $('login-email').value = email;
        $('login-password').value = '';
    }
});

// Enter key support for forms
$('login-password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        $('btn-login').click();
    }
});

$('signup-roll').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        $('btn-signup').click();
    }
});