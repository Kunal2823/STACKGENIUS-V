const express   = require('express');
const cors      = require('cors');
const path      = require('path');
const rateLimit = require('express-rate-limit');
const { callGroq } = require('./groq');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '..', 'public')));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Too many requests. Please wait a minute and try again.' }
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

app.post('/api/profile', (req, res) => {
  const { name, email, role, experience, interests, country } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email required.' });
  console.log(`👤 New user: ${name} | ${role} | ${experience}`);
  res.json({ ok: true });
});

app.post('/api/generate', limiter, async (req, res) => {
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

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ StackGenius running → http://localhost:${PORT}`);
  if (!process.env.GROQ_API_KEY) {
    console.warn(`⚠️  GROQ_API_KEY not set — add it to .env`);
  }
});