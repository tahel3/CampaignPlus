import { Router } from "express";
import multer from "multer";
import { Readable } from "stream";
import mongoose from "mongoose";

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// העלאת קובץ
router.post("/", upload.single("file"), async (req, res) => {
    try {
        const gfs = req.app.get("gfs");
        if (!gfs) return res.status(500).send("GridFS not initialized");
        if (!req.file) return res.status(400).send("No file uploaded");

        // הופכים את הקובץ ל-Readable Stream
        const readableStream = new Readable();
        readableStream.push(req.file.buffer);
        readableStream.push(null);

        // משתמשים ב-openUploadStream מה-API החדש
        const uploadStream = gfs.openUploadStream(req.file.originalname, {
            contentType: req.file.mimetype
        });

        readableStream.pipe(uploadStream);

        uploadStream.on("finish", () => {
            // כאן משתמשים ב-uploadStream.id ולא ב-file._id
            res.status(201).json({ fileId: uploadStream.id, filename: req.file.originalname });
        });

        uploadStream.on("error", (err) => {
            res.status(500).json({ error: "Error uploading file", details: err.message });
        });
    } catch (err) {
        res.status(500).json({ error: "Server error", details: err.message });
    }
});

// שליפת קובץ לפי ID
router.get("/:id", async (req, res) => {
    try {
        const gfs = req.app.get("gfs");
        if (!gfs) return res.status(500).send("GridFS not initialized");

        const fileId = new mongoose.Types.ObjectId(req.params.id);
        const downloadStream = gfs.openDownloadStream(fileId);

        downloadStream.on("error", () => {
            res.status(404).send("File not found");
        });

        downloadStream.pipe(res);
    } catch (err) {
        res.status(500).json({ error: "Server error", details: err.message });
    }
});

export default router;