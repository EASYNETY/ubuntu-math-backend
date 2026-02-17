import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://qosbot:qosbot@microsrv.j8ond.mongodb.net/jjgtr-ubuntu-math?retryWrites=true&w=majority';

// Configure CORS to allow requests from the frontend domain
app.use(cors({
    origin: [
        'https://ubuntu-math.cams.org.za',
        'https://ubuntu-math.camsorgz.za',
        'http://localhost:5173',
        'http://localhost:5000'
    ],
    credentials: true
}));
app.use(express.json());

app.get('/ping2', (req, res) => res.send('pong2'));
app.use('/api', apiRoutes);
console.log('API routes mounted at /api');

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
    });
