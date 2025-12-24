import axios from 'axios';

let currentUser = null;
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
      return false; 
    }

    const res = await axios.get('http://localhost:3000/users/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    currentUser = res.data;
    console.log(currentUser)
    return true;
  } catch (err) {
    console.error('Failed to get current user:', err);
    currentUser = null; 
    return false; 
  }
}

const updateActiveCampaignsCount = async () => {
    await getCurrentUser();
    try {
        const res = await axios.get('http://localhost:3000/campaigns/active-count');
        const count = res.data.count;
        document.getElementById('numActive').innerText = count;
    } catch (error) {
        console.error('Error fetching active campaign count:', error);
        document.getElementById('numActive').innerText = 'N/A';
    }
};
const renderTopDonors = (topDonors) => {
    const donorsData = topDonors;
     const listContainer = document.getElementById('topDonorsList');
    if (!listContainer) {
        console.error("Element with ID 'topDonorsList' not found.");
        return;
    }

    // ניקוי תוכן קודם
    listContainer.innerHTML = '';

    // יצירת רשימה לא מסודרת
    const ul = document.createElement('ul');
    ul.classList.add('top-donors-ul'); 

    // מעבר על הנתונים ויצירת פריטי רשימה
    donorsData.forEach((donor, index) => {

        const li = document.createElement('li');
        // נניח ש-donor.name קיים כתוצאה מה-lookup ב-Backend
        const donorName = donor.userName || 'תורם אנונימי';

        li.innerHTML = `
            <span class="rank">${index + 1}.</span> 
            <span class="donor-name">${donorName}</span> 
            <span class="donor-amount">${donor.totalAmount.toLocaleString()} ₪</span>
        `;
        if(index < 3) { // הדגשה לתורמים המובילים
        ul.appendChild(li);
        }
       
    });
    listContainer.appendChild(ul);
};
   
const fetchDonationStats = async () => {
    try {
        const res = await axios.get('http://localhost:3000/contributions/stats');
        const stats = res.data;
        document.getElementById('totalWeeklyDisplay').innerText = stats.totalWeekly.toLocaleString();
        document.getElementById('totalTodayDisplay').innerText = stats.totalToday.toLocaleString();
        renderTopDonors(stats.topDonors.splice(0,3)); // הצגת שלושת התורמים המובילים
    } catch (error) {
        console.error('Error fetching donation statistics:', error);
    }
};

updateActiveCampaignsCount();
fetchDonationStats();
