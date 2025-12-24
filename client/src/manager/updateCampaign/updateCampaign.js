import axios from "axios";
let currentUser = null;
const params = new URLSearchParams(window.location.search);
const campaignId = params.get("id");

// --- פונקציות ניווט ומשתמש (ללא שינוי מהותי) ---

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

// ודא שהאלמנט קיים לפני הוספת מאזין
document.addEventListener('DOMContentLoaded', () => {
    const logoutElement = document.getElementById('logout');
    if (logoutElement) {
        logoutElement.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
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
        // השארת המשתמש אנונימי במקרה של שגיאת טוקן
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

// --- טעינת נתוני קמפיין וקטגוריות ---

const getCampaign = async () => {
    const hasAccess = await checkAdminAccess();
    if (!hasAccess) {
        return;
    }
    if (!campaignId) {
        alert("שגיאה: חסר מזהה קמפיין לעדכון.");
        return;
    }

    try {
        const { data } = await axios.get(`http://localhost:3000/campaigns/${campaignId}`);
        const formatDate = (dateString) => dateString ? new Date(dateString).toISOString().split("T")[0] : "";

        // מילוי שדות הטופס בהתאם ל-HTML
        document.getElementById("title").value = data.name || "";
        document.getElementById("dest").value = data.dest || "";
        document.getElementById("dateStart").value = formatDate(data.dateStart);
        document.getElementById("dateEnd").value = formatDate(data.dateEnd);
        document.getElementById("description").value = data.description || "";
        document.getElementById("status").checked = data.isFinal || false;

        // שמירת רשימת הקטגוריות הקיימת לצורך בחירתן לאחר טעינת כל הקטגוריות
        window.existingCategories = data.category || [];

        window.existingFileId = data.img || null;
    } catch (err) {
        console.error("שגיאה בטעינת קמפיין:", err);
        alert("שגיאה בטעינת נתוני הקמפיין.");
    }
};

const getCategories = async () => {
    try {
        const { data } = await axios.get(`http://localhost:3000/categories`);
        const categorySelect = document.getElementById("category");
        categorySelect.innerHTML = ''; // מנקה את ברירת המחדל

        data.forEach(cat => {
            const option = document.createElement("option");
            option.value = cat._id;
            option.textContent = cat.name;
            categorySelect.appendChild(option);

            // בחירת הקטגוריות הקיימות עבור הקמפיין (אם נטענו)
            if (window.existingCategories && window.existingCategories.includes(cat._id)) {
                option.selected = true;
            }
        });
    } catch (err) {
        console.error("שגיאה בטעינת קטגוריות:", err);
    }
};

// הפעלת טעינת הנתונים
getCampaign().then(() => {
    // טוען את הקטגוריות רק לאחר טעינת הקמפיין (כדי לדעת מה לבחור)
    getCategories();
});


// --- שליחת עדכון ---
document.getElementById("send").addEventListener("click", async () => {
    const btn = document.getElementById("send");
    const mediaInput = document.getElementById("media");
    btn.disabled = true;
    const token = localStorage.getItem('token');
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    if (!token) {
        alert('עליך להתחבר כדי לעדכן קמפיינים.');
        window.location.href = '/manager/login/login.html'; // נתיב מתוקן
        btn.disabled = false;
        return;
    }

    let fileId = window.existingFileId;

    // 1. העלאת קובץ חדש אם נבחר
    if (mediaInput.files.length > 0) {
        try {
            const formData = new FormData();
            formData.append("file", mediaInput.files[0]);
            const uploadRes = await axios.post("http://localhost:3000/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            fileId = uploadRes.data.fileId;
        } catch (err) {
            console.error("שגיאה בהעלאת קובץ:", err);
            alert("שגיאה בהעלאת הקובץ");
            btn.disabled = false;
            return;
        }
    }

    const categorySelectElement = document.getElementById("category");
    const newlySelectedCategories = Array.from(categorySelectElement.selectedOptions)
        .map(option => option.value);
    let categoriesToSend;

    if (newlySelectedCategories.length > 0) {
        categoriesToSend = newlySelectedCategories;
    } else if (window.existingCategories && window.existingCategories.length > 0) {
        categoriesToSend = window.existingCategories;
    } else {
        categoriesToSend = [];
    }

    const campaignData = {
        name: document.getElementById("title").value.trim(),
        dest: Number(document.getElementById("dest").value),
        isFinal: document.getElementById("status").checked,
        dateStart: document.getElementById("dateStart").value,
        dateEnd: document.getElementById("dateEnd").value.trim() || null,
        description: document.getElementById("description").value,
        category: categoriesToSend, // *** שימוש במשתנה המעודכן ***
        img: fileId
    };

    // --- 3. בדיקות תקינות נתונים (Validation) ---
    if (!campaignData.name || campaignData.dest <= 0) {
        alert("אנא מלא כותרת קמפיין ויעד כספי חיובי.");
        btn.disabled = false;
        return;
    }
    if (!campaignData.dateStart) {
        alert("יש לבחור תאריך התחלה.");
        btn.disabled = false;
        return;
    }

    const dateStartObj = new Date(campaignData.dateStart);
    const dateEndObj = campaignData.dateEnd ? new Date(campaignData.dateEnd) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // בדיקה: תאריך סיום חייב להיות אחרי תאריך התחלה (אם יש תאריך סיום)
    if (dateEndObj && dateStartObj >= dateEndObj) {
        alert("תאריך סיום חייב להיות אחרי תאריך התחלה.");
        btn.disabled = false;
        return;
    }

    // --- 4. קביעת שדה isOpen (לוגיקה מתוקנת) ---

    // הקמפיין התחיל אם תאריך ההתחלה הוא היום או לפני
    const hasStarted = dateStartObj <= today;

    let isExpired = false;
    if (dateEndObj) {
        // אם יש תאריך סיום, בדוק אם יום הסיום עבר
        dateEndObj.setHours(23, 59, 59, 999);
        isExpired = dateEndObj < today;
    }

    // קמפיין פתוח רק אם: התחיל (או לפני) AND (אין תאריך סיום OR הוא טרם נגמר)
    // אם isFinal: true (קשיח), חייב להיות dateEnd תקין. אם isFinal: false (גמיש), dateEnd יכול להיות null או בעתיד.
    if (hasStarted && (dateEndObj === null || !isExpired || !campaignData.isFinal)) {
        campaignData.isOpen = true;
    } else {
        campaignData.isOpen = false;
    }

    // --- 5. שליחה לשרת ---
    try {
        const res = await axios.put(`http://localhost:3000/campaigns/${campaignId}`, campaignData, {
            headers: authHeaders
        });
        console.log("Response:", res.data);
        alert("הקמפיין עודכן בהצלחה!");
        // רענון הדף או ניתוב מחדש עשוי להיות רצוי כאן
        btn.disabled = false;
    } catch (err) {
        console.error("שגיאה בעדכון:", err.response ? err.response.data : err);
        if (err.response && err.response.data && err.response.data.error) {
            alert(`העדכון נכשל: ${err.response.data.error}`);
        } else {
            alert("העדכון נכשל");
        }
        btn.disabled = false;
    }
});