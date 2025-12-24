import axios from 'axios';

let currentUser = { name: 'תורם אנונימי', _id: null, con: [] };
import { io } from 'socket.io-client';
const socket = io("http://localhost:3000");

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
    window.location.href = '/user/login/login.html';
}

document.getElementById('logout').addEventListener('click', (e) => {
    e.preventDefault();
    logout();
});

let allCampaign = []
async function loadCategories() {
    try {
        const res = await axios.get("http://localhost:3000/categories");
        const categories = res.data;
        const select = document.getElementById("filterCategory");
        select.innerHTML = "";
        const allOption = document.createElement("option");
        allOption.value = "";
        allOption.textContent = "הצג את כל הקמפיינים";
        allOption.selected = true;
        select.appendChild(allOption);
        categories.forEach(cat => {
            const option = document.createElement("option");
            option.value = cat._id;
            option.textContent = cat.name;
            select.appendChild(option);
        });

    } catch (err) {
        console.error("Failed to load categories:", err);
    }
}
loadCategories()

const isCampaignActive = (campaign) => {
    const now = new Date();
    const startDate = new Date(campaign.dateStart);
    const isCurrentlyActive = campaign.isOpen && 
                              now >= startDate &&
                              (campaign.isFinal ? 
                                (!campaign.dateEnd || now <= new Date(new Date(campaign.dateEnd).setHours(23, 59, 59, 999))) 
                               : true);
    const hasStarted = now >= startDate;
    const isFlexibleAndStarted = !campaign.isFinal && hasStarted;
    if(campaign.isOpen==false){
        return false;
    }
    return isCurrentlyActive || isFlexibleAndStarted;
};

const buttn_search = document.getElementById('sendCategories').addEventListener("click", () => {
    const categorySelect = document.getElementById("filterCategory");
    const selectedCategories = Array.from(categorySelect.selectedOptions)
        .map(opt => opt.value)
        .filter(value => value !== "");

    const container = document.querySelector("#campaigns");
    container.innerHTML = "";
    const activeCampaigns = allCampaign.filter(isCampaignActive);

    if (selectedCategories.length === 0) {
        activeCampaigns.forEach(campaign => {
            createCampaignCard(campaign);
        });
    } else {
        activeCampaigns.forEach(campaign => {
            const hasMatch = selectedCategories.some(selectedId => 
                campaign.category.includes(selectedId)
            );

            if (hasMatch) {
                createCampaignCard(campaign);
            }
        });
    }
    Array.from(categorySelect.options).forEach(option => {
        option.selected = (option.value === "");
    });
});
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
        updateWelcomeMessage();
        console.log('Current user loaded:', currentUser.userName);

   } catch (err) {
        const status = err.response ? err.response.status : null;
        
        // טפל רק ב-401 ו-403 כבעיות אימות שדורשות התנתקות
        if (status === 401 || status === 403) {
            console.error('Token expired or invalid. Logging out automatically.');
            localStorage.removeItem('token');
            alert('החיבור פג תוקף, אנא התחבר מחדש.');
            window.location.href = '/user/login/login.html';
            return;
        } 
        
        // 404 או שגיאת שרת אחרת (500)
        if (status === 404) {
             console.error('Error 404: /users/me route not found. Server configuration error.', err);
             return;
        }
        
        // כל שגיאה אחרת
        console.error('Failed to get current user with unexpected error:', err);
        alert('עליך להתחבר כדי לצפות בהיסטוריית קמפיינים.');
        window.location.href = '../login/login.html';
    }

}


function checkWeeklyReset() {
    const today = new Date();

    if (today.getDay() === 0) {
        const lastReset = localStorage.getItem('lastResetDate');
        if (lastReset !== today.toLocaleDateString('en-US')) {
            collect = 0;
            localStorage.setItem('collectedThisWeek', collect);
            localStorage.setItem('lastResetDate', today.toLocaleDateString('en-US'));
            console.log("Weekly donations reset.");
        }
    }
}
socket.on('donationUpdate', (updateData) => {
    console.log('Received real-time donation update:', updateData);
    // 1. איתור כרטיס הקמפיין באמצעות data-campaign-id שהוספנו ב-createCampaignCard
    const cardContainer = document.querySelector(`#campaigns [data-campaign-id="${updateData.campaignId}"]`);
    
    if (cardContainer) {
        console.log('STEP 2: Campaign card found. Updating...');
        //עדכון סכום הגיוס
        const amountRaisedSpan = cardContainer.querySelector('.amount-raised');
        if (amountRaisedSpan) {
            // עדכון הטקסט עם הסכום החדש מהשרת
            amountRaisedSpan.textContent = `${updateData.newSum}₪`;
        }

        const progressBar = cardContainer.querySelector('.progress-bar');
        if (progressBar) {
            const progressPercentage = (updateData.newSum / updateData.newDest) * 100;
            progressBar.style.width = `${Math.min(progressPercentage, 100)}%`;
        }
        
        cardContainer.classList.add('updated-highlight');
        setTimeout(() => {
            cardContainer.classList.remove('updated-highlight');
        }, 2000);
    }
});
const getFromServer = async () => {
    checkWeeklyReset();
    await getCurrentUser();

    try {
        const token = localStorage.getItem('token');
        const { data: campaigns } = await axios.get('http://localhost:3000/campaigns', {
            headers: { Authorization: `Bearer ${token}` }
        });
        allCampaign = campaigns;

        const container = document.querySelector('#campaigns');
        if (container) {
            container.innerHTML = '';
        }
        const activeCampaigns = allCampaign.filter(isCampaignActive);

        for (const campaign of activeCampaigns) { 
            createCampaignCard(campaign);
        }
       for(const campaign of campaigns) { 
            try {
                const endDate = new Date(new Date(campaign.dateEnd).setHours(23, 59, 59, 999));
                const currentDate = new Date();
                const isDatePassed = currentDate > endDate;
                if (campaign.isOpen && isDatePassed) {
                    await axios.put(`http://localhost:3000/campaigns/${campaign._id}`, { isOpen: false }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                }
            } catch (err) {
                if (err.response && err.response.status !== 404) {
                    console.error('Error in campaign processing loop:', err);
                }
            }
        }
    } catch (error) {
        console.error('An error occurred:', error);
        if (!error.response || (error.response.status !== 401 && error.response.status !== 403)) {
            alert('Failed to load campaigns.');
        }
    }
};

const createCampaignCard = (campaign) => {

    const container = document.querySelector('#campaigns');
    if (!container) return;

    const card = document.createElement('div');
    card.className = 'campaign-card';
    card.dataset.campaignId = campaign._id;


    if (campaign.img) {
        const img = document.createElement('img');
        img.src = `http://localhost:3000/upload/${encodeURIComponent(campaign.img)}`;
        img.alt = campaign.name;
        img.className = 'campaign-image';
        card.appendChild(img);
    }

    const details = document.createElement('div');
    details.className = 'campaign-details';

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

        console.log(`Campaign: ${campaign.name || 'שם קמפיין חסר'}`);
        console.log(`Dest: ${campaign.dest}, SumCon: ${campaign.sumCon}`);

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

      const button = document.createElement('a');
    button.className = 'campaign-button';
    button.textContent = 'תרום עכשיו';
    details.appendChild(button);
    button.dataset.id = campaign._id;
    card.appendChild(details);
    container.appendChild(card);
    const id = button.dataset.id
    button.addEventListener('click', async (e) => {
        if (!currentUser || !currentUser._id) {
            alert('עליך להתחבר כדי לתרום.');
            return
        }
        e.preventDefault();
        console.log(id)
        if(id)
        {
        window.location.href = `/src/user/contributionsCampaign/contributionsCampaign.html?id=${id}`;
        }
        else{
            alert("שגיאה בטעינת הנתונים")
            return
        }
        })

 };

getFromServer();
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response ? error.response.status : null;
        if (status == 401) {
            console.error('Token expired or invalid. Logging out automatically.');
            localStorage.removeItem('token');
            alert('החיבור פג תוקף, אנא התחבר מחדש.');
            window.location.href = '/user/login/login.html';
            return new Promise(() => { });
        }

        return Promise.reject(error);
    }
);

const nameInput = document.getElementById("filterName");
nameInput.addEventListener("input", () => {
    const value = nameInput.value.toLowerCase();
    const nameMatches = allCampaign.filter(c =>
        c.name && c.name.toLowerCase().includes(value)
    );
    const container = document.querySelector("#campaigns");
    container.innerHTML = "";
    nameMatches.filter(isCampaignActive).forEach(campaign => {
        createCampaignCard(campaign);
    });
});
function updateWelcomeMessage() {
    const welcomeElement = document.getElementById('welcomeMessage');
    if (welcomeElement) {
        welcomeElement.textContent = `👤 ברוך הבא, ${currentUser.userName || 'תורם אנונימי'}!`;welcomeElement.style.display = 'inline-block';
    } else {
        welcomeElement.textContent = '';
        welcomeElement.style.display = 'none';
    }
}