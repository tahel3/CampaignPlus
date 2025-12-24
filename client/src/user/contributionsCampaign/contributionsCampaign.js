import axios from 'axios';

let campaign1=null
let contributions=[]
let currentUser = { };

const cardNumber = document.getElementById('cardNumber');
  const expiryDate = document.getElementById('expiryDate');
  const cvv = document.getElementById('cvv');
  const email = document.getElementById('email');




async function getCurrentUser() {   
    try {
        const token = localStorage.getItem('token');
        if (!token) {
                alert('עליך להתחבר.');
                window.location.href = '/src/user/login/login.html';
                return null;
        }
        const res = await axios.get('http://localhost:3000/users/me', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        currentUser = res.data;
    } catch (err) {
        console.error('Failed to get current user:', err);
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
            localStorage.removeItem('token');
            console.log("Token removed due to failed validation.");
        }
        // currentUser = { name: 'תורם אנונימי' };
    }
}


const getcampaing = async () => {
  const params = new URLSearchParams(window.location.search);
  const id_campaing = params.get('id');

  if (!id_campaing) {
    alert("קמפיין לא זמין");
    return;
  }

  try {
    const { data: campaign } = await axios.get(`http://localhost:3000/campaigns/${id_campaing}`);
    campaign1 = campaign;
    console.log("📦 campaign1:", campaign1);

    // ✅ תצוגת תמונה ופרטים בסיסיים
    const imgEl = document.getElementById('campaignImage');
    const nameEl = document.getElementById('campaignName');
    const descEl = document.getElementById('campaignDescription');
    const targetEl = document.getElementById('campaignTarget');
    const raisedEl = document.getElementById('campaignRaised');
    const barEl = document.getElementById('progressBar');

    // תמונה
    if (campaign1.img) {
      imgEl.src = `http://localhost:3000/upload/${encodeURIComponent(campaign1.img)}`;
      imgEl.alt = campaign1.name || "תמונת קמפיין";
      imgEl.style.display = "block";
    } else {
      // תמונת ברירת מחדל אם אין תמונה
      imgEl.src = "/images/default_campaign.jpg";
      imgEl.style.display = "block";
    }

    // טקסטים
    nameEl.textContent = campaign1.name || "שם קמפיין לא זמין";
    descEl.textContent = campaign1.description || "אין תיאור לקמפיין זה.";

    // יעד וגויס
    const dest = Number(campaign1.dest || 0);
    const sumCon = Number(campaign1.sumCon || 0);
    targetEl.textContent = dest.toLocaleString('he-IL') + ' ₪';
    raisedEl.textContent = sumCon.toLocaleString('he-IL') + ' ₪';

    const pct = dest > 0 ? Math.min((sumCon / dest) * 100, 100) : 0;
    barEl.style.width = pct + '%';

    //  נבדוק אם יש תרומות בכלל
    if (Array.isArray(campaign1.contribution) && campaign1.contribution.length > 0) {
      renderCampaignContributions();
    } else {
      const grid = document.getElementById("donationsGrid");
      grid.innerHTML = "<p>אין תרומות להצגה עדיין.</p>";
      document.getElementById("loadMoreDonations").style.display = "none";
    }

  } catch (err) {
    console.error("❌ שגיאה בשליפת הקמפיין:", err);
    alert("אירעה שגיאה בעת טעינת הקמפיין.");
  }
};

document.addEventListener("DOMContentLoaded", () => {
    const buttons = document.querySelectorAll('.donate-amount');
    const customAmountInput = document.getElementById('customAmount');
    const submitBtn = document.getElementById('submitDonation');
    let selectedAmount = null;
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedAmount = parseInt(btn.dataset.amount);
        customAmountInput.value = selectedAmount;
        console.log(" נבחר סכום:", selectedAmount);
      });
    });
  
    customAmountInput.addEventListener('input', () => {
      buttons.forEach(b => b.classList.remove('selected'));
      selectedAmount = parseFloat(customAmountInput.value);
    });
  
    submitBtn.addEventListener('click', async () => {
        if (!selectedAmount || selectedAmount < 1) {
          alert("בחר סכום לתרומה");
          return;
        }
      
        if (cardNumber.value && expiryDate.value && cvv.value && email.value) {
          if (validation()) {
            await getCurrentUser();
      
            if (currentUser && currentUser._id) {
              const dedication = document.getElementById('dedication').value;
              const anon = document.getElementById('id-anon');
              const anonymous = anon.checked;
              console.log("📦 campaign1:", campaign1);
              console.log("📦 campaign1._id:", campaign1?._id);
              console.log("🔢 typeof selectedAmount:", typeof selectedAmount, "value:", selectedAmount);
              const data = {
                dedication: dedication || undefined,
                campaign: campaign1._id,
                amount: selectedAmount
              };
              if (anon.checked) {
                data.anonymous = true;
              } else {
                data.user = currentUser._id;
              }
      
              try {
                console.log("🔍 Sending donation data:", data);
                const res = await axios.post('http://localhost:3000/contributions', data);
                console.log("🔍 Sending donation data:", data);
                const contributionId = res.data._id;
                const token = localStorage.getItem('token');
      
                // עדכון משתמש
                await axios.put(`http://localhost:3000/users/${currentUser._id}`,
                  { con: [...(currentUser.con || []), contributionId] },
                  { headers: { Authorization: `Bearer ${token}` } }
                );
      
                // עדכון קמפיין
                await axios.put(`http://localhost:3000/campaigns/${campaign1._id}`, {
                  contribution: [...(campaign1.contribution || []), res.data],
                  sumCon: (campaign1.sumCon || 0) + parseFloat(selectedAmount)
                });
      
                alert(`תודה על תרומתך בסך ${selectedAmount}₪!`);
              } catch (err) {
                console.error('Error submitting contribution:', err);
                alert('נכשלה שליחת התרומה.');
              }
            }
          }
        } else {
          alert("אנא מלאו את כל השדות");
        }
      });

  });
  



function validation()
{
    [cardNumber, expiryDate, cvv, email].forEach(el => el.classList.remove('invalid'));
    let isValid = true;

    //  כרטיס אשראי – בדיוק 16 ספרות
    const cardRegex = /^\d{16}$/;
    if (!cardRegex.test(cardNumber.value)) {
      isValid = false;
      cardNumber.classList.add('invalid');
      alert('מספר כרטיס אשראי חייב להיות בדיוק 16 ספרות.');
       return
    }

    //  תוקף בפורמט MM/YY
    const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!expiryRegex.test(expiryDate.value)) {
      isValid = false;
      expiryDate.classList.add('invalid');
      alert('אנא הזן תוקף בפורמט תקין (MM/YY).');
      return
    } else {
      const [month, year] = expiryDate.value.split('/').map(Number);
      const now = new Date();
      const currentYear = now.getFullYear() % 100;
      const currentMonth = now.getMonth() + 1;
      if (year < currentYear || (year === currentYear && month < currentMonth)) {
        isValid = false;
        expiryDate.classList.add('invalid');
        alert('כרטיס האשראי פג תוקף.');
        return
      }
    }

    // 🔒 CVV — בדיוק 3 ספרות
    const cvvRegex = /^\d{3}$/;
    if (!cvvRegex.test(cvv.value)) {
      isValid = false;
      cvv.classList.add('invalid');
      alert('CVV חייב להיות 3 ספרות בלבד.');
      return
    }

    // 📧 אימייל תקין
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.value)) {
      isValid = false;
      email.classList.add('invalid');
      alert('אנא הזן כתובת אימייל תקינה.');
      return
    }
    return isValid
}

let displayedCount = 0;
const PAGE_SIZE = 10;

(async () => {
  await getcampaing(); 
  if (campaign1) {
    renderCampaignContributions();
  } else {
    console.warn("⚠️ campaign1 עדיין null - הקמפיין לא נטען כראוי");
  }
})();

function renderCampaignContributions() {
  if (!campaign1 || !campaign1.contribution || campaign1.contribution.length === 0) {
    document.getElementById("donationsGrid").innerHTML = "<p>אין תרומות להצגה עדיין.</p>";
    document.getElementById("loadMoreDonations").style.display = "none";
    return;
  }

  const sorted = [...(campaign1.contribution || [])].sort(
    (a, b) => new Date(b.dateCon) - new Date(a.dateCon)
  );

  const toDisplay = sorted.slice(displayedCount, displayedCount + PAGE_SIZE);
  const grid = document.getElementById("donationsGrid");

  toDisplay.forEach(con => {
    const donorName = con.anonymous ? "אנונימי" : (con.user?.userName || "תורם");
    const amount = con.amount?.toLocaleString('he-IL') || "—";
    const dedication = con.dedication ? `"${con.dedication}"` : "";
    const date = con.dateCon ? new Date(con.dateCon).toLocaleDateString('he-IL') : "";

    const card = document.createElement("div");
    card.className = "donation-card";
    card.innerHTML = `
      <div class="donation-header">${date}</div>
      <div class="donation-amount">₪${amount}</div>
      <div>${donorName}</div>
      <div class="donation-dedication">${dedication}</div>
    `;
    grid.appendChild(card);
  });

  displayedCount += toDisplay.length;

  const loadMoreBtn = document.getElementById("loadMoreDonations");
  loadMoreBtn.style.display =
    displayedCount >= sorted.length ? "none" : "inline-block";
}

document.getElementById("loadMoreDonations").addEventListener("click", renderCampaignContributions);
