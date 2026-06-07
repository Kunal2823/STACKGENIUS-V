// ── Profile check: redirect to /login if not set ──
(function () {
  const raw = sessionStorage.getItem('sg_profile');
  if (!raw) { window.location.href = '/login'; return; }
  try {
    const p = JSON.parse(raw);
    if (!p.name || !p.email) { window.location.href = '/login'; }
    window.__sgProfile = p;
    // Name removed from nav intentionally
  } catch { window.location.href = '/login'; }
})();

// ── Shrink nav on scroll ──
window.addEventListener('scroll', function() {
  var nav = document.querySelector('nav');
  if (window.scrollY > 40) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
});

// ── Navigation ──
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  const navEl = document.getElementById('nav-' + id);
  if (navEl) navEl.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Docs search ──
function filterDocs(q) {
  q = q.toLowerCase();
  document.querySelectorAll('.docs-card').forEach(c => {
    c.style.display = (!q || c.textContent.toLowerCase().includes(q)) ? '' : 'none';
  });
  document.querySelectorAll('.docs-category').forEach(cat => {
    const visible = [...cat.querySelectorAll('.docs-card')].some(c => c.style.display !== 'none');
    cat.style.display = visible ? '' : 'none';
  });
}

// ── Textarea counter ──
const ideaInput = document.getElementById('ideaInput');
ideaInput.addEventListener('input', () => {
  document.getElementById('charCount').textContent = ideaInput.value.length + ' / 600';
});
ideaInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); generate(); }
});

// ── Example chips ──
const EXAMPLES = {
  'Dating app':        'A dating app for people who love hiking, with trail-based matching, shared adventure planning, and location-aware suggestions.',
  'E-commerce store':  'A multi-vendor e-commerce platform for handmade crafts with Stripe payments, seller dashboards, inventory tracking, and product reviews.',
  'SaaS dashboard':    'A SaaS analytics dashboard for marketing teams to track campaign ROI across Google Ads, Meta, and email — with AI insights.',
  'Mobile fitness app':'A mobile fitness app with AI-generated workout plans, progress tracking, Apple Health integration, and social challenges.',
  'Real-time chat':    'A real-time team chat app like Slack with channels, direct messages, file sharing, and bot integrations.',
};
function fillExample(btn) {
  ideaInput.value = EXAMPLES[btn.textContent.trim()] || btn.textContent;
  document.getElementById('charCount').textContent = ideaInput.value.length + ' / 600';
  ideaInput.focus();
}

// ── Loading step animation ──
let stepTimer;
function animateSteps() {
  const steps = ['step1','step2','step3','step4'];
  let i = 0;
  steps.forEach(s => { document.getElementById(s).className = 'loading-step'; });
  stepTimer = setInterval(() => {
    if (i > 0) document.getElementById(steps[i-1]).className = 'loading-step done';
    if (i < steps.length) { document.getElementById(steps[i]).className = 'loading-step active'; i++; }
    else clearInterval(stepTimer);
  }, 700);
}

// ── Generate — calls backend ──
async function generate() {
  const idea = ideaInput.value.trim();
  if (!idea) { showError('Please describe your project idea first.'); return; }

  const btn = document.getElementById('generateBtn');
  btn.disabled = true;
  document.getElementById('errorBox').className  = 'error-box';
  document.getElementById('results').className   = 'results';
  document.getElementById('loadingArea').className = 'loading-area active';
  animateSteps();

  const msgs = [
    'Analyzing your project idea...',
    'Consulting the architect...',
    'Evaluating trade-offs...',
    'Almost there...',
  ];
  let mi = 0;
  const msgTimer = setInterval(() => {
    mi = (mi + 1) % msgs.length;
    document.getElementById('loadingText').textContent = msgs[mi];
  }, 1800);

  try {
    const response = await fetch('/api/generate', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ idea }),
    });

    const data = await response.json();
    clearInterval(msgTimer); clearInterval(stepTimer);

    if (!response.ok) throw new Error(data.error || 'Request failed');
    renderResults(idea, data);

  } catch (err) {
    clearInterval(msgTimer); clearInterval(stepTimer);
    document.getElementById('loadingArea').className = 'loading-area';
    showError('Something went wrong: ' + err.message + '. Make sure your server is running and GROQ_API_KEY is set in .env');
  } finally {
    btn.disabled = false;
  }
}

// ── Render results ──
function renderResults(idea, s) {
  document.getElementById('loadingArea').className = 'loading-area';
  document.getElementById('resultsIdea').textContent =
    '"' + idea.substring(0,60) + (idea.length > 60 ? '...' : '') + '"';

  const grid = document.getElementById('stackGrid');
  grid.innerHTML = '';
  [
    { cls:'frontend', label:'Frontend', value:s.frontend, why:s.frontend_why },
    { cls:'backend',  label:'Backend',  value:s.backend,  why:s.backend_why  },
    { cls:'database', label:'Database', value:s.database, why:s.database_why },
    { cls:'hosting',  label:'Hosting',  value:s.hosting,  why:s.hosting_why  },
  ].forEach(c => {
    const d = document.createElement('div');
    d.className = 'stack-card ' + c.cls;
    d.innerHTML =
      '<div class="card-cat"><div class="cat-dot"></div>' + c.label + '</div>' +
      '<div class="card-val">' + (c.value || '—') + '</div>' +
      '<div class="card-why">' + (c.why   || '')  + '</div>';
    grid.appendChild(d);
  });

  if (s.reason) {
    document.getElementById('reasonText').textContent = s.reason;
    document.getElementById('reasonCard').style.display = 'block';
  }
  if (s.difficulty || s.timeline || s.cost) {
    document.getElementById('statDifficulty').textContent = s.difficulty || '—';
    document.getElementById('statTimeline').textContent   = s.timeline   || '—';
    document.getElementById('statCost').textContent       = s.cost       || '—';
    document.getElementById('statsBar').style.display = 'flex';
  }
  if (s.suggestions && s.suggestions.length) {
    const list = document.getElementById('suggestionList');
    list.innerHTML = '';
    s.suggestions.forEach((sg, i) => {
      const li = document.createElement('li');
      li.className = 'suggestion-item';
      li.innerHTML =
        '<span class="suggestion-num">0' + (i+1) + '</span>' +
        '<span>' + sg + '</span>';
      list.appendChild(li);
    });
    document.getElementById('suggestionsSection').style.display = 'block';
  }

  document.getElementById('results').className = 'results active';
  document.getElementById('resetBtn').className = 'reset-btn active';
  document.getElementById('results').scrollIntoView({ behavior:'smooth', block:'start' });
}

// ── Helpers ──
function showError(msg) {
  const b = document.getElementById('errorBox');
  b.textContent = msg;
  b.className = 'error-box active';
}

function resetGen() {
  ideaInput.value = '';
  document.getElementById('charCount').textContent = '0 / 600';
  document.getElementById('results').className = 'results';
  document.getElementById('resetBtn').className = 'reset-btn';
  document.getElementById('errorBox').className = 'error-box';
  document.getElementById('reasonCard').style.display = 'none';
  document.getElementById('statsBar').style.display = 'none';
  document.getElementById('suggestionsSection').style.display = 'none';
  window.scrollTo({ top:0, behavior:'smooth' });
  setTimeout(() => ideaInput.focus(), 500);
}
