import axios from 'axios';

let currentUser = null;
let userContributions = [];
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
  window.location.href = '/manager/login/login.html';
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

async function getContributionHistory() {

  // שלב 1: בדוק אם יש משתמש מחובר
  const isLoggedIn = await getCurrentUser();
  console.log("CurrentUser ID:", currentUser._id);
  if (!isLoggedIn || !currentUser?._id) {
    document.getElementById('contributionHistory').innerHTML = '<p>עליך להתחבר כדי לראות את היסטוריית התרומות.</p>';
    return;
  }


  try {
    const token = localStorage.getItem('token');
    if (!token) {
      document.getElementById('contributionHistory').innerHTML = '<p>עליך להתחבר כדי לראות את היסטוריית התרומות.</p>';
      return;
    }
    const { data } = await axios.get('http://localhost:3000/contributions');
    console.log("All Contributions Data:", data);
    console.log("Example Contribution Structure:", data[0])

    userContributions = data.filter(c =>
      c.user &&
     String(c.user).trim() === String(currentUser._id).trim()
    );
    console.log("Filtered User Contributions:", userContributions);
    renderContributions(userContributions);
  } catch (err) {
    console.error('שגיאה בשליפת תרומות:', err);
    document.getElementById('contributionHistory').innerHTML = '<p>שגיאה בטעינת היסטוריית תרומות.</p>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  getContributionHistory();
});


function renderContributions(contributions) {
  const container = document.getElementById('contributionHistory');
  container.innerHTML = '';

  if (contributions.length === 0) {
    container.innerHTML = `
          <div class="contribution-empty">
            <h2>היסטוריית תרומות</h2>
            <p>אין לך תרומות עדיין.</p>
          </div>
        `;
    return;
  }

  contributions.forEach(element => {
    let campaignName = "קמפיין לא ידוע"; 

    if (element.campaign && typeof element.campaign === 'object') {
      campaignName = element.campaign.name || `קמפיין חסר שם (ID: ${element.campaign._id})`;
    } else if (typeof element.campaign === 'string' && element.campaign.length > 5) {
      campaignName = `שם לא נמצא (ID: ${element.campaign})`;
    }
    const date = new Date(element.dateCon).toLocaleDateString('he-IL');
    const div = document.createElement('div');
    div.className = 'contribution-entry';
    div.innerHTML = `
          <h3 class="contribution-campaign">${campaignName}</h3>
          <p class="contribution-amount">סכום: <strong>${element.amount} ₪</strong></p>
          <p class="contribution-date">תאריך: ${date}</p>
        `;
    container.appendChild(div);
  });
}
const dateInput = document.getElementById('filter-date');
dateInput.addEventListener('change', () => {
  const selectedDate = new Date(dateInput.value);
  const filteredContributions = userContributions.filter(c => {
    const contributionDate = new Date(c.dateCon);
    return contributionDate.toDateString() === selectedDate.toDateString();
  });
  renderContributions(filteredContributions);
});
const clearDateBtn = document.getElementById('reset-btn');
clearDateBtn.addEventListener('click', () => {
  dateInput.value = '';
  renderContributions(userContributions);
}); 