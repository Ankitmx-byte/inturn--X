const mongoose = require('mongoose');
const QuizProgress = require('./models/QuizProgress');
const User = require('./models/User');

const MONGODB_URI = 'mongodb://localhost:27017/inturnx';

async function checkProgress() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const progress = await QuizProgress.find({});
        console.log(`Found ${progress.length} progress entries:`);

        for (const p of progress) {
            const user = await User.findById(p.userId);
            console.log('----------------------------------------');
            console.log(`User: ${user ? user.email : 'Unknown'}`);
            console.log(`ID: ${p.userId}`);
            console.log(`Lang: ${p.language}`);
            console.log(`Lvl: ${p.completedLevels} (Curr: ${p.currentLevel})`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkProgress();
