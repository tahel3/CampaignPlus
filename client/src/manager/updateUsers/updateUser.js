import axios from 'axios';
let currentUser = null;
const userId = new URLSearchParams(window.location.search).get("id");

function updateNav() {
    const token = localStorage.getItem('token');
    const loginLink = document.querySelector('#login');
    const logoutLink = document.querySelector('#logout');

    if (token) {
        loginLink.style.display = 'none';
        if (logoutLink) logoutLink.style.display = 'block';
    } else {
        loginLink.style.display = 'block';
        if (logoutLink) logoutLink.style.display = 'none';
    }
}
updateNav();
function logout() {
    localStorage.removeItem('token');
    alert('התנתקת בהצלחה');
    window.location.href = './src/user/login/login.html';
}
document.getElementById('logout').addEventListener('click', (e) => {
    e.preventDefault();
    logout();
});


async function getCurrentUser() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            return;
        }

        const res = await axios.get('http://localhost:3000/users/me', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        currentUser = res.data;
    } catch (err) {
        console.error('Failed to get current user:', err);
        alert('עליך להתחבר כדי לעדכן משתמשים.');
        window.location.href = './src/user/login/login.html';

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
const updateUser = async () => {
    const hasAccess = await checkAdminAccess();
    if (!hasAccess) {
        return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
        alert('עליך להתחבר כדי לעדכן משתמשים.');
        window.location.href = './src/user/login/login.html';
        return;
    }
    const authHeaders = { Authorization: `Bearer ${token}` };
    try {
        const { data } = await axios.get(`http://localhost:3000/users/${userId}`, {
            headers: authHeaders
        });

        document.getElementById("userName").value = data.userName || "";
        document.getElementById("password").value = "";
        document.getElementById("email").value = data.email || "";
        document.getElementById("role").checked = data.status || false;

    } catch (err) {
        console.error("שגיאה בטעינת משתמש:", err);
    }
};
updateUser();


// --- שליחת עדכון ---
document.getElementById("sendUpdate").addEventListener("click", async () => {
    const btn = document.getElementById("sendUpdate");
    const mediaInput = document.getElementById("media");
    btn.disabled = true;
    const token = localStorage.getItem('token');
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    if (!token) {
        alert('עליך להתחבר כדי לעדכן משתמשים.');
        window.location.href = './src/user/login/login.html';
        btn.disabled = false;
        return;
    }

    const passwordInput = document.getElementById("password");
    const UserData = {
        userName: document.getElementById("userName").value,
        email: document.getElementById("email").value,
        role: document.getElementById("role").value,
    };
    if (passwordInput.value.trim() !== "") {
        UserData.password = passwordInput.value;
    }
    // --- קריאה לשרת לעדכון ---
    try {
        const res = await axios.put(`http://localhost:3000/users/${userId}`, UserData, {
            headers: authHeaders
        });
        console.log("Response:", res.data);
        alert("המשתמש עודכן בהצלחה!");
        btn.disabled = false;
    } catch (err) {
        console.error("שגיאה בעדכון:", err);
        if (err.response && err.response.status === 403) {
            alert("אין לך הרשאה לבצע עדכון משתמש.");
        } else {
            alert("העדכון נכשל");
        }
        btn.disabled = false;
    }
});
document.getElementById("deleteUser").addEventListener("click", async () => {
    const btn = document.getElementById("deleteUser");
    btn.disabled = true;
    const token = localStorage.getItem('token');
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    if (!token) {
        alert('עליך להתחבר כדי למחוק משתמשים.');
        window.location.href = './src/user/login/login.html';
        btn.disabled = false;
        return;
    }
    // --- קריאה לשרת למחיקה ---
    try {
        await axios.delete(`http://localhost:3000/users/${userId}`, {
            headers: authHeaders
        });
        alert("המשתמש נמחק בהצלחה!");
        window.location.href = './users.html';
    } catch (err) {
        console.error("שגיאה במחיקה:", err);
        if (err.response && err.response.status === 403) {
            alert("אין לך הרשאה לבצע מחיקת משתמש.");
        } else {
            alert("המחיקה נכשלה");
        }
        btn.disabled = false;
    }
});
