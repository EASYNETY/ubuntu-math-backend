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
        'https://ubuntu-math-frontend.vercel.app',
        'https://ubuntu-math.cams.org.za',
        'http://localhost:5173',
        'http://localhost:5000'
    ],
    credentials: true
}));
app.use(express.json());

// Connect to MongoDB
let isConnected = false;
const connectDB = async () => {
    if (isConnected) {
        return;
    }
    try {
        await mongoose.connect(MONGODB_URI);
        isConnected = true;
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        throw err;
    }
};

// Middleware to ensure DB connection
app.use(async (req, res, next) => {
    await connectDB();
    next();
});

app.get('/ping2', (req, res) => res.send('pong2'));
app.use('/api', apiRoutes);

// For local development
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

// Export for Vercel serverless
export default app;
