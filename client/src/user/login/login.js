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


document.getElementById('send').addEventListener('click', async (event) => {
    event.preventDefault();
    const loginData = { 
        email: document.querySelector('#email').value,
        password: document.querySelector('#password').value,
    };

    if (!validation(loginData.email, loginData.password)) {
        return;
    }
    
    const btn = document.getElementById("send");
    btn.disabled = true;
    
    try {
        const res = await axios.post('http://localhost:3000/users/login', loginData);
        console.log("Response:", res.data);
        alert(" התחברת בהצלחה!");
        localStorage.setItem('token', res.data.token); 
        
        window.location.href = "../../index.html";
    } catch (err) {
        console.error("Error:", err.response ? err.response.data : err.message);
        alert("הכניסה נכשלה. אנא ודא את שם המשתמש והסיסמה."); 
        
        console.log("Attempted data:", loginData);
        btn.disabled = false;
    }
});
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        console.log("1. Attempting login for email:", email); // האם האימייל נכון?
        
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            console.log("2. Failure: User not found.");
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        console.log("2. Success: User found. Hashed password from DB:", user.password); // האם יש גיבוב ארוך ותקין?

        const isMatch = await bcrypt.compare(password, user.password);
        
        console.log("3. bcrypt.compare result:", isMatch); // התשובה כאן תהיה 'false' אם נכשל

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        // ... אם הגיע לכאן, הצליח ...
    } catch (error) {
        next(error); 
    }
};