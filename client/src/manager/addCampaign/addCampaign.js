import axios from 'axios';
let currentUser = null;
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
  }
}
const getCategories = async () => {
  try {
    const { data } = await axios.get(`http://localhost:3000/categories`);
    const categorySelect = document.getElementById("categories");
    data.forEach(cat => {
      const option = document.createElement("option");
      option.value = cat._id;
      option.textContent = cat.name;
      categorySelect.appendChild(option);
    });
  } catch (err) {
    console.error("שגיאה בטעינת קטגוריות:", err);
  }
};

getCategories();
document.getElementById('send').addEventListener('click', async () => {
  await getCurrentUser();
  const token = localStorage.getItem('token');
  if (!token) {
    alert('עליך להתחבר כדי להוסיף קמפיין.');
    window.location.href = './src/user/login/login.html';
    return;
  }
  let fileId = null;
  const mediaInput = document.getElementById("media");
  const btn = document.getElementById("send");

  btn.disabled = true; // מנטרל בזמן שליחה

  // --- מעלה קובץ אם יש ---
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

  // --- נתוני הקמפיין ---
  const campaignData = {
    name: document.getElementById("title").value,
    dest: Number(document.getElementById("dest").value),
    status: document.getElementById("status").checked,
    dateStart: document.getElementById("dateStart").value,
    dateEnd: document.getElementById("dateEnd").value,
    description: document.getElementById("description").value,
    sumCon: 0,
    category: Array.from(document.getElementById("category").selectedOptions).map(opt => opt.value),
    isOpen: true,
    isFinal: document.getElementById("isFinal").checked,
    img: fileId
  };
  const date=new Date();
 
  if(campaignData.dateEnd && campaignData.dateEnd <= campaignData.dateStart){
    alert("תאריך סיום חייב להיות אחרי תאריך התחלה");
    btn.disabled = false;
    return;
  }
  if(campaignData.dateEnd<=date){
    alert("תאריך סיום חייב להיות בעתיד");
    btn.disabled = false;
    return;
  }
  if(new Date(campaignData.dateStart)>=date&& (new Date(campaignData.dateEnd)<=date|| !campaignData.isFinal)){
    campaignData.isOpen=true;
  }
  else{
    campaignData.isOpen=false;
  }

  // --- שליחת הקמפיין לשרת ---
  try {
    const res = await axios.post("http://localhost:3000/campaigns", campaignData);
    console.log("Response:", res.data);
    alert("הקמפיין נוסף בהצלחה!");

    // --- מאפסים את הטופס ומחזירים כפתור לפעולה ---
    document.getElementById("campaignForm").reset();
    btn.disabled = false;

  } catch (err) {
    console.error("Error:", err);
    alert("שליחה נכשלה");
    btn.disabled = false;
  }
});
