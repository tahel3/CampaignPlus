import axios from 'axios';

const deleteInput = document.getElementById("deletecategory");
const datalist = document.getElementById("categoriesList");
const deleteBtn = document.getElementById("deleteBtn");

let currentUser = null;
let categoriesArray = [];
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
    console.error('Failed to get current user:', err);
    alert('עליך להתחבר כדי לנהל קטגוריות.');
    window.location.href = './src/user/login/login.html';
  }
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
  window.location.href = './src/user/login/login.html';
}
document.getElementById('logout').addEventListener('click', (e) => {
    e.preventDefault();
    logout();
});


const loadCategories = async () => {
  await getCurrentUser();
  try {
    const { data } = await axios.get("http://localhost:3000/categories");
    categoriesArray = data.map(item => ({ id: item._id, name: item.name }));
    fillDatalist(categoriesArray);
  } catch (err) {
    console.error("שגיאה בטעינת קטגוריות:", err);
  }
};
function fillDatalist(categories) {
  datalist.innerHTML = "";
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat.name;
    datalist.appendChild(option);
  });
}

deleteInput.addEventListener("input", () => {
  const searchTerm = deleteInput.value.toLowerCase();
  if (searchTerm.length > 0) {
    const filtered = categoriesArray.filter(cat =>
      cat.name.toLowerCase().startsWith(searchTerm)
    );
    fillDatalist(filtered);
  } else {
    fillDatalist(categoriesArray);
  }
});
const deletecategory = async () => {
  let category = document.getElementById("deletecategory").value.trim()
  const cat = categoriesArray.find(cat => cat.name == category)
  if (!cat)
    return alert("לא נמצאה קטגוריה מתאימה ")

  try {
    const url = `http://localhost:3000/categories/${cat.id}`
    await axios.delete(url)
    categoriesArray = categoriesArray.filter(item => item.id !== cat.id);
    fillDatalist(categoriesArray);
    document.getElementById("deletecategory").value = ""
    return alert("נמחק בהצלחה ")

  }
  catch (err) {
    console.error("שגיאה במחיקת קטגוריה:", err);
    alert("שגיאה במחיקה");
  }

}


const addcategory = async () => {
  const input = document.getElementById("newcategory");
  const newcat = input.value.trim();

  if (!newcat) {
    alert("אנא הזן קטגוריה");
    return;
  }

  try {
    const url = `http://localhost:3000/categories`;
    const { data } = await axios.get(url);
    const categoriesArray = data.map(item => ({ name: item.name }));

    const exists = categoriesArray.some(item => item.name === newcat);

    if (exists) {
      alert("הקטגוריה כבר קיימת!");
    } else {
      const category = { name: newcat };
      const res = await axios.post(url, category);
      console.log("Response:", res.data);
      alert("הקטגוריה נוספה בהצלחה!");
      window.location.reload();
    }
  } catch (err) {
    console.log('An error occurred:', err);
    alert('שגיאה בטעינת קטגוריות.');
  }
};
loadCategories()
document.getElementById("sendcat").addEventListener("click", addcategory);
document.getElementById("deleteBtn").addEventListener("click", deletecategory);

