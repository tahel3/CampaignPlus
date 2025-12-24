import axios from "axios";

function validation(email, userName, password) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (userName.length < 3) {
      alert("שם המשתמש חייב להיות לפחות 3 תווים");
      return false;
    }
    if (!emailRegex.test(email)) {
      alert("אנא הכנס כתובת אימייל תקינה");
      return false;
    }
    if (password.length < 8) {
        alert("הסיסמה חייבת להיות לפחות 8 תווים");
        return false;
        }
    return true;
}

 
document.getElementById('send').addEventListener('click', async () => {
 const userRegister = {userName:document.querySelector('#userName').value,
email:document.querySelector('#email').value,
password:document.querySelector('#password').value,
};

  if(!validation(userRegister.email,userRegister.userName,userRegister.password)){
    return;
  }
  const btn = document.getElementById("send");
    btn.disabled = true; 
  try {
    const res=await axios.post('http://localhost:3000/users/register',userRegister);
 console.log("Response:", res.data);
    alert(" נרשמת בהצלחה!");
    window.location.href = "../login/login.html";
    
  } catch (err) {
    console.log("Error:", err);
    alert("שליחה נכשלה");
    btn.disabled = false;
  }
});

