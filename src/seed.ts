import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User';
import Story from './models/Story';
import Innovation from './models/Innovation';
import MathModule from './models/MathModule';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://qosbot:qosbot@microsrv.j8ond.mongodb.net/jjgtr-ubuntu-math?retryWrites=true&w=majority';

const seed = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB for seeding');

        // Clear existing
        await User.deleteMany({});
        await Story.deleteMany({});
        await Innovation.deleteMany({});
        await MathModule.deleteMany({});

        // Create Demo User
        const hashedPassword = await bcrypt.hash('demo123', 12);
        const demoUser = await User.create({
            email: 'demo@i2l.africa',
            password: hashedPassword,
            name: 'Demo User',
            role: 'student',
            badges: []
        });
        console.log('User created:', demoUser.email);

        // Create Innovation
        const innovation = await Innovation.create({
            name: 'Drone Monitoring in Niger Delta',
            storyId: new mongoose.Types.ObjectId(), // Placeholder updated later
            technicalSpecs: { range: '50km', battery: '4h' },
            ubuntuValueFormula: 'SocialDividend = (Resources * 1.8) / Community',
            cakeChainModel: { nodes: [], edges: [] },
            impactMetrics: { efficiency: 0.85 }
        });
        console.log('Innovation created:', innovation.name);

        // Create Math Module
        const mathModule = await MathModule.create({
            innovationId: innovation._id,
            title: 'Calculating Social Dividend',
            ubuntuFormula: 'SD = (R * M) / C',
            difficultyLevel: 'medium',
            problemSet: [
                {
                    question: 'If Resources=1000 and Community=50, what is Social Dividend? (M=1.8)',
                    correctAnswer: 36,
                    explanation: '1000 * 1.8 = 1800. 1800 / 50 = 36'
                }
            ],
            badgeReward: 'Ubuntu Mathematician',
            estimatedDuration: 15
        });
        console.log('Math Module created:', mathModule.title);

        // Create Story
        const story = await Story.create({
            slug: 'niger-delta-drones',
            title: 'Wings Over the Delta',
            description: 'How local youths are using drones to protect their environment.',
            location: 'Niger Delta, Nigeria',
            innovators: ['Adeola', 'Chinedu'],
            innovationId: innovation._id,
            moduleId: mathModule._id,
            estimatedReadTime: 5,
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Altja_j%C3%B5gi_Lahemaal.jpg/1200px-Altja_j%C3%B5gi_Lahemaal.jpg'
        });
        console.log('Story created:', story.title);

        // Update innovation with storyId
        innovation.storyId = story._id as mongoose.Types.ObjectId;
        await innovation.save();

        console.log('Seeding complete');
        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seed();
