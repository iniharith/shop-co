const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const bcrypt = require('bcryptjs');
        const db = mongoose.connection.useDb('shop-co');
        const hash = await bcrypt.hash('Gemini', 10);
        const result = await db.collection('users').updateOne(
            { email: 'Gemini@kampungcetak.com' },
            { $set: { password: hash } }
        );
        if (result.matchedCount === 0) {
            console.log('User not found!');
        } else {
            console.log('Password successfully reset to "Gemini"!');
        }
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
});
