const express = require('express');
const cors    = require('cors');
const path    = require('path');
const { callGroq } = require('./claude');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve the frontend (public folder)
app.use(express.static(path.join(__dirname, '..', 'public')));

// ── Login page ──
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

// ── Save user profile ──
const profiles = new Map();
app.post('/api/profile', (req, res) => {
  const { name, email, role, experience, interests, country } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email required.' });
  profiles.set(email, { name, email, role, experience, interests, country, joinedAt: new Date() });
  console.log(`👤 New user: ${name} | ${role} | ${experience}`);
  res.json({ ok: true });
});

// ── Stack generation ──
app.post('/api/generate', async (req, res) => {
  const { idea } = req.body;

  if (!idea || typeof idea !== 'string' || idea.trim().length < 5) {
    return res.status(400).json({ error: 'Please provide a valid project idea.' });
  }

  try {
    const result = await callGroq(idea.trim());
    res.json(result);
  } catch (err) {
    console.error('Groq API error:', err.message);
    res.status(500).json({ error: err.message || 'Something went wrong. Please try again.' });
  }
});

// Catch-all: serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ StackGenius running → http://localhost:${PORT}`);
  console.log(`   Login page: http://localhost:${PORT}/login`);
  if (!process.env.GROQ_API_KEY) {
    console.warn(`⚠️  WARNING: GROQ_API_KEY is not set! Add it to your .env file.`);
  } else {
    console.log(`🔑 GROK_API_KEY loaded (starts with: ${process.env.GROQ_API_KEY.substring(0,8)}...)`);
  }
});
