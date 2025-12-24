import express, { json, urlencoded } from 'express'
import morgan from 'morgan'
import cors from 'cors';
import campaignRouter from './routers/campaign.router.js'
import contributionRouter from './routers/contribution.router.js'
import userRouter from './routers/user.router.js'
import connectDB from './config/db.js'
import categoriesRouter from './routers/categories.router.js'
import { errorHandler, urlNotFound } from './middleware/errors.middleware.js';
import { config } from 'dotenv';
import Grid from 'gridfs-stream';
import mongoose from 'mongoose';
import multer from 'multer';
import { Readable } from 'stream';
import uploadRouter from './routers/upload.routers.js';
import { createServer } from 'http';
import { Server } from "socket.io";


config();
const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // שנה לכתובת ה-Frontend שלך
        methods: ["GET", "POST"]
    }
});
const port = 3000;


connectDB('campaignsDB'); // 1. חיבור למסד נתונים

// 2. הגדרת Middleware
app.use(morgan("dev"));
app.use(cors({ 'origin': 'http://localhost:5173' }));
app.use(json());
app.use(urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.static('src'));

// 3. הגדרת GridFS וניתוב תמונות
let gfs;
const conn = mongoose.connection;
conn.once('open', () => {
    // גרסה חדשה ונקייה של GridFS
    gfs = new mongoose.mongo.GridFSBucket(conn.db, {
        bucketName: 'uploads'
    });
    app.set('gfs', gfs);
    console.log('GridFS ready');
});
app.use('/upload', uploadRouter);
app.get('/', (req, res) => {
    res.sendFile('mainUser.html', { root: './client' });
});


// 4. הגדרת כל הראוטרים
// use - פונקציה שמקבלת את כל הכתובות שמתחילות ב
app.use('/campaigns', campaignRouter);
app.use('/users', userRouter); // **כאן הנתיב /users מוגדר סוף סוף!**
app.use('/contributions', contributionRouter);
app.use('/categories', categoriesRouter);

// 5. הגדרת Middleware לטיפול בשגיאות
app.use(urlNotFound);
app.use(errorHandler);

// --- סוף אזור ההגדרות ---


// --- Socket.io והפעלת השרת ---
io.on('connection', (socket) => {
    console.log('משתמש התחבר ל-Socket.io. ID:', socket.id);

    socket.on('disconnect', () => {
        console.log('משתמש התנתק. ID:', socket.id);
    });
});
export { app, io, server };


server.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Example app listening http://localhost:${port}`);
});
