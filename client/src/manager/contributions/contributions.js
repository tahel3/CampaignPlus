function updateNav() {
    const token = localStorage.getItem('token');
    const loginLink = document.querySelector('#login');
    const logoutLink = document.querySelector('#logout'); 

    if (token) {
        loginLink.style.display = 'none'; // הסתר התחברות
        if (logoutLink) logoutLink.style.display = 'block'; // הצג יציאה
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
        alert('עליך להתחבר כדי לצפות בתרומות .');
        window.location.href = './src/user/login/login.html';
    }
}