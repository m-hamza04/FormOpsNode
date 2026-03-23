import express from 'express';
import { connection } from './config/connection.js';
import routes from './routes/routes.js';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory');
}

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));
app.use(cors());
app.use('/api/students', routes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

connection();

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});