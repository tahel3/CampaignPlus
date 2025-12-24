import Joi from 'joi';
import mongoose, { model, Schema } from 'mongoose'
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const usersSchema = new Schema({
    userName: String,
    email: { type: String, unique: true, sparse: true },
    con: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'contributions'
    }],
    password: {
        type: String,
        select: false
    },
    role: { type: String, enum: ['admin', 'user'], default: 'user' }
});

usersSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        return next(err);
    }
});

export const validUser = {
    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(8).required(),
    }),
    register: Joi.object({
        userName: Joi.string().required(),
        password: Joi.string().min(8).required(),
        email: Joi.string().email().required(),
        con: Joi.array().items(Joi.string()),
        role: Joi.string().valid('admin', 'user').default('user')
    })
}

export  const generateToken = async (user) => {
    const payload = { id: user._id, role: user.role };
    let expiryTime;
    if (user.role === 'admin') {
        expiryTime = '1d';
    } else {
        expiryTime = '1h';
    }
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: expiryTime });
    return token;
};
const users = model('users', usersSchema);
usersSchema.set('toJSON', {
    virtuals: true,  // מאפשר שליפת שדות וירטואליים
    getters: true    // מאפשר שליפת getters
});
export default users;
export { usersSchema };