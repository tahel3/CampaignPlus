import axios from 'axios';

let currentUser = null;
let allUsers = []; 

function updateNav() {
    const token = localStorage.getItem('token');
    const loginLink = document.querySelector('#login');
    const logoutLink = document.querySelector('#logout');
    if (token) {
        if (loginLink) loginLink.style.display = 'none';
        if (logoutLink) logoutLink.style.display = 'block';
    } else {
        if (loginLink) loginLink.style.display = 'block';
        if (logoutLink) logoutLink.style.display = 'none';
    }
}
updateNav();

function logout() {
    localStorage.removeItem('token');
    alert('התנתקת בהצלחה');
    window.location.href = './src/user/login/login.html';
}

async function getCurrentUser() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return null;

        const res = await axios.get('http://localhost:3000/users/me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        currentUser = res.data;
    } catch (err) {
        console.error('User not logged in or token invalid.');
        return null; 
    }
}

async function checkAdminAccess() {
    await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
        console.warn('Access denied. User is not an admin.');
        alert('אין לך הרשאות מנהל כדי לגשת לדף זה.');
        window.location.href = '../index.html';
        return false;
    }
    console.log('Admin access granted.');
    return true;
}


// פונקציה אחידה לרינדור כרטיסי משתמש
function renderUsers(list) {
    const container = document.querySelector('#users');
    if (!container) {
        console.error('Element with ID "users" not found.');
        return;
    }
    container.innerHTML = ''; 

    list.forEach(user => {
        const card = document.createElement('div');
        card.className = 'user-card';
        card.innerHTML = `
            <h3>שם משתמש: ${user.userName}</h3>
            <p>אימייל: ${user.email}</p>
            <p>תפקיד: ${user.role}</p>
            <p>מספר תרומות: ${user.con ? user.con.length : 0}</p>
        `;

        const updateBtn = document.createElement('a');
        updateBtn.href = `../updateUsers/updateUser.html?id=${user._id}`;
        updateBtn.className = 'User-button';
        updateBtn.textContent = 'עדכון משתמש';
        card.appendChild(updateBtn);
        container.appendChild(card);
    });
}

// --- טעינת נתונים מהשרת ---

const getFromServer = async () => {
    const hasAccess = await checkAdminAccess();
    if (!hasAccess) return;
    
    try {
        const token = localStorage.getItem('token');
        const url = `http://localhost:3000/users`;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const { data } = await axios.get(url, config);

        allUsers = data.map(item => ({
            _id: item._id,
            userName: item.userName,
            email: item.email,
            con: item.con,
            role: item.role
        }));

        renderUsers(allUsers); 
    }
    catch (err) {
        console.error('Error fetching users:', err);
        alert('שגיאה בטעינת משתמשים.');
    }
};




function handleUserFilter() {
    const nameInput = document.getElementById("filterName");
    if (!nameInput) return;
    
    const value = nameInput.value.toLowerCase();
    
    const matches = allUsers.filter(user =>
        user.userName && user.userName.toLowerCase().includes(value)
    );
    
    renderUsers(matches);
}


document.addEventListener('DOMContentLoaded', () => {

    const logoutElement = document.getElementById('logout');
    if (logoutElement) {
        logoutElement.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }

    const nameInput = document.getElementById("filterName");
    if (nameInput) {
        nameInput.addEventListener("input", handleUserFilter);
    }

    getFromServer();
});