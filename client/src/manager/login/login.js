import axios from "axios";

function validation(email, password) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
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
 const userRegister = {
email:document.querySelector('#email').value.trim(),
password:document.querySelector('#password').value.trim(),
};

  if(!validation(userRegister.email,userRegister.password)){
    return;
  }
  const btn = document.getElementById("send");
    btn.disabled = true; 
  try {
    const res=await axios.post('http://localhost:3000/users/login',userRegister);
 console.log("Response:", res.data);
    alert(" התחברת בהצלחה!");
    localStorage.setItem('token', res.data.token);
    window.location.href = "/manager/campaigns/index.html";
  } catch (err) {
    console.log("Error:", err);
    alert("שליחה נכשלה");
    btn.disabled = false;
  }
});
