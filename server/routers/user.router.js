import { Router } from "express";
import { isValidObjectId } from 'mongoose';
import users, { validUser } from '../models/user.models.js';
import authenticateToken from '../middleware/auth.js';
import { login, register } from '../controllers/user.controllers.js';
import checkAdminRole from '../middleware/checkAdminRole.middleware.js';
import bcrypt from 'bcrypt';

const router = Router();

router.get('/', authenticateToken, checkAdminRole, async (req, res, next) => {

    try {
        const allUsers = await users.find({})
            .select('-password');
        res.status(200).json(allUsers);
    } catch (error) {
        next(error);
    }
});
router.get('/me', authenticateToken, async (req, res, next) => {
    try {
        const user = await users.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
});
router.get('/:id', authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }
        if (req.user.id !== id && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Forbidden" });
        }
        const user = await users.findById(id).select('-password');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
});


router.post('/login', login);
router.post('/register', register);

router.delete('/:id', authenticateToken, checkAdminRole, async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }
        const user = await users.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(204).end();
    } catch (error) {
        next(error);
    }
});

router.put('/:id', authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { role } = req.user;

        if (req.user.id !== id && role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const allowedUpdates = ['email', 'userName', 'con', 'role'];
        const updates = {};
        for (const key in req.body) {
             if (allowedUpdates.includes(key) && req.body[key] !== undefined) {
                updates[key] = req.body[key];
            }
        }
         const userToUpdate = await users.findById(id).select('+password'); // שונתה לשם ברור יותר
        
        if (!userToUpdate) {
            return res.status(404).json({ message: 'User not found' });
        }
        Object.assign(userToUpdate, updates); 
        const newPassword = req.body.password;
        if (newPassword && newPassword.length > 0) {
            userToUpdate.password = newPassword; 
        }
        const updatedUser = await userToUpdate.save({ validateBeforeSave: true }); 
        
    
        const finalUser = await users.findById(updatedUser._id).select('-password');
        
        res.status(200).json(finalUser);
        
    } catch (error) {
        next(error);
    }
});

export default router;