/**
 * MemoLib Gmail Extension — Content Script
 *
 * Injecte un bouton "MemoLib" dans l'interface Gmail.
 * Quand l'utilisateur ouvre un email et clique sur le bouton,
 * envoie l'email à l'API MemoLib pour analyse.
 */

const MEMOLIB_URL = localStorage.getItem('memolib_url') || 'https://app.memolib.space';
const API_KEY = localStorage.getItem('memolib_api_key') || '';

// ─── INJECTION DU BOUTON ─────────────────────────────────────

function injectButton() {
  // Attendre que la toolbar Gmail soit présente
  const toolbar = document.querySelector('[gh="mtb"]') || document.querySelector('.ade');
  if (!toolbar || toolbar.querySelector('#memolib-btn')) return;

  const btn = document.createElement('div');
  btn.id = 'memolib-btn';
  btn.innerHTML = `
    <button class="memolib-action-btn" title="Analyser avec MemoLib">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
      </svg>
      <span>MemoLib</span>
    </button>
  `;
  btn.addEventListener('click', analyzeCurrentEmail);
  toolbar.appendChild(btn);
}

// ─── EXTRACTION EMAIL ────────────────────────────────────────

function extractEmailContent() {
  // Sujet
  const subjectEl = document.querySelector('h2.hP') || document.querySelector('[data-legacy-thread-id]');
  const subject = subjectEl?.textContent?.trim() || '';

  // Expéditeur
  const fromEl = document.querySelector('.gD') || document.querySelector('[email]');
  const from = fromEl?.getAttribute('email') || fromEl?.textContent?.trim() || '';

  // Corps
  const bodyEl = document.querySelector('.a3s.aiL') || document.querySelector('[data-message-id] .ii.gt');
  const body = bodyEl?.textContent?.trim() || '';

  // Message ID (depuis les headers si visible)
  const messageId = document.querySelector('[data-message-id]')?.getAttribute('data-message-id') || '';

  return { subject, body, from, messageId };
}

// ─── ANALYSE ─────────────────────────────────────────────────

async function analyzeCurrentEmail() {
  if (!API_KEY) {
    showSidebar({ error: 'Configurez votre clé API dans les options de l\'extension.' });
    return;
  }

  const email = extractEmailContent();
  if (!email.body) {
    showSidebar({ error: 'Ouvrez un email pour l\'analyser.' });
    return;
  }

  showSidebar({ loading: true });

  try {
    const res = await fetch(`${MEMOLIB_URL}/api/integrations/gmail/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
      body: JSON.stringify(email),
    });

    if (!res.ok) throw new Error(`Erreur ${res.status}`);
    const data = await res.json();
    showSidebar({ data });
  } catch (err) {
    showSidebar({ error: `Connexion échouée : ${err.message}` });
  }
}

// ─── SIDEBAR ─────────────────────────────────────────────────

function showSidebar(state) {
  let sidebar = document.getElementById('memolib-sidebar');
  if (!sidebar) {
    sidebar = document.createElement('div');
    sidebar.id = 'memolib-sidebar';
    document.body.appendChild(sidebar);
  }

  if (state.loading) {
    sidebar.innerHTML = `<div class="memolib-sidebar-content"><div class="memolib-loading">Analyse en cours...</div></div>`;
    sidebar.classList.add('open');
    return;
  }

  if (state.error) {
    sidebar.innerHTML = `<div class="memolib-sidebar-content"><div class="memolib-error">${state.error}</div></div>`;
    sidebar.classList.add('open');
    return;
  }

  const { data } = state;
  const summary = data.summary || {};
  const client = data.client;

  sidebar.innerHTML = `
    <div class="memolib-sidebar-content">
      <div class="memolib-header">
        <strong>MemoLib</strong>
        <button onclick="document.getElementById('memolib-sidebar').classList.remove('open')">✕</button>
      </div>

      ${data.alreadyImported ? '<div class="memolib-badge green">✓ Déjà importé</div>' : ''}

      ${summary.urgence ? `
        <div class="memolib-section">
          <div class="memolib-badge ${summary.urgence === 'critique' ? 'red' : summary.urgence === 'haute' ? 'orange' : 'blue'}">
            ${summary.urgence.toUpperCase()}
          </div>
          <p class="memolib-type">${summary.typeDossier || 'GÉNÉRAL'}</p>
          <p class="memolib-summary">${summary.resumeCourt || summary.objet || ''}</p>
          ${summary.actionRequise ? `<p class="memolib-action">→ ${summary.actionRequise}</p>` : ''}
          ${summary.deadlineDetectee ? `<p class="memolib-deadline">⏰ ${summary.deadlineDetectee}</p>` : ''}
        </div>
      ` : '<div class="memolib-section"><p>Analyse indisponible</p></div>'}

      ${client ? `
        <div class="memolib-section">
          <h4>Client connu</h4>
          <p><strong>${client.name}</strong></p>
          ${client.dossiers.map(d => `<p class="memolib-dossier">${d.numero} — ${d.typeDossier} (${d.statut})</p>`).join('')}
        </div>
      ` : '<div class="memolib-section muted">Client non reconnu</div>'}

      ${!data.alreadyImported ? `
        <button class="memolib-create-btn" onclick="window.open('${MEMOLIB_URL}/dossiers/nouveau?from=gmail', '_blank')">
          + Créer un dossier
        </button>
      ` : ''}

      <a class="memolib-link" href="${MEMOLIB_URL}/dashboard" target="_blank">Ouvrir MemoLib →</a>
    </div>
  `;
  sidebar.classList.add('open');
}

// ─── OBSERVER ────────────────────────────────────────────────

// Gmail est une SPA, on observe les changements de DOM
const observer = new MutationObserver(() => {
  injectButton();
});

observer.observe(document.body, { childList: true, subtree: true });
injectButton();
