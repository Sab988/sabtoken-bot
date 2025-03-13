require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors({
    origin: 'https://sabbot.vercel.app'
}));
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB Error:', err));

// User Schema
const userSchema = new mongoose.Schema({
    telegramId: { type: String, unique: true },
    username: String,
    photoUrl: String,
    balance: { type: Number, default: 0 },
    referrals: { type: Number, default: 0 },
    referralCode: String,
    dailyLimit: { type: Number, default: 1500 },
    lastClick: Date,
    walletAddress: String
});

const User = mongoose.model('User', userSchema);

// API Endpoints
app.post('/api/user', async (req, res) => {
    try {
        const user = await User.findOneAndUpdate(
            { telegramId: req.body.user.id },
            {
                $setOnInsert: {
                    telegramId: req.body.user.id,
                    username: req.body.user.username,
                    photoUrl: req.body.user.photo_url,
                    referralCode: generateReferralCode()
                }
            },
            { upsert: true, new: true }
        );
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/click', async (req, res) => {
    try {
        const user = await User.findById(req.body.userId);
        if (user.dailyLimit > 0) {
            user.balance += 1;
            user.dailyLimit -= 1;
            user.lastClick = new Date();
            await user.save();
            return res.json({ success: true, user });
        }
        res.status(400).json({ error: 'Daily limit reached' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Helper
function generateReferralCode() {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
