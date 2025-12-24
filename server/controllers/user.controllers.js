import User, { generateToken } from "../models/user.models.js";
import bcrypt from 'bcryptjs';


export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            console.log('User not found for email:', req.body.email);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token =await generateToken(user);
        // Do not return the password hash
        return res.status(200).json({ userName: user.userName, token: token });

    } catch (error) {
        next(error); 
    }
};

export const register = async (req, res, next) => {
    try {
          console.log("Register route hit."); 
        const { userName, email,password } = req.body;
        console.log("Received data:", { userName, email });
         const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'User with this email already exists' });
        }

       const hashedPassword = await bcrypt.hash(password, 10); 
        const user = new User({ 
            userName: userName, 
            email: email, 
            password: password,
            role: req.body.role,
            con: req.body.con || [],
            
        }); 
        
        await user.save();
        const token = await generateToken(user);
        // Do not return the password hash
        return res.status(201).json({ userName: user.userName, token: token });

    } catch (error) {

     console.error("Error in register controller:", error); 
        next(error);
    }
};