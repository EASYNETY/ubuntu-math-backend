import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User';
import Story from './models/Story';
import Innovation from './models/Innovation';
import MathModule from './models/MathModule';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://qosbot:qosbot@microsrv.j8ond.mongodb.net/jjgtr-ubuntu-math?retryWrites=true&w=majority';

async function seedDemoData() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing demo data
        await User.deleteMany({ email: { $in: ['demo@i2l.africa', 'admin@i2l.africa'] } });
        console.log('Cleared existing demo & admin users');

        // Create demo user with all badges
        const hashedStudentPassword = await bcrypt.hash('demo123', 10);
        await User.create({
            email: 'demo@i2l.africa',
            name: 'Demo Citizen',
            password: hashedStudentPassword,
            role: 'student',
            badges: ['Story Explorer', 'Innovation Analyst', 'Ubuntu Mathematician', 'Sovereign Builder']
        });
        console.log('✅ Created demo student: demo@i2l.africa / demo123');

        // Create super admin user
        const hashedAdminPassword = await bcrypt.hash('admin123', 10);
        await User.create({
            email: 'admin@i2l.africa',
            name: 'Super Admin',
            password: hashedAdminPassword,
            role: 'admin',
            badges: ['Sovereign Oversight']
        });
        console.log('✅ Created super admin: admin@i2l.africa / admin123');

        // Create Niger Delta Drones story
        const story = await Story.findOneAndUpdate(
            { slug: 'niger-delta-drones' },
            {
                slug: 'niger-delta-drones',
                title: 'Nzinga Drones: Protecting the Niger Delta',
                description: 'How autonomous drones are revolutionizing environmental monitoring in Nigeria\'s oil-rich delta region.',
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                thumbnailUrl: 'https://images.unsplash.com/photo-1473960105265-d2600729598e?auto=format&fit=crop&q=80&w=800',
                location: 'Niger Delta, Nigeria',
                innovators: ['Dr. Amina Okafor', 'Chidi Nnamdi'],
                estimatedReadTime: 8,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            { upsert: true, new: true }
        );
        console.log('✅ Created/Updated Niger Delta Drones story');

        // Create Innovation
        const innovation = await Innovation.findOneAndUpdate(
            { storyId: story._id },
            {
                storyId: story._id,
                name: 'Nzinga Autonomous Monitoring System',
                technicalSpecs: {
                    flightRange: '50km radius',
                    batteryLife: '8 hours continuous',
                    sensors: 'Multi-spectral imaging, Gas detection, Thermal cameras',
                    dataTransmission: 'Real-time satellite uplink',
                    autonomy: 'AI-powered route optimization'
                },
                ubuntuValueFormula: 'SocialDividend = (ResourcesSaved × ImpactMultiplier) / CommunitySize',
                cakeChainModel: {
                    nodes: [
                        { id: 'resources', label: 'Oil Spill Detection' },
                        { id: 'innovation', label: 'Drone Monitoring' },
                        { id: 'community', label: 'Local Fishermen' },
                        { id: 'reinvestment', label: 'Ecosystem Recovery' },
                        { id: 'growth', label: 'Sustainable Livelihoods' }
                    ],
                    edges: [
                        { from: 'resources', to: 'innovation' },
                        { from: 'innovation', to: 'community' },
                        { from: 'community', to: 'reinvestment' },
                        { from: 'reinvestment', to: 'growth' }
                    ]
                },
                impactMetrics: {
                    areaMonitored: '2,500 km²',
                    spillsDetected: '47 incidents',
                    responseTime: '< 2 hours',
                    communitiesServed: '23 villages'
                },
                createdAt: new Date()
            },
            { upsert: true, new: true }
        );
        console.log('✅ Created/Updated Innovation');

        // Create Math Module
        const mathModule = await MathModule.findOneAndUpdate(
            { innovationId: innovation._id },
            {
                innovationId: innovation._id,
                title: 'Ubuntu Mathematics: Drone Monitoring Impact',
                ubuntuFormula: 'CommunalValue = (ResourcesSaved × 0.6) + (StrategicReserves × 0.4)',
                difficultyLevel: 'medium',
                problemSet: [
                    {
                        question: 'If the drones detect an oil spill worth $500,000 in environmental damage, and the community has 1,000 people, what is the Social Dividend per person? (Impact Multiplier = 1.5)',
                        correctAnswer: 750,
                        explanation: 'Social Dividend = (500,000 × 1.5) / 1,000 = 750,000 / 1,000 = $750 per person'
                    },
                    {
                        question: 'If $2,000,000 in resources are saved, what are the Strategic Reserves (30% of resources)?',
                        correctAnswer: 600000,
                        explanation: 'Strategic Reserves = 2,000,000 × 0.30 = $600,000'
                    },
                    {
                        question: 'With a Social Dividend of $1,200 and Strategic Reserves of $800,000 for 1,000 people, what is the Communal Value Score per person?',
                        correctAnswer: 1040,
                        explanation: 'Communal Value = (1,200 × 0.6) + (800 × 0.4) = 720 + 320 = $1,040'
                    },
                    {
                        question: 'If the traditional profit model yields $300 per person, and the Ubuntu model yields $750 per person, what is the percentage increase in community benefit?',
                        correctAnswer: 150,
                        explanation: 'Increase = ((750 - 300) / 300) × 100 = (450 / 300) × 100 = 150%'
                    }
                ],
                badgeReward: 'Ubuntu Mathematician',
                estimatedDuration: 15,
                createdAt: new Date()
            },
            { upsert: true, new: true }
        );
        console.log('✅ Created/Updated Math Module');

        // Update story with innovation and module IDs
        await Story.findByIdAndUpdate(story._id, {
            innovationId: innovation._id,
            moduleId: mathModule._id
        });
        console.log('✅ Linked Story → Innovation → Module');

        console.log('\n🎉 Demo data seeded successfully!');
        console.log('\n📝 Demo Account:');
        console.log('   Email: demo@i2l.africa');
        console.log('   Password: demo123');
        console.log('   Badges: All 4 badges unlocked');
        console.log('\n🔗 Story URL: /story/niger-delta-drones');

        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Seeding error:', error);
        process.exit(1);
    }
}

seedDemoData();
