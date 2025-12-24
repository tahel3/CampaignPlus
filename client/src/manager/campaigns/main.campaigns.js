import axios from 'axios';


let currentUser = { name: 'תורם אנונימי', _id: null };
let campaigns = [];

// הקונטיינר עדיין מוגדר למעלה, מתוך הנחה שהאלמנט קיים ב-HTML
const container = document.getElementById('campaigns');


async function getCurrentUser() {
    try {
        const token = localStorage.getItem('token');

        if (!token) {
            console.log('No token found. User will remain anonymous.');
            return;
        }

        const res = await axios.get('http://localhost:3000/users/me', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });


        currentUser = res.data;
        console.log('Current user loaded:', currentUser.userName);

    } catch (err) {
        const status = err.response ? err.response.status : null;
        if (status === 401 || status === 403) {
            console.error('Token expired or invalid. Logging out automatically.');
            localStorage.removeItem('token');
            alert('החיבור פג תוקף, אנא התחבר מחדש.');
            window.location.href = '/manager/login/login.html';
            return;
        }
        console.error('Failed to get current user:', err);
        alert('עליך להתחבר כדי לצפות בהיסטוריית קמפיינים.');
        window.location.href = '/manager/login/login.html';
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
    window.location.href = '/manager/login/login.html';
}
document.getElementById('logout').addEventListener('click', (e) => {
    e.preventDefault();
    logout();
});

// --- פונקציות טעינת נתונים ורינדור ---

const getFromServer = async () => {
    const hasAccess = await checkAdminAccess();
    if (!hasAccess) {
        return;
    }
    try {
        const url = `http://localhost:3000/campaigns`;
        const { data: campaignsArray } = await axios.get(url);
        campaigns = campaignsArray;

        // מיון הקמפיינים
        campaigns.sort((a, b) => {
            const statusA = a.isOpen ? 1 : 0;
            const statusB = b.isOpen ? 1 : 0;
            if (statusA !== statusB) {
                return statusB - statusA; // Open campaigns first
            }
            return new Date(b.dateStart) - new Date(a.dateStart); // Newer campaigns first
        });
        loadcat(); // טוען את הקטגוריות לפני הרינדור

        // קריאה לפילטר המאוחד להצגה ראשונית של כל הרשימה (כולל בדיקת תוקף תאריכים)
        handleFilters();

        // קריאה לאתחול המאזינים לאחר טעינת הקמפיינים והקטגוריות
        initEventListeners();

    } catch (err) {
        console.error('An error occurred:', err);
        alert('Failed to load campaigns.');
    }
};



function renderCampaigns(list) {
    const container = document.getElementById('campaigns');
    if (!container) return;
    container.innerHTML = "";
    list.forEach(camp => createCampaignCard(camp, container));
}

const createCampaignCard = (campaign, container) => {

    const card = document.createElement('div');
    card.className = 'campaign-card';

    // תמונה
    if (campaign.img) {
        const img = document.createElement('img');
        img.src = `http://localhost:3000/upload/${encodeURIComponent(campaign.img)}`;
        img.alt = campaign.name;
        img.className = 'campaign-image';
        card.appendChild(img);
    }

    // פרטים
    const details = document.createElement('div');
    details.className = 'campaign-details';

    // כותרת ותיאור
    const header = document.createElement('div');
    header.className = 'campaign-header';

    const title = document.createElement('h3');
    title.className = 'campaign-title';
    title.textContent = campaign.name;
    header.appendChild(title);

    const description = document.createElement('p');
    description.className = 'campaign-description';
    description.textContent = campaign.description || '';
    header.appendChild(description);

    details.appendChild(header);

    if (campaign.dest && campaign.sumCon) {
        const progressContainer = document.createElement('div');
        progressContainer.className = 'campaign-progress';

        const progressInfo = document.createElement('div');
        progressInfo.className = 'progress-info';
        progressInfo.innerHTML = `
            <div>
                <span>יעד:</span>
                <span>${campaign.dest}₪</span>
            </div>
            <div>
                <span>גויס:</span>
                <span class="amount-raised">${campaign.sumCon}₪</span>
            </div>
        `;
        progressContainer.appendChild(progressInfo);
        const progressBarContainer = document.createElement('div');
        progressBarContainer.className = 'progress-bar-container';

        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        const progressPercentage = (campaign.sumCon / campaign.dest) * 100;
        progressBar.style.width = `${Math.min(progressPercentage, 100)}%`;
        progressBarContainer.appendChild(progressBar);
        progressContainer.appendChild(progressBarContainer);
        details.appendChild(progressContainer);
    }

    // כפתורים
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'campaign-buttons';

    const historyBtn = document.createElement('button');
    historyBtn.type = 'button';
    historyBtn.className = 'campaign-button';
    historyBtn.textContent = 'להיסטוריית תרומות';
    buttonsContainer.appendChild(historyBtn);

    const updateBtn = document.createElement('a');
    updateBtn.href = `./updateCampaign/updateCampaign.html?id=${campaign._id}`;
    updateBtn.className = 'campaign-button';
    updateBtn.textContent = 'עדכון קמפיין';
    buttonsContainer.appendChild(updateBtn);

    details.appendChild(buttonsContainer);
    card.appendChild(details);
    container.appendChild(card);

    historyBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            const res = await axios.get(`http://localhost:3000/contributions/campaigns/${campaign._id}`);
            const contributions = res.data;

            let listHtml = '<div class="contributions-list">'; // כלי לעיצוב רשימת התרומות
            if (contributions && contributions.length > 0) {
                contributions.forEach(con => {
                    const dateObj = new Date(con.dateCon);
                    const isValidDate = con.dateCon && !isNaN(dateObj.getTime());
                    const dateDisplay = isValidDate ?
                        dateObj.toLocaleDateString('he-IL') :
                        'תאריך לא צוין';
                    // יצירת כרטיס תרומה מעוצב
                    const donorName = con.donorName || 'תורם אנונימי';

                    listHtml += `
            <div class="contribution-item">
                <div class="donor-info">
                    <span class="donor-name">${donorName}</span>
                </div>
                <div class="donation-details">
                    <span class="donation-amount">${con.amount}₪</span>
                    <span class="donation-date">(${dateDisplay})</span>
                </div>
            </div>
        `;
                });
            } else {
                listHtml += '<p class="no-contributions">לא נמצאו תרומות לקמפיין זה.</p>';
            }
            listHtml += '</div>'; // סגירת קונטיינר התרומות
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <h3>היסטוריית תרומות</h3>
                    ${listHtml}
                    <button class="close-modal-btn">סגור</button>
                </div>
            `;
            document.body.appendChild(modal);
            modal.querySelector('.close-modal-btn').onclick = () => {
                modal.remove();
            };

            window.onclick = (event) => {
                if (event.target === modal) {
                    modal.remove();
                }
            };
        } catch (err) {
            console.error('Error fetching contributions:', err);
            alert('שגיאה בטעינת התרומות.');
        }
    });
};

const loadcat = async () => {
    try {
        const { data } = await axios.get("http://localhost:3000/categories");
        const categoriesArray = data.map(item => ({ id: item._id, name: item.name }));
        fillcat(categoriesArray);
        document.getElementById("categorySelect").addEventListener("change", handleCategoryFilter);
        document.getElementById("clearCategories").addEventListener("click", clearCategories);
    } catch (err) {
        console.log("שגיאה בטעינת קטגוריות:", err);
    }
};


function fillcat(data) {
    const element = document.getElementById('categorySelect');
    element.innerHTML = "";
    data.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat.id;
        option.textContent = cat.name;
        element.appendChild(option);
    });
}



function handleFilters() {
    const nameInput = document.getElementById("filterName");
    const isOpenCheckbox = document.getElementById("isOpen-filter");

    // בדיקת קיום האלמנטים לפני המשך הסינון
    if (!nameInput || !isOpenCheckbox) {
        renderCampaigns(campaigns);
        return;
    }

    const nameFilter = nameInput.value.toLowerCase();
    const isOpenFilter = isOpenCheckbox.checked;
    const selectedCategories = Array.from(document.getElementById("categorySelect").selectedOptions).map(opt => String(opt.value));
    console.log("Categories selected:", selectedCategories);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let filteredCampaigns = campaigns;

    // 1. סינון לפי שם
    if (nameFilter) {
        filteredCampaigns = filteredCampaigns.filter(c =>
            c.name && c.name.toLowerCase().includes(nameFilter)
        );
    }


    if (isOpenFilter) {
        filteredCampaigns = filteredCampaigns.filter(c => {
            // 1. האם הקמפיין סומן כפתוח (isOpen: true)
            const isCampaignOpen = c.isOpen === true;

            // 2. האם תאריך הסיום טרם עבר? (גם אם הוא גמיש)
            let isDateValid = true;
            if (c.dateEnd) {
                const dateEnd = new Date(c.dateEnd);
                dateEnd.setHours(23, 59, 59, 999);
                isDateValid = dateEnd >= today; // נותן לקמפיין לעבור אם התאריך לא עבר
            }

            // 3. האם הקמפיין התחיל?
            let hasStarted = true;
            if (c.dateStart) {
                const dateStart = new Date(c.dateStart);
                dateStart.setHours(0, 0, 0, 0);
                hasStarted = dateStart <= today;
            }

            // הקמפיין יוצג רק אם: פתוח ידנית + התחיל + התוקף לא פג
            // הלוגיקה אינה צריכה להתחשב ב"גמיש" כאן, אלא רק בבדיקות תאריכים
            return isCampaignOpen && hasStarted && isDateValid;
        });
    }
    if (selectedCategories.length > 0) {
        filteredCampaigns = filteredCampaigns.filter(camp => {
            const categoriesRaw = Array.isArray(camp.category) ? camp.category : (camp.category ? [camp.category] : []);
            const campaignCategoryIds = categoriesRaw.map(cat => {
                return (typeof cat === 'object' && cat !== null && cat._id) ? cat._id : cat;
            }).filter(id => id);
            return campaignCategoryIds.some(campaignCategoryId => selectedCategories.includes(campaignCategoryId));
        });
    }

    renderCampaigns(filteredCampaigns);
}


const handleCategoryFilter = () => {
    handleFilters();
};


function clearCategories() {
    const select = document.getElementById("categorySelect");
    Array.from(select.options).forEach(opt => opt.selected = false);
    cats = [];
    handleFilters();
};


function initEventListeners() {
    const nameInput = document.getElementById("filterName");
    const isOpenCheckbox = document.getElementById("isOpen-filter");

    if (nameInput) {
        nameInput.addEventListener("input", handleFilters);
    }

    if (isOpenCheckbox) {
        isOpenCheckbox.addEventListener("change", handleFilters);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    getFromServer();
    // טוען את הקטגוריות, מפעיל את המאזינים שלהן

});