import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import Student from '../model/schema.js';
import fs from 'fs';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const newFile = Date.now() + path.extname(file.originalname);
        cb(null, newFile);
    }
});

const filter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only images are allowed'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: filter,
    limits: {
        fileSize: 1024 * 1024 * 3
    }
});
router.get('/', async (req, res) => {
    try {
        const search = req.query.search || "";
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 3;
        const query = {
            $or: [
                { first_name: { $regex: search, $options: "i" } },
                { last_name: { $regex: search, $options: "i" } }
            ]
        };

        const total = await Student.countDocuments(query);

        const students = await Student.find(query)
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({
            students,
            totalPage: Math.ceil(total / limit)
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        res.json(student);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/', upload.single('profile_pic'), async (req, res) => {
    try {
        const student = new Student(req.body);
        if (req.file) {
            student.profile_pic = req.file.filename;
        }

        const newStudent = await student.save();

        res.json(newStudent);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.put('/:id', upload.single('profile_pic'), async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        if (req.file) {
            if (student.profile_pic) {
                const filepath = path.join(uploadsDir, student.profile_pic);

                fs.unlink(filepath, (err) => {
                    if (err) console.log('Image delete error:', err);
                });
            }
            req.body.profile_pic = req.file.filename;
        }

        const updatedStudent = await Student.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.json(updatedStudent);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const deleteStudent = await Student.findByIdAndDelete(req.params.id);

        if (!deleteStudent) {
            return res.status(404).json({ message: 'Student not found' });
        }
        if (deleteStudent.profile_pic) {
            const filepath = path.join(uploadsDir, deleteStudent.profile_pic);

            fs.unlink(filepath, (err) => {
                if (err) console.log('Failed to delete image:', err);
            });
        }

        res.json({ message: 'Deleted Successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;