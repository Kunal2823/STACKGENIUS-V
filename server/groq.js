const https = require('https');

const SYSTEM_PROMPT = `You are a world-class Senior Software Architect in 2026.
Analyze the user's project idea and return ONLY a valid JSON object (no markdown, no backticks, no extra text) with these exact keys:
{
  "frontend":      "The best frontend technology for this specific project",
  "frontend_why":  "One sentence explaining why this frontend fits this project",
  "backend":       "The best backend technology for this specific project",
  "backend_why":   "One sentence explaining why this backend fits this project",
  "database":      "The best database for this specific project",
  "database_why":  "One sentence explaining why this database fits this project",
  "hosting":       "The best hosting platform for this specific project",
  "hosting_why":   "One sentence explaining why this hosting fits this project",
  "auth":          "The best auth solution for this specific project",
  "auth_why":      "One sentence explaining why this auth fits this project",
  "reason":        "2-3 sentences on the overall architecture philosophy and why this stack fits the project",
  "difficulty":    <integer 1-10 reflecting true build complexity: 1=simple landing page, 5=standard CRUD app, 8=real-time/ML/complex, 10=enterprise-scale>,
  "timeline":      "<realistic time estimate, e.g. '1-2 weeks', '2-3 months', '6+ months'>",
  "cost":          "<realistic monthly hosting+infra cost, e.g. '$0 (free tier)', '$5-20/mo', '$50-200/mo'>",
  "suggestions":   ["Specific actionable suggestion 1 for this project","Suggestion 2","Suggestion 3","Suggestion 4"]
}
Rules:
- difficulty, timeline, and cost must reflect the ACTUAL complexity of the user's idea — not generic defaults.
- A simple portfolio site is difficulty 1-2, $0, 1-2 weeks. A real-time trading platform is difficulty 9, $200+/mo, 12+ months.
- suggestions must be specific to the project idea, not generic advice.
- Return ONLY the raw JSON. No markdown, no backticks, no explanation.`;

const GROQ_OPTIONS = {
  hostname: 'api.groq.com',
  path:     '/openai/v1/chat/completions',
  method:   'POST',
};

function httpsPost(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Request timed out. Please try again.'));
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function callGroq(idea) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY is not set. Add it to your .env file.');

  const payload = JSON.stringify({
    model:      'llama-3.3-70b-versatile',
    max_tokens: 1200,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: `Project idea: ${idea}` },
    ],
  });

  const result = await httpsPost({
    ...GROQ_OPTIONS,
    headers: {
      'Content-Type':   'application/json',
      'Authorization':  `Bearer ${key}`,
      'Content-Length': Buffer.byteLength(payload),
    },
  }, payload);

  if (result.status !== 200) {
    const msg = result.body?.error?.message || JSON.stringify(result.body);
    throw new Error(`Groq API error (${result.status}): ${msg}`);
  }

  const rawText = result.body?.choices?.[0]?.message?.content || '';

  let clean = rawText.replace(/```json|```/gi, '').trim();
  const jsonMatch = clean.match(/\{[\s\S]*\}/);
  if (jsonMatch) clean = jsonMatch[0];

  if (!clean) throw new Error('Empty response from Groq. Please try again.');

  try {
    return JSON.parse(clean);
  } catch {
    throw new Error('AI returned unexpected format. Please try again.');
  }
}

module.exports = { callGroq };