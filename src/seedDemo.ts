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
        await User.deleteMany({ email: { $in: ['demo@i2l.africa', 'admin@i2l.africa', 'sims9898@!'] } });
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

        // Create custom admin user
        const hashedCustomAdminPassword = await bcrypt.hash('Shzi9898@!', 10);
        await User.create({
            email: 'sims9898@!',
            name: 'Simone Admin',
            password: hashedCustomAdminPassword,
            role: 'admin',
            badges: ['Sovereign Oversight']
        });
        console.log('✅ Created custom admin: sims9898@! / Shzi9898@!');

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

        // Create Story 2: Venezuela's Gold Sovereignty
        const story2 = await Story.findOneAndUpdate(
            { slug: 'venezuela-gold-sovereignty' },
            {
                slug: 'venezuela-gold-sovereignty',
                title: 'Venezuela\'s Gold: Sovereign Calculus',
                description: 'How 161 tons of gold can build 17 institutional instruments using Ubuntu Mathematics and the 60/25/15 sovereign wealth distribution model.',
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
                thumbnailUrl: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&q=80&w=800',
                location: 'Caracas, Venezuela',
                region: 'South America',
                innovators: ['Dr. Maria Rodriguez', 'Carlos Mendez'],
                estimatedReadTime: 12,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            { upsert: true, new: true }
        );

        const innovation2 = await Innovation.findOneAndUpdate(
            { storyId: story2._id },
            {
                storyId: story2._id,
                name: 'Sovereign Wealth Distribution System',
                technicalSpecs: {
                    resourceMass: '161 metric tons',
                    troyOunces: '5,177,000 oz',
                    spotValue: '$9.8 billion USD',
                    distribution: '60% Hold / 25% Yield / 15% Community'
                },
                ubuntuValueFormula: 'V = M × 32,150.75 × P | SAV = (V_hold × 0.6) + (V_yield × 0.25) + (V_comm × 0.15)',
                cakeChainModel: {
                    nodes: [
                        { id: 'resource', label: 'Gold Reserves (161T)' },
                        { id: 'conversion', label: 'Troy Conversion' },
                        { id: 'valuation', label: 'Spot Valuation ($9.8B)' },
                        { id: 'distribution', label: '60/25/15 Split' },
                        { id: 'instruments', label: '17 Institutions' }
                    ],
                    edges: [
                        { from: 'resource', to: 'conversion' },
                        { from: 'conversion', to: 'valuation' },
                        { from: 'valuation', to: 'distribution' },
                        { from: 'distribution', to: 'instruments' }
                    ]
                },
                impactMetrics: {
                    commodityDesks: '1',
                    sovereignFunds: '1',
                    tradeSchoolModules: '10',
                    diplomaticInstruments: '5',
                    totalInstitutions: '17'
                },
                createdAt: new Date()
            },
            { upsert: true, new: true }
        );

        const mathModule2 = await MathModule.findOneAndUpdate(
            { innovationId: innovation2._id },
            {
                innovationId: innovation2._id,
                title: 'Sovereign Calculus: Resource to Institutions',
                ubuntuFormula: 'V = M × 32,150.75 × P | Instruments = 1 + 1 + (V/1B) + (V/2B)',
                difficultyLevel: 'hard',
                problemSet: [
                    {
                        question: 'Venezuela has 161 metric tons of gold. Convert this to troy ounces. (1 metric ton = 32,150.75 troy oz)',
                        correctAnswer: 5176271,
                        explanation: 'T = 161 × 32,150.75 = 5,176,270.75 ≈ 5,176,271 troy ounces'
                    },
                    {
                        question: 'If the spot price is $1,900/oz and Venezuela has 5,177,000 troy oz, what is the total value in billions? (Round to 1 decimal)',
                        correctAnswer: 9.8,
                        explanation: 'V = 5,177,000 × $1,900 = $9,836,300,000 ≈ $9.8 billion'
                    },
                    {
                        question: 'Using the 60/25/15 model, how much (in billions) goes to V_hold (60% strategic reserves)?',
                        correctAnswer: 5.88,
                        explanation: 'V_hold = $9.8B × 0.60 = $5.88 billion'
                    },
                    {
                        question: 'How many Trade School Modules can be funded? (Each module costs $1 billion)',
                        correctAnswer: 10,
                        explanation: 'Modules = V / $1B = $9.8B / $1B ≈ 10 modules (rounded)'
                    },
                    {
                        question: 'How many Diplomatic Instruments can be established? (Each costs $2 billion)',
                        correctAnswer: 5,
                        explanation: 'Instruments = V / $2B = $9.8B / $2B ≈ 5 instruments (rounded)'
                    }
                ],
                badgeReward: 'Sovereign Builder',
                estimatedDuration: 20,
                createdAt: new Date()
            },
            { upsert: true, new: true }
        );

        await Story.findByIdAndUpdate(story2._id, {
            innovationId: innovation2._id,
            moduleId: mathModule2._id
        });
        console.log('✅ Created Story 2: Venezuela Gold Sovereignty');

        // Create Story 3: Brilliant Blue Challenge Infrastructure
        const story3 = await Story.findOneAndUpdate(
            { slug: 'brilliant-blue-challenge' },
            {
                slug: 'brilliant-blue-challenge',
                title: 'Brilliant Blue Challenge: Grid Resilience',
                description: 'Using Ubuntu Mathematics to optimize South African power grid infrastructure with dual-mode simulation: Baseline vs Sovereign resilience models.',
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                thumbnailUrl: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=800',
                location: 'Nelson Mandela University, South Africa',
                region: 'Southern Africa',
                innovators: ['SAIEE Engineers', 'IoDSA Governance Team'],
                estimatedReadTime: 15,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            { upsert: true, new: true }
        );

        const innovation3 = await Innovation.findOneAndUpdate(
            { storyId: story3._id },
            {
                storyId: story3._id,
                name: 'Dual-Mode Grid Simulation Engine',
                technicalSpecs: {
                    baselineMode: 'Classical engineering metrics (cost, efficiency, stability)',
                    sovereignMode: 'Ubuntu resilience metrics (CDI, CRF, ISS)',
                    framework: 'Socio-Technical Governance',
                    deployment: 'Nelson Mandela University 2026'
                },
                ubuntuValueFormula: 'Resilience = (CDI × 0.4) + (CRF × 0.3) + (ISS × 0.3)',
                cakeChainModel: {
                    nodes: [
                        { id: 'baseline', label: 'Baseline Optimization' },
                        { id: 'sovereign', label: 'Sovereign Mode' },
                        { id: 'cdi', label: 'Community Dependency' },
                        { id: 'crf', label: 'Cascading Risk' },
                        { id: 'iss', label: 'Interdependence Score' },
                        { id: 'resilience', label: 'System Resilience' }
                    ],
                    edges: [
                        { from: 'baseline', to: 'sovereign' },
                        { from: 'sovereign', to: 'cdi' },
                        { from: 'sovereign', to: 'crf' },
                        { from: 'sovereign', to: 'iss' },
                        { from: 'cdi', to: 'resilience' },
                        { from: 'crf', to: 'resilience' },
                        { from: 'iss', to: 'resilience' }
                    ]
                },
                impactMetrics: {
                    teams: '10+ per school',
                    outageReduction: '35%',
                    resilienceIncrease: '60%',
                    communityImpact: '500,000 residents'
                },
                createdAt: new Date()
            },
            { upsert: true, new: true }
        );

        const mathModule3 = await MathModule.findOneAndUpdate(
            { innovationId: innovation3._id },
            {
                innovationId: innovation3._id,
                title: 'Grid Resilience: Ubuntu vs Baseline',
                ubuntuFormula: 'R = (CDI × 0.4) + (CRF × 0.3) + (ISS × 0.3)',
                difficultyLevel: 'hard',
                problemSet: [
                    {
                        question: 'A grid node serves a clinic (CDI=0.9), school (CDI=0.85), and shops (CDI=0.4). What is the average Community Dependency Index?',
                        correctAnswer: 0.72,
                        explanation: 'CDI_avg = (0.9 + 0.85 + 0.4) / 3 = 2.15 / 3 ≈ 0.72'
                    },
                    {
                        question: 'If an outage causes $50,000 direct loss and triggers $30,000 in secondary disruptions, what is the Cascading Risk Factor (CRF)?',
                        correctAnswer: 0.6,
                        explanation: 'CRF = Secondary / Total = $30,000 / ($50,000 + $30,000) = 30/80 = 0.6'
                    },
                    {
                        question: 'Node A failure impacts 3 other nodes. Node B failure impacts 7 nodes. What is the Interdependence Sensitivity Score ratio (B/A)?',
                        correctAnswer: 2.33,
                        explanation: 'ISS_ratio = 7 / 3 ≈ 2.33 (Node B is 2.33x more critical)'
                    },
                    {
                        question: 'Calculate total Resilience Score: CDI=0.8, CRF=0.5, ISS=0.7 using R = (CDI×0.4) + (CRF×0.3) + (ISS×0.3)',
                        correctAnswer: 0.68,
                        explanation: 'R = (0.8×0.4) + (0.5×0.3) + (0.7×0.3) = 0.32 + 0.15 + 0.21 = 0.68'
                    }
                ],
                badgeReward: 'Innovation Analyst',
                estimatedDuration: 18,
                createdAt: new Date()
            },
            { upsert: true, new: true }
        );

        await Story.findByIdAndUpdate(story3._id, {
            innovationId: innovation3._id,
            moduleId: mathModule3._id
        });
        console.log('✅ Created Story 3: Brilliant Blue Challenge');

        // Create Story 4: Cake Chain Multiplier - Trade Corridors
        const story4 = await Story.findOneAndUpdate(
            { slug: 'cake-chain-multiplier' },
            {
                slug: 'cake-chain-multiplier',
                title: 'The Cake Chain: Sovereign Trade Corridors',
                description: 'Understanding how raw resource exports multiply in value through industrial processing layers - from extraction to finished goods.',
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
                thumbnailUrl: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=800',
                location: 'Pan-African Trade Network',
                region: 'Continental Africa',
                innovators: ['Dr. Kwame Nkrumah Institute', 'AfCFTA Research Team'],
                estimatedReadTime: 10,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            { upsert: true, new: true }
        );

        const innovation4 = await Innovation.findOneAndUpdate(
            { storyId: story4._id },
            {
                storyId: story4._id,
                name: 'Cake Chain Value Multiplication System',
                technicalSpecs: {
                    layers: 'Extraction → Processing → Manufacturing → Distribution → Retail',
                    multiplier: '5x to 20x raw value',
                    framework: 'Sovereign Integrity Integral',
                    application: 'AfCFTA Trade Corridors'
                },
                ubuntuValueFormula: 'V_total = Σ(P_i) | C_m = V_total / P_raw | W_s = ∫(V_total × t) dt',
                cakeChainModel: {
                    nodes: [
                        { id: 'raw', label: 'Raw Export ($1)' },
                        { id: 'processing', label: 'Processing ($3)' },
                        { id: 'manufacturing', label: 'Manufacturing ($8)' },
                        { id: 'distribution', label: 'Distribution ($12)' },
                        { id: 'retail', label: 'Retail ($20)' },
                        { id: 'sovereignty', label: 'Sovereign Wealth' }
                    ],
                    edges: [
                        { from: 'raw', to: 'processing' },
                        { from: 'processing', to: 'manufacturing' },
                        { from: 'manufacturing', to: 'distribution' },
                        { from: 'distribution', to: 'retail' },
                        { from: 'retail', to: 'sovereignty' }
                    ]
                },
                impactMetrics: {
                    valueMultiplier: '20x',
                    corridorsActive: '12 trade routes',
                    nationsParticipating: '23 African countries',
                    wealthRetained: '$45 billion annually'
                },
                createdAt: new Date()
            },
            { upsert: true, new: true }
        );

        const mathModule4 = await MathModule.findOneAndUpdate(
            { innovationId: innovation4._id },
            {
                innovationId: innovation4._id,
                title: 'Cake Chain Mathematics: Value Multiplication',
                ubuntuFormula: 'C_m = V_total / P_raw | V_total = Σ(P_extraction + P_processing + P_manufacturing + P_distribution + P_retail)',
                difficultyLevel: 'medium',
                problemSet: [
                    {
                        question: 'Raw cocoa exports at $2/kg. After processing ($5), manufacturing ($12), and retail ($20), what is the Cake Chain Multiplier?',
                        correctAnswer: 10,
                        explanation: 'C_m = V_total / P_raw = $20 / $2 = 10x multiplier'
                    },
                    {
                        question: 'A nation exports $100M in raw minerals. With a Cake Chain Multiplier of 15x, what is the total potential value?',
                        correctAnswer: 1500,
                        explanation: 'V_total = $100M × 15 = $1,500M = $1.5 billion'
                    },
                    {
                        question: 'Coffee: Raw ($3) → Roasted ($8) → Packaged ($15) → Retail ($25). Calculate the value added from raw to retail.',
                        correctAnswer: 22,
                        explanation: 'Value Added = $25 - $3 = $22 per unit'
                    },
                    {
                        question: 'If a trade corridor generates $500M annually with a 12x multiplier, what was the raw export value?',
                        correctAnswer: 41.67,
                        explanation: 'P_raw = V_total / C_m = $500M / 12 ≈ $41.67M'
                    }
                ],
                badgeReward: 'Story Explorer',
                estimatedDuration: 14,
                createdAt: new Date()
            },
            { upsert: true, new: true }
        );

        await Story.findByIdAndUpdate(story4._id, {
            innovationId: innovation4._id,
            moduleId: mathModule4._id
        });
        console.log('✅ Created Story 4: Cake Chain Multiplier');

        console.log('\n🎉 Demo data seeded successfully!');
        console.log('\n📝 Demo Account:');
        console.log('   Email: demo@i2l.africa');
        console.log('   Password: demo123');
        console.log('   Badges: All 4 badges unlocked');
        console.log('\n📝 Custom Admin:');
        console.log('   Email: sims9898@!');
        console.log('   Password: Shzi9898@!');
        console.log('\n🔗 Stories: 4 stories created with real Ubuntu Mathematics');
        console.log('   1. Niger Delta Drones (Environmental Monitoring)');
        console.log('   2. Venezuela Gold Sovereignty (Resource Conversion)');
        console.log('   3. Brilliant Blue Challenge (Grid Resilience)');
        console.log('   4. Cake Chain Multiplier (Trade Corridors)');

        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Seeding error:', error);
        process.exit(1);
    }
}

seedDemoData();
