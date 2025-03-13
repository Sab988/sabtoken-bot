require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const TonWeb = require('tonweb');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
});

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

// TON Configuration
const tonweb = new TonWeb(new TonWeb.HttpProvider('https://toncenter.com/api/v2/jsonRPC', {
  apiKey: process.env.TON_API_KEY
}));

// Telegram Webhook
app.post('/telegram-webhook', async (req, res) => {
  const { message } = req.body;
  if (message?.text === '/start') {
    await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: message.chat.id,
      text: '🚀 Welcome to SAB Token Bot! Use the menu to start earning tokens.'
    });
  }
  res.sendStatus(200);
});

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
          referralCode: Math.random().toString(36).substr(2, 8).toUpperCase()
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
      res.json({ success: true, user });
    } else {
      res.status(400).json({ error: 'Daily limit reached' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
