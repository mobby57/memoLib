
        const API_URL = (() => {
            const origin = window.location.origin;
            if (origin && /localhost:3000$/i.test(origin)) return 'http://localhost:5078';
            if (origin && origin.startsWith('http')) return origin;
            return 'http://localhost:5078';
        })();
        const UI_MODE = (new URLSearchParams(window.location.search).get('mode') || 'complete').toLowerCase();
        const IS_RESTRICTED = UI_MODE === 'restricted';
        let token = null;
        let installPromptEvent = null;
        let lastCaseId = null;
        let lastEventId = null;
        let selectedClientId = null;
        let selectedClientRaw = null;
        let realtimeDashboard = null;
        let templateManager = null;
        let criticalAlerts = null;

        // SystÃ¨me d'alertes critiques
        class CriticalAlertSystem {
            constructor(apiUrl, token) {
                this.apiUrl = apiUrl;
                this.token = token;
                this.connection = null;
                this.soundEnabled = true;
            }

            async initialize() {
                this.connection = new signalR.HubConnectionBuilder()
                    .withUrl(`${this.apiUrl}/notificationHub`)
                    .build();

                this.connection.on('UrgentAlert', (data) => {
                    this.showCriticalAlert(data);
                    if (this.soundEnabled) this.playUrgentSound();
                });

                this.connection.on('DeadlineAlert', (data) => {
                    this.showDeadlineAlert(data);
                });

                this.connection.on('NewEmail', (data) => {
                    this.updateEmailCounter(data.count);
                    this.showEmailNotification(data);
                });

                await this.connection.start();
            }

            showCriticalAlert(data) {
                const alertHtml = `
                    <div class="critical-alert" style="position:fixed;top:20px;right:20px;z-index:9999;background:#dc3545;color:white;padding:20px;border-radius:10px;box-shadow:0 5px 20px rgba(220,53,69,0.5);max-width:400px;">
                        <div style="display:flex;align-items:center;gap:10px;">
                            <span style="font-size:24px;">ðŸš¨</span>
                            <div>
                                <strong>ALERTE CRITIQUE</strong><br>
                                <span>${data.message}</span><br>
                                <small>${new Date(data.timestamp).toLocaleString('fr-FR')}</small>
                            </div>
                            <button onclick="this.parentElement.parentElement.remove()" style="background:none;border:none;color:white;font-size:20px;cursor:pointer;">Ã—</button>
                        </div>
                    </div>
                `;
                document.body.insertAdjacentHTML('beforeend', alertHtml);
                setTimeout(() => {
                    const alert = document.querySelector('.critical-alert');
                    if (alert) alert.remove();
                }, 10000);
            }

            playUrgentSound() {
                const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
                audio.volume = 0.3;
                audio.play().catch(() => {});
            }
        }

        function persistSession(email, jwtToken) {
            if (!jwtToken) return;
            token = jwtToken;
            localStorage.setItem('authToken', jwtToken);
            localStorage.setItem('memolibAuthToken', jwtToken);
            sessionStorage.setItem('authToken', jwtToken);
            if (email) {
                localStorage.setItem('memolibUserEmail', email);
            }
        }

        function restoreSession() {
            const storedToken = localStorage.getItem('authToken')
                || localStorage.getItem('memolibAuthToken')
                || sessionStorage.getItem('authToken');
            const storedEmail = localStorage.getItem('memolibUserEmail');

            if (storedToken) {
                token = storedToken;
            }

            if (storedEmail) {
                updateCurrentUserDisplay(storedEmail);
            }
        }

        function applyAccessMode() {
            const accessModeText = document.getElementById('accessModeText');
            if (accessModeText) {
                accessModeText.textContent = IS_RESTRICTED
                    ? 'Mode accÃ¨s: restreint (Alertes masquÃ©es)'
                    : 'Mode accÃ¨s: complet';
            }

            if (!IS_RESTRICTED) return;

            const alertsTabButton = document.getElementById('alertsTabButton');
            const alertsTab = document.getElementById('alerts-tab');
            if (alertsTabButton) alertsTabButton.style.display = 'none';
            if (alertsTab) alertsTab.classList.add('hidden');
        }

        async function readResponseDataSafe(response) {
            const text = await response.text();
            if (!text || !text.trim()) return null;

            try {
                return JSON.parse(text);
            } catch {
                return text;
            }
        }

        function extractMetaFromBody(bodyText) {
            const body = (bodyText || '').toString();
            const getMatch = (label) => {
                const regex = new RegExp(`${label}\\s*:\\s*([^\\n\\r]+)`, 'i');
                const match = body.match(regex);
                return match ? match[1].trim() : null;
            };

            const clientId = getMatch('ClientId');
            const clientDbId = getMatch('ClientDbId');
            const annexesRaw = getMatch('Annexes');
            const annexes = annexesRaw ? annexesRaw.split(';').map(x => x.trim()).filter(Boolean) : [];

            const cleanedBody = body
                .replace(/ClientId\s*:[^\n\r]+/gi, '')
                .replace(/ClientDbId\s*:[^\n\r]+/gi, '')
                .replace(/Annexes\s*:[^\n\r]+/gi, '')
                .replace(/\n{2,}/g, '\n')
                .trim();

            return { clientId, clientDbId, annexes, cleanedBody };
        }

        function parseRawPayloadSafe(rawPayload) {
            if (!rawPayload) return {};
            try {
                return typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload;
            } catch {
                return {};
            }
        }

        function buildReadableEventDigest(payload, occurredAt, options = {}) {
            const includeFullBody = options.includeFullBody === true;
            const from = payload?.from || payload?.From || 'ExpÃ©diteur non identifiÃ©';
            const subject = payload?.subject || payload?.Subject || 'Sujet non renseignÃ©';
            const body = payload?.body || payload?.Body || '';
            const meta = extractMetaFromBody(body);
            const cleaned = (meta.cleanedBody || body || '').trim();
            const shortWhat = includeFullBody ? cleaned : (cleaned.length > 220 ? `${cleaned.substring(0, 220)}...` : cleaned);

            const what = shortWhat || 'Contenu non disponible';
            const when = new Date(occurredAt).toLocaleString('fr-FR');

            let actionStatus = 'Action informative';
            let actionDetail = 'VÃ©rifier le contenu et rattacher au bon dossier si nÃ©cessaire.';
            if (meta.annexes.length > 0) {
                actionStatus = 'Action normale';
                actionDetail = 'VÃ©rifier les annexes et les joindre au dossier.';
            }
            if (meta.clientId) {
                actionStatus = 'Action prioritaire';
                actionDetail = `Ouvrir le dossier client ${meta.clientId} pour traitement.`;
            }

            return {
                who: from,
                when,
                what,
                actionStatus,
                actionDetail,
                meta
            };
        }

        function jumpToClientSearch(clientId) {
            if (!clientId) return;
            const input = document.getElementById('search-text');
            if (input) input.value = clientId;
            showTab('search');
        }

        async function createCaseFromEvent(eventId, encodedTitle) {
            if (!token) {
                alert('Connectez-vous d\'abord');
                return;
            }

            const fallbackTitle = 'Dossier depuis email';
            const suggestedTitle = encodedTitle ? decodeURIComponent(encodedTitle) : fallbackTitle;
            const title = (suggestedTitle || fallbackTitle).trim().substring(0, 180) || fallbackTitle;

            try {
                const createRes = await fetch(`${API_URL}/api/cases`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ title })
                });
                const createdCasePayload = await readResponseDataSafe(createRes);

                if (!createRes.ok) {
                    alert('Impossible de crÃ©er le dossier');
                    return;
                }

                const createdCaseId =
                    typeof createdCasePayload === 'string'
                        ? createdCasePayload
                        : createdCasePayload?.id || createdCasePayload?.caseId || createdCasePayload;

                if (!createdCaseId) {
                    alert('Dossier crÃ©Ã© mais identifiant non retournÃ© par lâ€™API');
                    return;
                }

                const attachRes = await fetch(`${API_URL}/api/cases/${createdCaseId}/events/${eventId}`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!attachRes.ok) {
                    const text = await attachRes.text();
                    alert(`Dossier crÃ©Ã© (${createdCaseId}) mais liaison Ã©vÃ©nement en erreur: ${text}`);
                    return;
                }

                showResult('cases-result', `âœ… Dossier crÃ©Ã© et Ã©vÃ©nement rattachÃ©: ${createdCaseId}`);
                showTab('cases');
                await listCases();
            } catch (err) {
                alert(`Erreur crÃ©ation dossier: ${err.message}`);
            }
        }

        function renderRichEmailBlock(payload, occurredAt, eventId = null, options = {}) {
            const subject = payload?.subject || payload?.Subject || 'N/A';
            const digest = buildReadableEventDigest(payload, occurredAt, options);
            const meta = digest.meta;
            const safeCaseId = payload?.caseId || payload?.CaseId || lastCaseId || 'unknown';

            let html = `<div class="guide-box"><strong>Qui:</strong> ${digest.who}<br><strong>Quand:</strong> ${digest.when}<br><strong>Quoi:</strong> ${digest.what}<br><strong>Statut action:</strong> ${digest.actionStatus}<br><strong>Action conseillÃ©e:</strong> ${digest.actionDetail}<br><strong>DÃ©cision finale:</strong> Utilisateur</div>`;
            html += `<div><strong>Sujet:</strong> ${subject}</div>`;

            if (meta.clientId) {
                html += `<span class="meta-chip">ClientId: ${meta.clientId}</span>`;
                html += `<button class="btn" style="padding:6px 10px; font-size:12px;" onclick="jumpToClientSearch('${meta.clientId}')">Rechercher ce client</button>`;
            }
            if (eventId) {
                    html += `<button class="btn" style="padding:6px 10px; font-size:12px;" onclick="createCaseFromEvent('${eventId}', '${encodeURIComponent(subject)}')">CrÃ©er dossier depuis cet email</button>`;
                    html += `<button class="btn" style="padding:6px 10px; font-size:12px;" onclick="showEventQuestionnaires('${eventId}', '${safeCaseId}')">ðŸ“‹ Questionnaires</button>`;
                    html += `<button class="btn" style="padding:6px 10px; font-size:12px;" onclick="showTemplateModal('${eventId}', '${meta.cleanedBody}', '${subject}')">ðŸ“ RÃ©ponse IA</button>`;
            }
            if (meta.clientDbId) html += `<span class="meta-chip">ClientDbId: ${meta.clientDbId}</span>`;

            if (meta.annexes.length > 0) {
                html += `<div><strong style="display:block; margin-top:8px;">Annexes (${meta.annexes.length})</strong>`;
                html += `<ul class="annex-list">${meta.annexes.map(a => `<li>${a}</li>`).join('')}</ul></div>`;
            }

            return html;
        }

        async function register() {
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;
            const name = document.getElementById('reg-name').value;

            try {
                const res = await apiFetchWithFallback('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, name, role: 'AVOCAT', plan: 'CABINET' })
                });
                const data = await res.json();
                if (res.ok) {
                    showResult('reg-result', `âœ… Compte crÃ©Ã© avec succÃ¨s! ID: ${data.id}`);
                    document.getElementById('login-email').value = email;
                    document.getElementById('login-password').value = password;
                } else {
                    showResult('reg-result', `âŒ Erreur: ${data.message}`, false);
                }
            } catch (err) {
                showResult('reg-result', `âŒ Erreur: ${err.message}`, false);
            }
        }

        async function login() {
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            try {
                const res = await apiFetchWithFallback('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();
                if (res.ok) {
                    persistSession(email, data.token);
                    updateCurrentUserDisplay(email);
                    showResult('login-result', `âœ… ConnectÃ© avec succÃ¨s! Token reÃ§u.`);
                    await refreshAnomalyBadge();
                    
                    // Initialiser les fonctionnalitÃ©s avancÃ©es
                    realtimeDashboard = new RealtimeDashboard(API_URL, token);
                    templateManager = new TemplateManager(API_URL, token);
                    criticalAlerts = new CriticalAlertSystem(API_URL, token);
                    await criticalAlerts.initialize();
                } else {
                    const message = (data?.message || '').toString().toLowerCase();
                    const canAutoCreate = message.includes('identifiants invalides');

                    if (canAutoCreate) {
                        const shouldCreate = confirm("Identifiants invalides. Voulez-vous crÃ©er automatiquement un compte avec cet email puis vous connecter ?");
                        if (shouldCreate) {
                            const defaultName = email.split('@')[0] || 'Utilisateur';
                            const regRes = await apiFetchWithFallback('/api/auth/register', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ email, password, name: defaultName, role: 'AVOCAT', plan: 'CABINET' })
                            });

                            const regData = await readResponseDataSafe(regRes);

                            if (regRes.ok || regRes.status === 409) {
                                const retry = await apiFetchWithFallback('/api/auth/login', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ email, password })
                                });
                                const retryData = await readResponseDataSafe(retry);

                                if (retry.ok) {
                                    persistSession(email, retryData.token);
                                    updateCurrentUserDisplay(email);
                                    showResult('login-result', `âœ… ConnectÃ© avec succÃ¨s!`);
                                    await refreshAnomalyBadge();
                                    return;
                                }

                                showResult('login-result', `âŒ Compte trouvÃ©/crÃ©Ã©, mais connexion impossible: ${retryData?.message || 'erreur'}`, false);
                                return;
                            }

                            showResult('login-result', `âŒ CrÃ©ation de compte impossible: ${regData?.message || 'erreur'}`, false);
                            return;
                        }
                    }

                    showResult('login-result', `âŒ Erreur: ${data.message}`, false);
                }
            } catch (err) {
                showResult('login-result', `âŒ Erreur: ${err.message}`, false);
            }
        }

        async function refreshAnomalyBadge() {
            const el = document.getElementById('anomalyCountText');
            if (!el) return;
            if (!token) {
                el.textContent = '-';
                return;
            }

            try {
                const res = await apiFetchWithFallback('/api/alerts/center?limit=5', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (res.ok) {
                    el.textContent = data?.summary?.totalOpenAnomalies ?? 0;
                } else {
                    el.textContent = '!';
                }
            } catch {
                el.textContent = '!';
            }
        }

        function openAnomalyCenter() {
            showTab('audit');
            loadAnomalyCenter();
        }

        async function loadAnomalyCenter() {
            if (!token) return showResult('anomaly-center-result', 'âŒ Connectez-vous d\'abord', false);

            try {
                const res = await apiFetchWithFallback('/api/alerts/center?limit=50', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();

                if (!res.ok) {
                    return showResult('anomaly-center-result', 'âŒ Erreur chargement centre anomalies', false);
                }

                const summary = data.summary || {};
                const flags = data.groupedFlags || [];
                const items = data.items || [];
                const logs = data.logs || [];

                let html = '<div class="result" style="border-left-color: orange; background: #fff3cd;">';
                html += `âš ï¸ <strong>Centre anomalies centralisÃ©</strong><br>`;
                html += `<span style="font-size:24px; font-weight:bold; color:#d97706;">${summary.totalOpenAnomalies || 0}</span> anomalies ouvertes<br>`;
                html += `<div style="margin-top:8px; display:flex; gap:20px; flex-wrap:wrap;">`;
                html += `<span>ðŸ“§ Events: <strong>${summary.totalEventAnomalies || 0}</strong></span>`;
                html += `<span>ðŸ”” Notifications: <strong>${summary.totalNotificationAnomalies || 0}</strong></span>`;
                html += `<span>ðŸ“‹ Logs rÃ©cents: <strong>${summary.totalRecentLogs || 0}</strong></span>`;
                html += `</div>`;
                html += `<div style="margin-top:8px; font-size:13px;"><strong>DÃ©cision finale:</strong> Utilisateur (les actions proposÃ©es sont des aides).</div>`;
                html += '</div>';

                if (flags.length > 0) {
                    html += '<div class="result" style="margin-top:8px;">';
                    html += `<strong>ðŸ“ˆ Top anomalies:</strong><br>`;
                    flags.forEach(f => {
                        html += `<span class="meta-chip" style="margin:4px;">${f.flag} <strong>(${f.count})</strong></span>`;
                        html += `<button class="btn" style="margin:4px; background:#c62828;" onclick="bulkDeleteByFlag('${f.flag}', ${f.count})">Suppression intelligente (${f.count})</button>`;
                    });
                    html += '</div>';
                }

                html += '<div class="event-list">';
                if (items.length === 0) {
                    html += '<div class="result success">âœ… Aucune anomalie Ã  traiter</div>';
                }
                items.forEach(i => {
                    const isEvent = i.kind === 'EVENT';
                    const isNotif = i.kind === 'NOTIFICATION';
                    html += `<div class="event-item ${isEvent ? 'case-item' : ''}" style="border-left-color:${isEvent ? 'orange' : '#667eea'}; ${isEvent ? 'cursor:pointer;' : ''}" ${isEvent ? `onclick="showEventDetail('${i.id}')"` : ''}>
                        <div class="date">${new Date(i.createdAt || i.occurredAt).toLocaleString('fr-FR')} - ${i.kind}</div>
                        <div><strong>${i.title || 'Anomalie'}</strong>${i.externalId ? ` (${i.externalId})` : ''}</div>
                        <div class="content">${(i.details || '').toString().substring(0, 240)}</div>`;

                    if (isEvent) {
                        html += `<button class="btn" style="margin-top:8px;" onclick="event.stopPropagation(); showEventDetail('${i.id}')">Voir tous les dÃ©tails</button>`;
                        html += `<button class="btn" style="margin-top:8px; background:#c62828;" onclick="event.stopPropagation(); deleteEventFromAlert('${i.id}')">Action directe: Supprimer l'Ã©vÃ©nement</button>`;
                    }

                    if (isNotif) {
                        html += `<button class="btn" style="margin-top:8px;" onclick="dismissNotificationFromCenter('${i.id}')">Ignorer (log)</button>`;
                        html += `<button class="btn" style="margin-top:8px; background:#2e7d32;" onclick="resolveNotificationFromCenter('${i.id}')">ClÃ´turer manuellement (log)</button>`;
                    }

                    html += '</div>';
                });
                html += '</div>';

                html += `<div class="result" style="margin-top:10px;">Point d'entrÃ©e logs: ${logs.length} log(s) disponible(s) dans l'audit.</div>`;

                document.getElementById('anomaly-center-result').innerHTML = html;
                await refreshAnomalyBadge();
            } catch (err) {
                showResult('anomaly-center-result', `âŒ Erreur de connexion API: ${err.message}`, false);
            }
        }

        async function bulkDeleteByFlag(flag, suggestedCount) {
            if (!token) return;

            const toDelete = Number(suggestedCount || 0);
            const confirmed = confirm(`Supprimer en lot les Ã©vÃ©nements avec anomalie "${flag}" ?\nVolume estimÃ©: ${toDelete}.\nCette action est irrÃ©versible.`);
            if (!confirmed) return;

            try {
                const res = await fetch(`${API_URL}/api/events/bulk-delete`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ validationFlag: flag, maxToDelete: Math.max(toDelete, 1) })
                });

                const data = await readResponseDataSafe(res);
                if (res.ok) {
                    showResult('anomaly-center-result', `âœ… Suppression intelligente: ${data.deletedCount || 0} Ã©vÃ©nement(s) supprimÃ©(s) pour ${data.validationFlag || flag}`);
                    await loadAnomalyCenter();
                    await loadAlerts();
                    await refreshAnomalyBadge();
                } else {
                    showResult('anomaly-center-result', `âŒ Ã‰chec suppression intelligente: ${data?.message || 'erreur'}`, false);
                }
            } catch (err) {
                showResult('anomaly-center-result', `âŒ Erreur suppression intelligente: ${err.message}`, false);
            }
        }

        async function dismissNotificationFromCenter(notificationId) {
            if (!token) return;
            try {
                const res = await fetch(`${API_URL}/api/notifications/${notificationId}/dismiss`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ reason: 'TraitÃ© depuis le centre anomalies' })
                });
                if (res.ok) {
                    showResult('anomaly-center-result', 'âœ… Notification ignorÃ©e et loguÃ©e.');
                    await loadAnomalyCenter();
                    await loadAlerts();
                    await refreshAnomalyBadge();
                } else {
                    alert('Impossible d\'ignorer la notification');
                }
            } catch (err) {
                alert(`Erreur: ${err.message}`);
            }
        }

        async function resolveNotificationFromCenter(notificationId) {
            if (!token) return;
            const resolution = prompt('Action de clÃ´ture Ã  enregistrer:', 'ClÃ´ture manuelle validÃ©e depuis le centre anomalies');
            if (!resolution) return;

            try {
                const res = await fetch(`${API_URL}/api/notifications/${notificationId}/resolve`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ resolution, action: 'CENTRE_ANOMALIES' })
                });
                if (res.ok) {
                    showResult('anomaly-center-result', 'âœ… Notification clÃ´turÃ©e manuellement et loguÃ©e.');
                    await loadAnomalyCenter();
                    await loadAlerts();
                    await refreshAnomalyBadge();
                } else {
                    alert('Impossible de rÃ©soudre la notification');
                }
            } catch (err) {
                alert(`Erreur: ${err.message}`);
            }
        }

        async function checkDatabaseStats() {
            try {
                const res = await fetch(`${API_URL}/api/debug/stats`);
                const data = await res.json();
                if (res.ok) {
                    let html = `<div class="result success">ðŸ“Š Base de donnÃ©es</div>`;
                    html += `<div class="result" style="margin-top:10px;">`;
                    html += `ðŸ‘¤ Utilisateurs: <strong>${data.users}</strong><br>`;
                    html += `ðŸ“ Dossiers: <strong>${data.cases}</strong><br>`;
                    html += `ðŸ“§ Ã‰vÃ©nements: <strong>${data.events}</strong><br>`;
                    html += `ðŸ“¥ Sources: <strong>${data.sources}</strong>`;
                    html += `</div>`;
                    if (data.recentCases && data.recentCases.length > 0) {
                        html += `<div class="event-list" style="margin-top:10px; max-height:400px;">`;
                        data.recentCases.forEach(c => {
                            html += `<div class="event-item case-item" onclick="showCaseDetails('${c.id}')" style="cursor:pointer;">`;
                            html += `<strong>${c.title}</strong>`;
                            html += `<div class="date">${new Date(c.createdAt).toLocaleString('fr-FR')}</div>`;
                            html += `</div>`;
                        });
                        html += `</div>`;
                    }
                    document.getElementById('scan-result').innerHTML = html;
                } else {
                    showResult('scan-result', `âŒ Erreur`, false);
                }
            } catch (err) {
                showResult('scan-result', `âŒ Erreur: ${err.message}`, false);
            }
        }

        function escapeScanHtml(text) {
            const value = text == null ? '' : String(text);
            const div = document.createElement('div');
            div.textContent = value;
            return div.innerHTML;
        }

        function getSortedFilteredScanRows(rows) {
            const statusFilter = document.getElementById('scan-status-filter')?.value || 'all';
            const sortOrder = document.getElementById('scan-sort-order')?.value || 'dateDesc';

            let filtered = Array.isArray(rows) ? [...rows] : [];

            if (statusFilter !== 'all') {
                filtered = filtered.filter(r => (r?.status || '').toLowerCase() === statusFilter);
            }

            filtered.sort((a, b) => {
                const da = new Date(a?.occurredAt || 0).getTime();
                const db = new Date(b?.occurredAt || 0).getTime();

                if (sortOrder === 'dateAsc') return da - db;
                if (sortOrder === 'status') {
                    const sa = (a?.status || '').toLowerCase();
                    const sb = (b?.status || '').toLowerCase();
                    return sa.localeCompare(sb) || (db - da);
                }

                return db - da;
            });

            return filtered;
        }

        function refreshStructuredScanResultView() {
            if (!window.__lastStructuredScanData) return;
            const container = document.getElementById('scan-result');
            if (!container) return;
            container.innerHTML = renderStructuredScanResult(window.__lastStructuredScanData);
        }

        function renderStructuredScanResult(data) {
            const rows = Array.isArray(data?.linesPreview) ? data.linesPreview : [];
            const sortedRows = getSortedFilteredScanRows(rows);
            const statusFilter = document.getElementById('scan-status-filter')?.value || 'all';
            const sortOrder = document.getElementById('scan-sort-order')?.value || 'dateDesc';
            const cards = sortedRows.map((row, index) => {
                const status = row?.status || 'unknown';
                const date = row?.occurredAt ? new Date(row.occurredAt).toLocaleString('fr-FR') : '-';
                const from = escapeScanHtml(row?.from || '-');
                const to = escapeScanHtml(row?.to || '-');
                const subject = escapeScanHtml(row?.subject || '(sans sujet)');
                const bodyPreview = escapeScanHtml(row?.bodyPreview || '');
                const attachmentNames = Array.isArray(row?.attachmentNames) && row.attachmentNames.length > 0
                    ? row.attachmentNames.map(a => escapeScanHtml(a)).join(', ')
                    : 'Aucune';
                const encodedFrom = encodeURIComponent(row?.from || '');
                const encodedTo = encodeURIComponent(row?.to || '');
                const encodedSubject = encodeURIComponent(row?.subject || '');
                const encodedBody = encodeURIComponent(row?.bodyPreview || '');
                const encodedMessageId = encodeURIComponent(row?.messageId || '');

                return `
                    <div class="result" style="margin-top:10px; text-align:left;">
                        <strong>#${index + 1} â€¢ ${status.toUpperCase()}</strong><br>
                        <strong>Date:</strong> ${date}<br>
                        <strong>De:</strong> ${from}<br>
                        <strong>Ã€:</strong> ${to}<br>
                        <strong>Sujet:</strong> ${subject}<br>
                        <strong>PiÃ¨ces jointes:</strong> ${attachmentNames}<br>
                        <strong>Contenu:</strong><br>
                        <div style="white-space:pre-wrap; background:#fff; border:1px solid #ddd; padding:8px; border-radius:4px; margin-top:6px;">${bodyPreview || '(vide)'}</div>
                        <div style="margin-top:8px; display:flex; gap:8px; flex-wrap:wrap;">
                            <button class="btn" style="padding:6px 10px; font-size:12px;" onclick="openReplyComposerFromScan('${encodedFrom}','${encodedTo}','${encodedSubject}','${encodedBody}','${encodedMessageId}')">RÃ©pondre Ã  cet email</button>
                        </div>
                    </div>
                `;
            }).join('');

            const summary = `
                <div class="result success" style="text-align:left;">
                    <strong>âœ… ${escapeScanHtml(data?.message || 'Scan terminÃ©')}</strong><br>
                    Total: <strong>${data?.totalEmails ?? 0}</strong> |
                    IngÃ©rÃ©s: <strong>${data?.ingested ?? 0}</strong> |
                    Doublons: <strong>${data?.duplicates ?? 0}</strong><br>
                    AperÃ§u affichÃ©: <strong>${sortedRows.length}</strong>${data?.hasMorePreview ? ` / ${data?.totalEmails ?? 0} (augmentez la limite si besoin)` : ''}
                </div>
            `;

            const controls = `
                <div class="result" style="margin-top:10px; text-align:left;">
                    <strong>Organisation structurÃ©e</strong><br>
                    <label style="margin-right:10px;">Filtre statut:
                        <select id="scan-status-filter" onchange="refreshStructuredScanResultView()">
                            <option value="all" ${statusFilter === 'all' ? 'selected' : ''}>Tous</option>
                            <option value="ingested" ${statusFilter === 'ingested' ? 'selected' : ''}>IngÃ©rÃ©s</option>
                            <option value="duplicate" ${statusFilter === 'duplicate' ? 'selected' : ''}>Doublons</option>
                        </select>
                    </label>
                    <label>Tri:
                        <select id="scan-sort-order" onchange="refreshStructuredScanResultView()">
                            <option value="dateDesc" ${sortOrder === 'dateDesc' ? 'selected' : ''}>Date (plus rÃ©cent)</option>
                            <option value="dateAsc" ${sortOrder === 'dateAsc' ? 'selected' : ''}>Date (plus ancien)</option>
                            <option value="status" ${sortOrder === 'status' ? 'selected' : ''}>Statut puis date</option>
                        </select>
                    </label>
                    <div style="margin-top:8px; color:#555;">Lignes affichÃ©es: <strong>${sortedRows.length}</strong></div>
                </div>
            `;

            return summary + controls + (cards || '<div class="result">Aucun email Ã  afficher dans cet aperÃ§u.</div>');
        }

        function getCurrentUserEmail() {
            return (localStorage.getItem('memolibUserEmail') || '').trim().toLowerCase();
        }

        function chooseReplyRecipient(from, to) {
            const me = getCurrentUserEmail();
            const fromValue = (from || '').trim();
            const toValue = (to || '').trim();

            if (fromValue && fromValue.toLowerCase() !== me) return fromValue;
            if (toValue) return toValue.split(/[;,]/)[0].trim();
            return fromValue || toValue;
        }

        function closeScanReplyModal() {
            const modal = document.getElementById('scanReplyModal');
            if (modal) modal.remove();
        }

        function openReplyComposerFromScan(fromEnc, toEnc, subjectEnc, bodyEnc, messageIdEnc) {
            const from = decodeURIComponent(fromEnc || '');
            const to = decodeURIComponent(toEnc || '');
            const subject = decodeURIComponent(subjectEnc || '');
            const bodyPreview = decodeURIComponent(bodyEnc || '');
            const messageId = decodeURIComponent(messageIdEnc || '');
            const recipient = chooseReplyRecipient(from, to);

            const modalHtml = `
                <div class="modal" id="scanReplyModal" style="display:block;" onclick="if(event.target.id==='scanReplyModal') closeScanReplyModal()">
                    <div class="modal-content">
                        <span class="modal-close" onclick="closeScanReplyModal()">&times;</span>
                        <h2 style="color:#667eea; margin-bottom:12px;">RÃ©ponse Ã  envoyer</h2>
                        <div class="guide-box"><strong>Email source:</strong> ${escapeScanHtml(subject || '(sans sujet)')}<br><strong>De:</strong> ${escapeScanHtml(from || '-')} | <strong>Ã€:</strong> ${escapeScanHtml(to || '-')}<br><strong>RÃ©fÃ©rence:</strong> ${escapeScanHtml(messageId || '-')}</div>

                        <div class="input-group">
                            <label>Destinataire</label>
                            <input type="email" id="scan-reply-to" value="${escapeScanHtml(recipient)}" />
                        </div>
                        <div class="input-group">
                            <label>Sujet</label>
                            <input type="text" id="scan-reply-subject" value="${escapeScanHtml(subject ? `Re: ${subject}` : 'Re: Votre message')}" />
                        </div>
                        <div class="input-group">
                            <label>Message</label>
                            <textarea id="scan-reply-body" rows="10">Bonjour,\n\nMerci pour votre message.\n\nJe reviens vers vous rapidement avec la suite.\n\nCordialement,</textarea>
                        </div>
                        <div style="display:flex; gap:8px; flex-wrap:wrap;">
                            <button class="btn" onclick="suggestScanReplyFromAi()">Proposer un brouillon</button>
                            <button class="btn" style="background:#1f8f3a;" onclick="sendScanReply()">Envoyer la rÃ©ponse</button>
                            <button class="btn" style="background:#888;" onclick="closeScanReplyModal()">Fermer</button>
                        </div>
                        <div id="scan-reply-status"></div>
                        <div class="result" style="margin-top:10px;"><strong>RÃ©sumÃ© du mail reÃ§u:</strong><br>${escapeScanHtml(bodyPreview || '(aucun aperÃ§u)')}</div>
                    </div>
                </div>
            `;

            const existing = document.getElementById('scanReplyModal');
            if (existing) existing.remove();
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        }

        async function suggestScanReplyFromAi() {
            if (!token) return;

            const subject = document.getElementById('scan-reply-subject')?.value || '';
            const currentBody = document.getElementById('scan-reply-body')?.value || '';
            const status = document.getElementById('scan-reply-status');
            if (status) status.innerHTML = `<div class="result">â³ GÃ©nÃ©ration du brouillon...</div>`;

            try {
                const res = await apiFetchWithFallback('/api/templates/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ clientContext: currentBody, subject, caseType: 'general' })
                });

                const data = await readResponseDataSafe(res);
                if (!res.ok) {
                    if (status) status.innerHTML = `<div class="result error">âŒ Brouillon indisponible.</div>`;
                    return;
                }

                const generated = data?.generatedResponse || '';
                const bodyField = document.getElementById('scan-reply-body');
                if (bodyField && generated) {
                    bodyField.value = generated;
                }
                if (status) status.innerHTML = `<div class="result success">âœ… Brouillon proposÃ©. Vous pouvez modifier avant envoi.</div>`;
            } catch (err) {
                if (status) status.innerHTML = `<div class="result error">âŒ Erreur brouillon: ${err.message}</div>`;
            }
        }

        async function sendScanReply() {
            if (!token) return;

            const to = document.getElementById('scan-reply-to')?.value?.trim() || '';
            const subject = document.getElementById('scan-reply-subject')?.value?.trim() || '';
            const body = document.getElementById('scan-reply-body')?.value?.trim() || '';
            const status = document.getElementById('scan-reply-status');

            if (!to || !subject || !body) {
                if (status) status.innerHTML = `<div class="result error">âŒ Destinataire, sujet et message sont obligatoires.</div>`;
                return;
            }

            if (status) status.innerHTML = `<div class="result">â³ Envoi en cours...</div>`;

            try {
                const res = await apiFetchWithFallback('/api/SecureEmail/send', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ to, subject, body })
                });

                const data = await readResponseDataSafe(res);
                if (!res.ok) {
                    const msg = data?.message || 'Envoi impossible';
                    if (status) status.innerHTML = `<div class="result error">âŒ ${msg}</div>`;
                    return;
                }

                if (status) status.innerHTML = `<div class="result success">âœ… RÃ©ponse envoyÃ©e Ã  ${escapeScanHtml(to)}.</div>`;
            } catch (err) {
                if (status) status.innerHTML = `<div class="result error">âŒ Erreur envoi: ${err.message}</div>`;
            }
        }

        function extractBodyFromRawPayload(rawPayload) {
            if (!rawPayload) return '';
            try {
                const parsed = JSON.parse(rawPayload);
                return (parsed.body || parsed.bodyText || parsed.bodyHtml || '').toString();
            } catch {
                return '';
            }
        }

        async function enrichScanRowsWithBodies(rows) {
            if (!Array.isArray(rows) || rows.length === 0) return rows;
            if (rows.some(r => r?.bodyPreview)) return rows;

            const res = await apiFetchWithFallback('/api/search/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ text: '' })
            });

            if (!res.ok) return rows;

            const events = await res.json();
            const map = new Map();
            (Array.isArray(events) ? events : []).forEach(ev => {
                if (ev?.externalId) {
                    map.set(ev.externalId, extractBodyFromRawPayload(ev.rawPayload));
                }
            });

            return rows.map(row => {
                if (row?.bodyPreview) return row;
                const fallbackBody = map.get(row?.messageId) || '';
                const bodyPreview = fallbackBody.length > 600 ? `${fallbackBody.slice(0, 600)}...` : fallbackBody;
                return { ...row, bodyPreview };
            });
        }

        async function manualEmailScan() {
            if (!token) return showResult('scan-result', 'âŒ Connectez-vous d\'abord', false);

            showResult('scan-result', 'â³ Scan en cours... Cela peut prendre quelques minutes.');

            try {
                const res = await apiFetchWithFallback('/api/email-scan/manual?previewLimit=500', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (res.ok) {
                    data.linesPreview = await enrichScanRowsWithBodies(Array.isArray(data?.linesPreview) ? data.linesPreview : []);
                    window.__lastStructuredScanData = data;
                    document.getElementById('scan-result').innerHTML = renderStructuredScanResult(data);
                } else {
                    const raw = (data?.message || '').toString();
                    const text = raw.toLowerCase();
                    if (res.status === 401 || text.includes('invalid credentials') || text.includes('authentification') || text.includes('authentication')) {
                        let msg = `âŒ Connexion Ã  la boÃ®te email impossible.<br>`;
                        msg += `VÃ©rifiez l'adresse email IMAP et le mot de passe d'application dans la configuration.<br>`;
                        msg += `Astuce Gmail: activez la validation en 2 Ã©tapes puis crÃ©ez un mot de passe d'application.`;
                        return showResult('scan-result', msg, false);
                    }

                    let errorHtml = `âŒ Erreur: ${data?.message || 'Ã‰chec du scan manuel.'}`;
                    if (data?.hint) {
                        errorHtml += `<br>ðŸ’¡ ${data.hint}`;
                    }
                    if (data?.details) {
                        errorHtml += `<br><small>DÃ©tail technique: ${data.details}</small>`;
                    }

                    showResult('scan-result', errorHtml, false);
                }
            } catch (err) {
                showResult('scan-result', `âŒ Erreur: ${err.message}`, false);
            }
        }

        async function ingestEmail() {
            if (!token) return showResult('ingest-result', 'âŒ Connectez-vous d\'abord', false);

            const from = document.getElementById('email-from').value;
            const subject = document.getElementById('email-subject').value;
            const body = document.getElementById('email-body').value;
            const externalId = document.getElementById('email-external').value || `EMAIL-${Date.now()}`;

            try {
                const res = await fetch(`${API_URL}/api/ingest/email`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ from, subject, body, externalId, occurredAt: new Date().toISOString() })
                });
                const data = await res.json();
                if (res.ok) {
                    const eventId = data.eventId || data.existingEventId || 'N/A';
                    
                    if (data.isDuplicate) {
                        let msg = `<div style="background: #fff3cd; border-left: 4px solid orange; padding: 15px; border-radius: 5px;">`;
                        msg += `âš ï¸ <strong>Doublon dÃ©tectÃ©</strong><br>`;
                        msg += `Event ID: ${eventId}<br>`;
                        msg += `Dossier: ${data.caseId || 'N/A'}<br>`;
                        msg += `Raison: ${data.duplicateReason}<br>`;
                        if (data.notificationCreated && data.notificationId) {
                            msg += `<br><button class="btn" onclick="acquitterDoublon('${data.notificationId}')">Acquitter ce doublon</button>`;
                        } else {
                            msg += `<br><em style="color: #666;">Notification non crÃ©Ã©e</em>`;
                        }
                        msg += `</div>`;
                        document.getElementById('ingest-result').innerHTML = msg;
                    } else {
                        let msg = `âœ… Email ingÃ©rÃ©! Event ID: ${eventId}<br>Dossier: ${data.caseId || 'N/A'}${data.caseCreated ? ' (nouveau)' : ''}`;
                        if (data.requiresAttention) {
                            msg += `<br><span style="color: orange;">âš ï¸ Attention requise: ${data.validationFlags.join(', ')}</span>`;
                        }
                        showResult('ingest-result', msg);
                    }
                    
                    lastEventId = eventId !== 'N/A' ? eventId : null;
                    lastCaseId = data.caseId;
                } else {
                    showResult('ingest-result', `âŒ Erreur: ${data.message}`, false);
                }
            } catch (err) {
                showResult('ingest-result', `âŒ Erreur: ${err.message}`, false);
            }
        }

        function renderSearchEventsList(events, titleLabel, options = {}) {
            const showIds = document.getElementById('search-show-ids')?.checked === true;
            const includeFullBody = options.includeFullBody === true;

            let html = `<div class="result success">âœ… ${events.length} email(s) ${titleLabel}</div>`;
            if (includeFullBody) {
                html += '<div class="guide-box"><strong>Affichage complet activÃ©</strong>: chaque email ci-dessous contient tout le texte rÃ©cupÃ©rÃ© (pas seulement un extrait).</div>';
            }

            html += '<div class="event-list">';
            events.forEach((e, index) => {
                const payload = parseRawPayloadSafe(e.rawPayload);
                html += `<div class="event-item case-item" onclick="showEventDetail('${e.id}')">`;
                html += `<div class="date">#${index + 1} â€¢ ${new Date(e.occurredAt).toLocaleString('fr-FR')}</div>`;
                if (showIds) {
                    html += `<div class="search-ids">EventId: ${e.id}${e.externalId ? ` | ExternalId: ${e.externalId}` : ''}</div>`;
                }
                html += renderRichEmailBlock(payload, e.occurredAt, e.id, { includeFullBody });
                html += '</div>';
            });
            html += '</div>';
            document.getElementById('search-result').innerHTML = html;
        }

        async function searchEvents() {
            if (!token) return showResult('search-result', 'âŒ Connectez-vous d\'abord', false);

            const text = document.getElementById('search-text').value;
            const includeFullBody = document.getElementById('search-show-full-content')?.checked !== false;

            try {
                const res = await fetch(`${API_URL}/api/search/events`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ text, limit: 500 })
                });

                if (!res.ok) {
                    const errorText = await res.text();
                    return showResult('search-result', `âŒ Erreur ${res.status}: ${errorText}`, false);
                }

                const contentType = res.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    const text = await res.text();
                    return showResult('search-result', `âŒ RÃ©ponse invalide (non-JSON): ${text.substring(0, 200)}`, false);
                }

                const data = await res.json();
                if (!Array.isArray(data)) {
                    return showResult('search-result', 'âŒ Format de rÃ©ponse invalide', false);
                }

                renderSearchEventsList(data, 'trouvÃ©(s)', { includeFullBody });
            } catch (err) {
                showResult('search-result', `âŒ Erreur: ${err.message}`, false);
            }
        }

        async function loadAllReceivedEmails() {
            if (!token) return showResult('search-result', 'âŒ Connectez-vous d\'abord', false);

            const includeFullBody = document.getElementById('search-show-full-content')?.checked !== false;
            showResult('search-result', 'â³ Chargement de tous les emails reÃ§us...');

            try {
                const res = await fetch(`${API_URL}/api/search/events`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ text: '', returnAll: true })
                });

                if (!res.ok) {
                    const errorText = await res.text();
                    return showResult('search-result', `âŒ Erreur ${res.status}: ${errorText}`, false);
                }

                const data = await res.json();
                if (!Array.isArray(data)) {
                    return showResult('search-result', 'âŒ Format de rÃ©ponse invalide', false);
                }

                renderSearchEventsList(data, 'reÃ§u(s) (chargement complet)', { includeFullBody });
            } catch (err) {
                showResult('search-result', `âŒ Erreur: ${err.message}`, false);
            }
        }

        function normalizeSearchText(value) {
            return (value || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');
        }

        function toPercent(similarity) {
            const val = Number(similarity || 0);
            return `${(val * 100).toFixed(1)}%`;
        }

        function groupSimilarityResults(rows) {
            const groups = new Map();

            rows.forEach(row => {
                const content = (row.textForEmbedding || row.text || '').toString();
                const key = normalizeSearchText(content);

                if (!groups.has(key)) {
                    groups.set(key, {
                        content,
                        bestSimilarity: Number(row.similarity || 0),
                        ids: row.id ? [row.id] : [],
                        count: 1
                    });
                } else {
                    const g = groups.get(key);
                    g.count += 1;
                    if (Number(row.similarity || 0) > g.bestSimilarity) {
                        g.bestSimilarity = Number(row.similarity || 0);
                    }
                    if (row.id) g.ids.push(row.id);
                }
            });

            return Array.from(groups.values()).sort((a, b) => b.bestSimilarity - a.bestSimilarity);
        }

        function summarizeSemanticContent(content) {
            const lines = (content || '')
                .split(/\r?\n/)
                .map(x => x.trim())
                .filter(Boolean);

            return {
                from: lines[0] || 'N/A',
                subject: lines[1] || 'Sujet non disponible',
                excerpt: (lines[2] || lines[0] || '').substring(0, 180)
            };
        }

        function renderSimilarityResults(rows, modeLabel) {
            const shouldGroup = document.getElementById('search-group-duplicates')?.checked !== false;
            const showIds = document.getElementById('search-show-ids')?.checked !== false;

            if (!Array.isArray(rows)) {
                showResult('search-result', 'âŒ RÃ©ponse invalide', false);
                return;
            }

            if (!shouldGroup) {
                let html = `<div class="result success">âœ… ${rows.length} email(s) proche(s) trouvÃ©(s) (${modeLabel})</div>`;
                html += `<div class="guide-box">Lecture simple: chaque ligne = 1 email proche de votre recherche. Cliquez sur <strong>Ouvrir email</strong> pour voir le dÃ©tail complet.</div>`;
                html += '<div class="event-list">';
                rows.forEach(e => {
                    const s = summarizeSemanticContent(e.textForEmbedding || e.text || '');
                    html += `<div class="event-item">
                        <div class="date">Pertinence: ${toPercent(e.similarity)}</div>
                        <div><strong>Sujet:</strong> ${s.subject}</div>
                        <div><strong>De:</strong> ${s.from}</div>
                        <div class="content">${s.excerpt}${s.excerpt.length >= 180 ? '...' : ''}</div>
                        ${e.id ? `<button class="btn" style="padding:6px 10px; font-size:12px;" onclick="showEventDetail('${e.id}')">Ouvrir email</button>` : ''}
                    </div>`;
                });
                html += '</div>';
                document.getElementById('search-result').innerHTML = html;
                return;
            }

            const grouped = groupSimilarityResults(rows);
            const duplicateCount = rows.length - grouped.length;

            let html = `<div class="result success">âœ… ${rows.length} email(s) proche(s) (${modeLabel})`;
            html += `<span class="search-badge">${grouped.length} sujet(s) unique(s)</span>`;
            if (duplicateCount > 0) {
                html += `<span class="search-badge">${duplicateCount} email(s) similaires regroupÃ©(s)</span>`;
            }
            html += '</div>';
            html += `<div class="guide-box">InterprÃ©tation: vous avez <strong>${grouped.length} sujet(s)</strong>. Chaque carte ci-dessous reprÃ©sente un sujet; le badge indique le nombre d'emails similaires.</div>`;
            html += '<div class="event-list">';

            grouped.forEach(g => {
                const s = summarizeSemanticContent(g.content || '');
                const firstId = (g.ids && g.ids.length > 0) ? g.ids[0] : null;
                html += `<div class="event-item">
                    <div class="date">Pertinence max: ${toPercent(g.bestSimilarity)} ${g.count > 1 ? `<span class="search-badge">${g.count} emails similaires</span>` : ''}</div>
                    <div><strong>Sujet:</strong> ${s.subject}</div>
                    <div><strong>De:</strong> ${s.from}</div>
                    <div class="content">${s.excerpt}${s.excerpt.length >= 180 ? '...' : ''}</div>
                    ${firstId ? `<button class="btn" style="padding:6px 10px; font-size:12px;" onclick="showEventDetail('${firstId}')">Ouvrir un email de ce sujet</button>` : ''}`;
                if (showIds && g.ids.length > 0) {
                    html += `<div class="search-ids">IDs techniques: ${g.ids.join(', ')}</div>`;
                }
                html += `</div>`;
            });

            html += '</div>';
            document.getElementById('search-result').innerHTML = html;
        }

        async function semanticSearch() {
            if (!token) return showResult('search-result', 'âŒ Connectez-vous d\'abord', false);

            const query = document.getElementById('search-text').value;

            try {
                const res = await fetch(`${API_URL}/api/semantic/search`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ query })
                });
                const data = await res.json();
                if (res.ok) {
                    renderSimilarityResults(data, 'recherche IA');
                } else {
                    showResult('search-result', `âŒ Erreur: ${data.message}`, false);
                }
            } catch (err) {
                showResult('search-result', `âŒ Erreur: ${err.message}`, false);
            }
        }

        async function generateEmbeddings() {
            if (!token) return showResult('search-result', 'âŒ Connectez-vous d\'abord', false);

            try {
                const res = await fetch(`${API_URL}/api/embeddings/generate-all`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (res.ok) {
                    showResult('search-result', `âœ… Embeddings gÃ©nÃ©rÃ©s: ${data.generatedCount} / ${data.totalEvents}`);
                } else {
                    showResult('search-result', `âŒ Erreur`, false);
                }
            } catch (err) {
                showResult('search-result', `âŒ Erreur: ${err.message}`, false);
            }
        }

        async function embeddingSearch() {
            if (!token) return showResult('search-result', 'âŒ Connectez-vous d\'abord', false);

            const query = document.getElementById('search-text').value;

            try {
                const res = await fetch(`${API_URL}/api/embeddings/search`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ query, limit: 10 })
                });
                const data = await res.json();
                if (res.ok) {
                    renderSimilarityResults(data, 'embeddings');
                } else {
                    showResult('search-result', `âŒ Erreur`, false);
                }
            } catch (err) {
                showResult('search-result', `âŒ Erreur: ${err.message}`, false);
            }
        }

        async function createClient() {
            if (!token) return showResult('client-result', 'âŒ Connectez-vous d\'abord', false);

            const name = document.getElementById('client-name').value;
            const email = document.getElementById('client-email').value;
            const phoneNumber = document.getElementById('client-phone').value || null;
            const address = document.getElementById('client-address').value || null;

            try {
                const res = await fetch(`${API_URL}/api/client`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ name, email, phoneNumber, address })
                });
                const data = await res.json();
                if (res.ok) {
                    showResult('client-result', `âœ… Client crÃ©Ã©: ${data.name} (${data.id})`);
                } else if (res.status === 409) {
                    showResult('client-result', `âŒ Client dÃ©jÃ  existant avec cet email: ${email}<br>ID existant: ${data.existingClientId || 'N/A'}`, false);
                } else {
                    showResult('client-result', `âŒ Erreur ${res.status}: ${data.message || data.title || 'Impossible de crÃ©er le client'}`, false);
                }
            } catch (err) {
                showResult('client-result', `âŒ Erreur rÃ©seau: ${err.message}`, false);
            }
        }

        async function listClients() {
            if (!token) return showResult('client-result', 'âŒ Connectez-vous d\'abord', false);

            try {
                const res = await fetch(`${API_URL}/api/client`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (res.ok) {
                    let html = `<div class="result success">âœ… ${data.length} client(s)</div>`;
                    html += '<div class="event-list">';
                    data.forEach(c => {
                        html += `<div class="event-item" style="cursor:pointer;" onclick="openClientDetail('${c.id}')">
                            <strong>${c.name}</strong>
                            <div class="date">${c.email}</div>
                            <div class="content">${c.phoneNumber || ''} ${c.address || ''}</div>
                            <div class="date" style="margin-top:4px; color:#667eea;">Cliquer pour modifier / appliquer des rÃ¨gles / voir dÃ©tail</div>
                        </div>`;
                    });
                    html += '</div>';
                    document.getElementById('client-result').innerHTML = html;
                } else {
                    showResult('client-result', `âŒ Erreur ${res.status}: ${data.message || 'Impossible de charger les clients'}`, false);
                }
            } catch (err) {
                showResult('client-result', `âŒ Erreur rÃ©seau: ${err.message}`, false);
            }
        }

        async function openClientDetail(clientId) {
            if (!token) return showResult('client-result', 'âŒ Connectez-vous d\'abord', false);

            try {
                const res = await fetch(`${API_URL}/api/client/${clientId}/detail`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();

                if (!res.ok) {
                    return showResult('client-result', 'âŒ DÃ©tail client introuvable', false);
                }

                const client = data.client || {};
                const summary = data.summary || {};
                const relatedCases = data.relatedCases || [];
                const recentEvents = data.recentEvents || [];

                selectedClientId = client.id;
                selectedClientRaw = data;

                document.getElementById('detail-client-id').value = client.id || '';
                document.getElementById('detail-client-name').value = client.name || '';
                document.getElementById('detail-client-email').value = client.email || '';
                document.getElementById('detail-client-phone').value = client.phoneNumber || '';
                document.getElementById('detail-client-address').value = client.address || '';

                const empty = document.getElementById('client-detail-empty');
                const panel = document.getElementById('client-detail-panel');
                if (empty) empty.style.display = 'none';
                if (panel) panel.style.display = 'block';

                const summaryHtml = `<div class="result" style="margin-top:12px;">
                    <strong>Vue synthÃ¨se</strong><br>
                    Dossiers liÃ©s: ${summary.relatedCasesCount || 0} | 
                    Ã‰vÃ©nements rÃ©cents: ${summary.recentEventsCount || 0} | 
                    Anomalies ouvertes: ${summary.openAnomaliesCount || 0} | 
                    Annexes: ${summary.totalAnnexesCount || 0}<br>
                    Dernier contact: ${summary.lastContactAt ? new Date(summary.lastContactAt).toLocaleString('fr-FR') : 'N/A'}
                </div>`;
                document.getElementById('client-detail-summary').innerHTML = summaryHtml;

                let casesHtml = `<div class="result" style="margin-top:10px;"><strong>Dossiers liÃ©s (${relatedCases.length})</strong></div>`;
                casesHtml += '<div class="event-list">';
                relatedCases.forEach(c => {
                    casesHtml += `<div class="event-item case-item" onclick="showCaseDetails('${c.id}')">
                        <strong>${c.title}</strong>
                        <div class="date">CrÃ©Ã© le ${new Date(c.createdAt).toLocaleString('fr-FR')}</div>
                    </div>`;
                });
                casesHtml += '</div>';
                document.getElementById('client-detail-cases').innerHTML = casesHtml;

                let eventsHtml = `<div class="result" style="margin-top:10px;"><strong>Ã‰vÃ©nements rÃ©cents (${recentEvents.length})</strong></div>`;
                eventsHtml += '<div class="event-list">';
                recentEvents.forEach(e => {
                    const payload = parseRawPayloadSafe(e.rawPayload);
                    eventsHtml += `<div class="event-item">`;
                    eventsHtml += renderRichEmailBlock(payload, e.occurredAt, e.id);
                    if (e.requiresAttention) {
                        eventsHtml += `<div style="color:orange; margin-top:6px;">âš ï¸ ${e.validationFlags || 'Anomalie dÃ©tectÃ©e'}</div>`;
                    }
                    eventsHtml += `</div>`;
                });
                eventsHtml += '</div>';
                document.getElementById('client-detail-events').innerHTML = eventsHtml;

                showTab('client-detail');
                showResult('client-detail-result', `âœ… DÃ©tail chargÃ© pour ${client.name || 'client'}`);
            } catch (err) {
                showResult('client-result', `âŒ Erreur dÃ©tail client: ${err.message}`, false);
            }
        }

        function applyClientRule(ruleName) {
            if (!selectedClientId) {
                showResult('client-detail-result', 'âŒ SÃ©lectionnez d\'abord un client dans la liste', false);
                return;
            }

            const nameEl = document.getElementById('detail-client-name');
            const emailEl = document.getElementById('detail-client-email');
            const phoneEl = document.getElementById('detail-client-phone');
            const addressEl = document.getElementById('detail-client-address');

            if (ruleName === 'normalize') {
                nameEl.value = (nameEl.value || '').trim().replace(/\s+/g, ' ');
                emailEl.value = (emailEl.value || '').trim().toLowerCase();
                phoneEl.value = (phoneEl.value || '').replace(/\s+/g, ' ').trim();
                addressEl.value = (addressEl.value || '').trim().replace(/\s+/g, ' ');
                showResult('client-detail-result', 'âœ… RÃ¨gle appliquÃ©e: normalisation des donnÃ©es');
                return;
            }

            if (ruleName === 'vip') {
                const currentName = (nameEl.value || '').trim();
                if (!currentName.toUpperCase().startsWith('[VIP]')) {
                    nameEl.value = `[VIP] ${currentName}`.trim();
                }
                showResult('client-detail-result', 'âœ… RÃ¨gle appliquÃ©e: marquage VIP');
            }
        }

        async function saveClientDetail() {
            if (!token) return showResult('client-detail-result', 'âŒ Connectez-vous d\'abord', false);
            if (!selectedClientId) return showResult('client-detail-result', 'âŒ Aucun client sÃ©lectionnÃ©', false);

            const payload = {
                name: document.getElementById('detail-client-name').value,
                email: document.getElementById('detail-client-email').value,
                phoneNumber: document.getElementById('detail-client-phone').value,
                address: document.getElementById('detail-client-address').value
            };

            try {
                const res = await fetch(`${API_URL}/api/client/${selectedClientId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();

                if (!res.ok) {
                    return showResult('client-detail-result', `âŒ Ã‰chec enregistrement: ${data.message || 'erreur'}`, false);
                }

                selectedClientRaw = data;
                showResult('client-detail-result', `âœ… Client mis Ã  jour: ${data.name}`);
                await listClients();
            } catch (err) {
                showResult('client-detail-result', `âŒ Erreur enregistrement: ${err.message}`, false);
            }
        }

        function showClientDetailRaw() {
            if (!selectedClientRaw) {
                showResult('client-detail-result', 'âŒ Aucun dÃ©tail chargÃ©', false);
                return;
            }

            const pretty = `<pre>${JSON.stringify(selectedClientRaw, null, 2)}</pre>`;
            document.getElementById('client-detail-result').innerHTML = `<div class="result">${pretty}</div>`;
        }

        async function generateDiversifiedClientBase() {
            if (!token) return showResult('client-result', 'âŒ Connectez-vous d\'abord', false);

            const clientRef = DEFAULT_DEMO.clientRef;
            const clientEmail = document.getElementById('client-email').value || DEFAULT_DEMO.clientEmail;
            const clientName = document.getElementById('client-name').value || DEFAULT_DEMO.clientName;
            const phoneNumber = document.getElementById('client-phone').value || DEFAULT_DEMO.clientPhone;
            const address = document.getElementById('client-address').value || DEFAULT_DEMO.clientAddress;

            showResult('client-result', 'â³ GÃ©nÃ©ration en cours...');

            try {
                let clientId = null;

                const listRes = await fetch(`${API_URL}/api/client`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (listRes.ok) {
                    const clients = await listRes.json();
                    const existing = (clients || []).find(c =>
                        (c.email || '').toLowerCase() === clientEmail.toLowerCase());
                    if (existing) clientId = existing.id;
                }

                if (!clientId) {
                    const createRes = await fetch(`${API_URL}/api/client`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ name: clientName, email: clientEmail, phoneNumber, address })
                    });

                    if (createRes.ok) {
                        const created = await createRes.json();
                        clientId = created.id;
                    }
                }

                const topics = [
                    {
                        suffix: 'FAMILLE-001',
                        subject: 'Droit de la famille - Garde alternÃ©e',
                        body: 'Conflit sur la garde alternÃ©e et calendrier scolaire.',
                        annexes: 'annexe_jugement_2019.pdf; annexe_planning_garde.xlsx'
                    },
                    {
                        suffix: 'TRAVAIL-001',
                        subject: 'Droit du travail - Licenciement contestÃ©',
                        body: 'Contestation du motif Ã©conomique et calcul des indemnitÃ©s.',
                        annexes: 'annexe_contrat_travail.pdf; annexe_bulletins_salaire.zip'
                    },
                    {
                        suffix: 'IMMOBILIER-001',
                        subject: 'Litige immobilier - MalfaÃ§ons',
                        body: 'RÃ©ception de travaux avec rÃ©serves et expertise contradictoire.',
                        annexes: 'annexe_photos_chantier.zip; annexe_rapport_expert.pdf'
                    },
                    {
                        suffix: 'PENAL-001',
                        subject: 'PÃ©nal - Convocation audition libre',
                        body: 'PrÃ©paration de la stratÃ©gie de dÃ©fense avant audition.',
                        annexes: 'annexe_convocation.pdf; annexe_pieces_procedure.pdf'
                    }
                ];

                let stored = 0;
                let duplicates = 0;
                const details = [];

                for (const topic of topics) {
                    const externalId = `${clientRef}-${topic.suffix}`;
                    const emailPayload = {
                        from: clientEmail,
                        subject: topic.subject,
                        body: `${topic.body}\n\nClientId: ${clientRef}\nClientDbId: ${clientId || 'N/A'}\nAnnexes: ${topic.annexes}`,
                        externalId,
                        occurredAt: new Date().toISOString()
                    };

                    const ingestRes = await fetch(`${API_URL}/api/ingest/email`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(emailPayload)
                    });

                    const ingestData = await ingestRes.json();
                    if (ingestRes.ok && ingestData.isDuplicate !== true) {
                        stored += 1;
                    } else if (ingestRes.ok && ingestData.isDuplicate === true) {
                        duplicates += 1;
                    }

                    details.push(`${externalId}: ${ingestData.isDuplicate ? 'doublon' : 'ingÃ©rÃ©'}`);
                }

                document.getElementById('search-text').value = clientRef;
                showResult(
                    'client-result',
                    `âœ… Base diversifiÃ©e prÃªte pour ${clientName} (${clientRef})<br>` +
                    `ClientDbId: ${clientId || 'N/A'}<br>` +
                    `Sujets crÃ©Ã©s: ${stored} | Doublons: ${duplicates}<br>` +
                    `DÃ©tail: ${details.join(' | ')}`
                );
            } catch (err) {
                showResult('client-result', `âŒ Erreur gÃ©nÃ©ration base: ${err.message}`, false);
            }
        }

        async function generateTwentyClientsBase() {
            if (!token) return showResult('client-result', 'âŒ Connectez-vous d\'abord', false);

            showResult('client-result', 'â³ GÃ©nÃ©ration de 20 clients et sujets en cours...');

            try {
                const firstNames = ['Marie', 'Jean', 'Sofia', 'Lucas', 'Nora', 'Karim', 'Emma', 'Hugo', 'Lina', 'Paul'];
                const lastNames = ['Martin', 'Bernard', 'Petit', 'Moreau', 'Roux', 'Faure', 'Garcia', 'Andre', 'Mercier', 'Dupuis'];

                const topics = [
                    {
                        suffix: 'FAMILLE',
                        subject: 'Droit de la famille - Pension',
                        body: 'Demande de rÃ©vision de pension alimentaire.',
                        annexes: 'annexe_jugement.pdf; annexe_revenus_2025.xlsx'
                    },
                    {
                        suffix: 'TRAVAIL',
                        subject: 'Droit du travail - Rupture contrat',
                        body: 'Analyse d\'une rupture conventionnelle contestÃ©e.',
                        annexes: 'annexe_contrat.pdf; annexe_avenant.pdf'
                    },
                    {
                        suffix: 'IMMOBILIER',
                        subject: 'Immobilier - Vice cachÃ©',
                        body: 'Constat de vice cachÃ© aprÃ¨s acquisition d\'un bien.',
                        annexes: 'annexe_acte_vente.pdf; annexe_expertise.pdf'
                    },
                    {
                        suffix: 'PENAL',
                        subject: 'PÃ©nal - Assistance audition',
                        body: 'PrÃ©paration d\'assistance pour audition libre.',
                        annexes: 'annexe_convocation.pdf; annexe_pieces_defense.zip'
                    }
                ];

                const listRes = await apiFetchWithFallback('/api/client', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                const existingClients = listRes.ok ? await listRes.json() : [];
                const existingByEmail = new Map((existingClients || []).map(c => [(c.email || '').toLowerCase(), c]));

                const batchRef = Date.now();
                let createdClients = 0;
                let reusedClients = 0;
                let storedEvents = 0;
                let duplicateEvents = 0;

                for (let i = 1; i <= 20; i++) {
                    const first = firstNames[(i - 1) % firstNames.length];
                    const last = lastNames[(i - 1) % lastNames.length];
                    const clientRef = `CLI-${String(i).padStart(3, '0')}`;
                    const email = `client.${String(i).padStart(3, '0')}@memolib.local`;
                    const name = `${first} ${last}`;
                    const phoneNumber = `+33 6 ${String(10 + i).padStart(2, '0')} ${String(20 + i).padStart(2, '0')} ${String(30 + i).padStart(2, '0')} ${String(40 + i).padStart(2, '0')}`;
                    const address = `${i} rue Demo, Paris`;

                    let client = existingByEmail.get(email.toLowerCase());
                    if (!client) {
                        const createRes = await apiFetchWithFallback('/api/client', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ name, email, phoneNumber, address })
                        });

                        if (createRes.ok) {
                            client = await createRes.json();
                            existingByEmail.set(email.toLowerCase(), client);
                            createdClients += 1;
                        }
                    } else {
                        reusedClients += 1;
                    }

                    for (const topic of topics) {
                        const externalId = `${clientRef}-${topic.suffix}-${batchRef}`;
                        const payload = {
                            from: email,
                            subject: topic.subject,
                            body: `${topic.body}\n\nClientId: ${clientRef}\nClientDbId: ${client?.id || 'N/A'}\nAnnexes: ${topic.annexes}`,
                            externalId,
                            occurredAt: new Date().toISOString()
                        };

                        const ingestRes = await apiFetchWithFallback('/api/ingest/email', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify(payload)
                        });

                        const ingestData = await ingestRes.json();
                        if (ingestRes.ok && ingestData.isDuplicate !== true) storedEvents += 1;
                        if (ingestRes.ok && ingestData.isDuplicate === true) duplicateEvents += 1;
                    }
                }

                document.getElementById('search-text').value = 'CLI-';
                showResult(
                    'client-result',
                    `âœ… Base 20 clients prÃªte<br>` +
                    `Clients crÃ©Ã©s: ${createdClients} | RÃ©utilisÃ©s: ${reusedClients}<br>` +
                    `Sujets ingÃ©rÃ©s: ${storedEvents} | Doublons: ${duplicateEvents}<br>` +
                    `Conseil: recherche "CLI-" dans Recherche intelligente.`
                );
            } catch (err) {
                showResult('client-result', `âŒ Erreur gÃ©nÃ©ration 20 clients: ${err.message}. VÃ©rifiez que l'API tourne (${API_URL}/health).`, false);
            }
        }

        async function initDemoData() {
            if (!token) {
                alert('Veuillez vous connecter d\'abord');
                return;
            }

            if (!confirm('CrÃ©er une base de dÃ©monstration avec 5 clients et leurs dossiers ?')) {
                return;
            }

            try {
                const clients = [
                    { name: 'Sophie Martin', email: 'sophie.martin@example.com', phone: '+33 6 12 34 56 78', address: '12 rue de la Paix, Paris' },
                    { name: 'Pierre Dubois', email: 'pierre.dubois@example.com', phone: '+33 6 23 45 67 89', address: '45 avenue Victor Hugo, Lyon' },
                    { name: 'Marie Lefebvre', email: 'marie.lefebvre@example.com', phone: '+33 6 34 56 78 90', address: '8 boulevard Haussmann, Marseille' },
                    { name: 'Jean Moreau', email: 'jean.moreau@example.com', phone: '+33 6 45 67 89 01', address: '23 rue Nationale, Lille' },
                    { name: 'Claire Bernard', email: 'claire.bernard@example.com', phone: '+33 6 56 78 90 12', address: '67 cours Lafayette, Toulouse' }
                ];

                const topics = [
                    { subject: 'Droit de la famille - Divorce', body: 'Demande de conseil pour procÃ©dure de divorce Ã  l\'amiable.' },
                    { subject: 'Droit du travail - Licenciement', body: 'Contestation d\'un licenciement Ã©conomique.' },
                    { subject: 'Immobilier - Litige', body: 'Conflit avec le propriÃ©taire concernant les charges.' }
                ];

                let created = 0;
                for (const client of clients) {
                    const createRes = await fetch(`${API_URL}/api/client`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            name: client.name,
                            email: client.email,
                            phoneNumber: client.phone,
                            address: client.address
                        })
                    });

                    if (createRes.ok || createRes.status === 409) {
                        for (const topic of topics) {
                            await fetch(`${API_URL}/api/ingest/email`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify({
                                    from: client.email,
                                    subject: topic.subject,
                                    body: topic.body,
                                    externalId: `${client.email}-${topic.subject}-${Date.now()}`,
                                    occurredAt: new Date().toISOString()
                                })
                            });
                        }
                        created++;
                    }
                }

                alert(`âœ… Base dÃ©mo crÃ©Ã©e: ${created} clients avec leurs dossiers`);
                showTab('client');
                await listClients();
            } catch (err) {
                alert(`âŒ Erreur: ${err.message}`);
            }
        }

        async function loadSmartOverview() {
            if (!token) return showResult('smart-overview-result', 'âŒ Connectez-vous d\'abord', false);

            showResult('smart-overview-result', 'â³ Chargement de toutes les donnÃ©es...');

            try {
                const res = await fetch(`${API_URL}/api/dashboard/overview`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();

                if (!res.ok) {
                    return showResult('smart-overview-result', `âŒ Erreur: ${data.message}`, false);
                }

                let html = '<div class="stats">';
                html += `<div class="stat-box"><div class="number">${data.stats.totalCases}</div><div class="label">Dossiers</div></div>`;
                html += `<div class="stat-box"><div class="number">${data.stats.totalClients}</div><div class="label">Clients</div></div>`;
                html += `<div class="stat-box"><div class="number">${data.stats.totalEvents}</div><div class="label">Emails</div></div>`;
                html += `<div class="stat-box" style="background:#ff9800;"><div class="number">${data.stats.eventsWithAnomalies}</div><div class="label">Anomalies</div></div>`;
                html += '</div>';

                html += `<div class="result" style="margin-top:15px;"><strong>ðŸ“ Dossiers avec expÃ©diteurs (${data.cases.length})</strong></div>`;
                html += '<div class="event-list" style="max-height:300px;">';
                data.cases.forEach(c => {
                    html += `<div class="event-item case-item" onclick="showCaseDetails('${c.id}')">`;
                    html += `<strong>${c.title}</strong>`;
                    html += `<div class="date">ðŸ“§ De: ${c.from} | ðŸ•’ ${c.occurredAt ? new Date(c.occurredAt).toLocaleString('fr-FR') : 'N/A'}</div>`;
                    html += `<div class="date">Client: ${c.clientId || 'non renseignÃ©'} | ${c.eventCount} email(s) | CrÃ©Ã©: ${new Date(c.createdAt).toLocaleString('fr-FR')}</div>`;
                    html += '</div>';
                });
                html += '</div>';

                html += `<div class="result" style="margin-top:15px;"><strong>ðŸ‘¥ Clients avec coordonnÃ©es (${data.clients.length})</strong></div>`;
                html += '<div class="event-list" style="max-height:300px;">';
                data.clients.forEach(cl => {
                    html += `<div class="event-item" onclick="openClientDetail('${cl.id}')" style="cursor:pointer;">`;
                    html += `<strong>${cl.name}</strong>`;
                    html += `<div class="date">ðŸ“§ ${cl.email} | ðŸ“ž ${cl.phoneNumber || 'N/A'}</div>`;
                    html += `<div class="content">ðŸ  ${cl.address || 'Adresse non renseignÃ©e'}</div>`;
                    html += `<div class="date">${cl.casesCount} dossier(s) | CrÃ©Ã©: ${new Date(cl.createdAt).toLocaleString('fr-FR')}</div>`;
                    html += '</div>';
                });
                html += '</div>';

                html += `<div class="result" style="margin-top:15px;"><strong>ðŸ“¨ Emails rÃ©cents (${data.recentEvents.length})</strong></div>`;
                html += '<div class="event-list" style="max-height:300px;">';
                data.recentEvents.forEach(e => {
                    html += `<div class="event-item" onclick="showEventDetail('${e.id}')" style="cursor:pointer;">`;
                    html += `<strong>${e.subject}</strong>`;
                    html += `<div class="date">ðŸ“§ De: ${e.from} | ðŸ•’ ${new Date(e.occurredAt).toLocaleString('fr-FR')}</div>`;
                    if (e.requiresAttention) {
                        html += `<div style="color:orange; margin-top:4px;">âš ï¸ ${e.validationFlags || 'Anomalie'}</div>`;
                    }
                    html += '</div>';
                });
                html += '</div>';

                document.getElementById('smart-overview-result').innerHTML = html;
            } catch (err) {
                showResult('smart-overview-result', `âŒ Erreur: ${err.message}`, false);
            }
        }

        async function listCases() {
            if (!token) return showResult('cases-result', 'âŒ Connectez-vous d\'abord', false);
            setLoadingState('cases-result', 'â³ Chargement des dossiers...');

            try {
                const [casesRes, anomaliesRes] = await Promise.all([
                    apiFetchWithFallback('/api/cases', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    apiFetchWithFallback('/api/alerts/center?limit=5', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                ]);

                const data = await readResponseDataSafe(casesRes);
                const anomaliesData = anomaliesRes.ok ? await readResponseDataSafe(anomaliesRes) : null;
                const openAnomalies = anomaliesData?.summary?.totalOpenAnomalies ?? 'N/A';

                if (casesRes.ok) {
                    const shouldGroup = document.getElementById('cases-group-by-subject')?.checked !== false;
                    const distinctClientIds = new Set((data || []).map(c => c.clientId).filter(Boolean));
                    const clientsCount = distinctClientIds.size;
                    const totalCases = (data || []).length;

                    if (!shouldGroup) {
                        const sortedCases = (data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                        let html = `<div class="result success">âœ… ${sortedCases.length} dossier(s)</div>`;
                        html += `<div class="guide-box"><strong>Lecture simple:</strong> vous avez <strong>${totalCases}</strong> dossier(s) actif(s), rÃ©parti(s) sur <strong>${clientsCount}</strong> client(s). Anomalies ouvertes: <strong>${openAnomalies}</strong>.</div>`;
                        html += '<div class="event-list">';
                        sortedCases.forEach(c => {
                            html += `<div class="event-item case-item" onclick="showCaseDetails('${c.id}')">
                                <strong>${c.title || 'Sans titre'}</strong>
                                <div class="date">Client: ${c.clientId || 'non renseignÃ©'}</div>
                                <div class="date">CrÃ©Ã© le ${new Date(c.createdAt).toLocaleString('fr-FR')}</div>
                            </div>`;
                        });
                        html += '</div>';
                        document.getElementById('cases-result').innerHTML = html;
                        return;
                    }

                    const groups = new Map();
                    (data || []).forEach(c => {
                        const title = (c.title || 'Sans titre').trim();
                        const clientKey = c.clientId || 'SANS_CLIENT';
                        const key = `${title.toLowerCase()}|${clientKey}`;
                        if (!groups.has(key)) {
                            groups.set(key, {
                                title,
                                clientId: c.clientId || null,
                                latestId: c.id,
                                latestCreatedAt: c.createdAt,
                                count: 1
                            });
                        } else {
                            const g = groups.get(key);
                            g.count += 1;
                            if (new Date(c.createdAt) > new Date(g.latestCreatedAt)) {
                                g.latestCreatedAt = c.createdAt;
                                g.latestId = c.id;
                            }
                        }
                    });

                    const groupedCases = Array.from(groups.values())
                        .sort((a, b) => new Date(b.latestCreatedAt) - new Date(a.latestCreatedAt));

                    let html = `<div class="result success">âœ… ${data.length} dossier(s) | ${groupedCases.length} groupe(s) client+sujet</div>`;
                    html += `<div class="guide-box"><strong>Lecture simple:</strong> <strong>${totalCases}</strong> dossier(s), <strong>${clientsCount}</strong> client(s), <strong>${groupedCases.length}</strong> groupe(s) utiles Ã  traiter. Anomalies ouvertes: <strong>${openAnomalies}</strong>.</div>`;
                    html += `<div class="guide-box">Affichage regroupÃ© par <strong>client + sujet</strong> pour Ã©viter de mÃ©langer des clients diffÃ©rents ayant le mÃªme sujet. DÃ©cochez "Regrouper par sujet" pour voir tous les dossiers individuellement.</div>`;
                    html += '<div class="event-list">';
                    groupedCases.forEach(c => {
                        html += `<div class="event-item case-item" onclick="showCaseDetails('${c.latestId}')">
                            <strong>${c.title}</strong> ${c.count > 1 ? `<span class="search-badge">${c.count} dossiers</span>` : ''}
                            <div class="date">Client: ${c.clientId || 'non renseignÃ©'}</div>
                            <div class="date">Dernier dossier crÃ©Ã© le ${new Date(c.latestCreatedAt).toLocaleString('fr-FR')}</div>
                        </div>`;
                    });
                    html += '</div>';
                    document.getElementById('cases-result').innerHTML = html;
                } else {
                    showResult('cases-result', `âŒ Erreur`, false);
                }
            } catch (err) {
                showResult('cases-result', `âŒ Erreur: ${err.message}`, false);
            }
        }

        async function mergeLegacyCases() {
            if (!token) return showResult('cases-result', 'âŒ Connectez-vous d\'abord', false);

            const confirmed = confirm('Fusionner les anciens dossiers en doublon (client + sujet) ? Cette action consolide les timelines et supprime les doublons.');
            if (!confirmed) return;

            try {
                const res = await apiFetchWithFallback('/api/cases/merge-duplicates', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                const data = await readResponseDataSafe(res);

                if (!res.ok) {
                    return showResult('cases-result', `âŒ Fusion impossible: ${data?.message || 'erreur'}`, false);
                }

                showResult('cases-result',
                    `âœ… ${data.message || 'Fusion terminÃ©e'}<br>` +
                    `Groupes fusionnÃ©s: ${data.mergedGroups || 0} | ` +
                    `Dossiers supprimÃ©s: ${data.removedCases || 0} | ` +
                    `Ã‰vÃ©nements consolidÃ©s: ${data.movedEvents || 0}`
                );

                await listCases();
            } catch (err) {
                showResult('cases-result', `âŒ Erreur fusion: ${err.message}`, false);
            }
        }

        async function showCaseDetails(caseId) {
            if (!token) return;

            try {
                const [caseRes, timelineRes] = await Promise.all([
                    fetch(`${API_URL}/api/cases/${caseId}`, { headers: { 'Authorization': `Bearer ${token}` }}),
                    fetch(`${API_URL}/api/cases/${caseId}/timeline`, { headers: { 'Authorization': `Bearer ${token}` }})
                ]);

                const caseData = await readResponseDataSafe(caseRes);
                const timeline = await readResponseDataSafe(timelineRes);

                if (!caseRes.ok || !caseData) {
                    alert('Impossible de charger le dossier');
                    return;
                }

                const title = caseData.title || caseData.Title || 'Dossier';
                const id = caseData.id || caseData.Id || caseId;
                const createdAt = caseData.createdAt || caseData.CreatedAt || new Date().toISOString();
                const updatedAt = caseData.updatedAt || caseData.UpdatedAt || createdAt;
                const clientId = caseData.clientId || caseData.ClientId || null;

                let html = `<div class="modal" id="caseModal" onclick="if(event.target.id==='caseModal')closeModal()">
                    <div class="modal-content">
                        <span class="modal-close" onclick="closeModal()">&times;</span>
                        <h2 style="color: #667eea; margin-bottom: 20px;">${title}</h2>
                        <div class="guide-box"><strong>Exploitation maximale</strong> : repÃ©rez le <strong>ClientId</strong>, cliquez <strong>Rechercher ce client</strong>, puis utilisez <strong>Recherche embeddings/IA</strong> pour regrouper et prioriser les actions.</div>
                        <div style="margin-bottom: 15px;"><strong>ID:</strong> ${id}</div>
                        <div style="margin-bottom: 15px;"><strong>CrÃ©Ã© le:</strong> ${new Date(createdAt).toLocaleString('fr-FR')}</div>
                        <div style="margin-bottom: 15px;"><strong>Mis Ã  jour le:</strong> ${new Date(updatedAt).toLocaleString('fr-FR')}</div>
                        ${clientId ? `<div style="margin-bottom: 15px;"><strong>Client ID:</strong> ${clientId}</div>` : ''}
                        <h3 style="color: #667eea; margin-top: 25px; margin-bottom: 15px;">Timeline (${Array.isArray(timeline) ? timeline.length : 0} Ã©vÃ©nement(s))</h3>
                        <div class="event-list" style="max-height: 400px;">`;

                if (Array.isArray(timeline)) {
                    timeline.forEach(e => {
                        const payload = parseRawPayloadSafe(e.rawPayload);
                        html += `<div class="event-item">${renderRichEmailBlock(payload, e.occurredAt, e.id)}</div>`;
                    });
                }

                html += `</div></div></div>`;

                const existing = document.getElementById('caseModal');
                if (existing) existing.remove();

                document.body.insertAdjacentHTML('beforeend', html);
                document.getElementById('caseModal').style.display = 'block';
            } catch (err) {
                alert(`Erreur: ${err.message}`);
            }
        }

        function showTemplateModal(eventId, clientContext, subject) {
            if (!templateManager) {
                alert('Connectez-vous d\'abord');
                return;
            }
            templateManager.showTemplateModal(eventId, clientContext, subject);
        }

        function closeModal() {
            const modal = document.getElementById('caseModal');
            if (modal) modal.style.display = 'none';
        }

        function closeEventModal() {
            const modal = document.getElementById('eventModal');
            if (modal) modal.style.display = 'none';
        }

        async function showEventDetail(eventId) {
            if (!token) return alert('Connectez-vous d\'abord');

            try {
                const res = await fetch(`${API_URL}/api/events/${eventId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (!res.ok) {
                    alert('Impossible de charger l\'Ã©vÃ©nement');
                    return;
                }
                
                const event = await res.json();
                const payload = parseRawPayloadSafe(event.rawPayload);
                const digest = buildReadableEventDigest(payload, event.occurredAt, { includeFullBody: true });
                
                let html = `<div class="modal" id="eventModal" onclick="if(event.target.id==='eventModal')closeEventModal()">
                    <div class="modal-content">
                        <span class="modal-close" onclick="closeEventModal()">&times;</span>
                        <h2 style="color: #667eea; margin-bottom: 20px;">DÃ©tail de l'Ã©vÃ©nement</h2>
                        <div style="margin-bottom: 15px;"><strong>ID:</strong> ${event.id}</div>
                        <div style="margin-bottom: 15px;"><strong>Date:</strong> ${digest.when}</div>
                        <div style="margin-bottom: 15px;"><strong>De:</strong> ${digest.who}</div>
                        <div style="margin-bottom: 15px;"><strong>Sujet:</strong> ${payload.subject || 'N/A'}</div>
                        <div style="margin-bottom: 15px;"><strong>Contenu:</strong></div>
                        <div style="white-space: pre-wrap; background: #f8f9fa; padding: 15px; border-radius: 5px; max-height: 400px; overflow-y: auto;">${digest.what}</div>`;
                
                if (event.validationFlags) {
                    html += `<div style="margin-top: 15px; color: orange;"><strong>âš ï¸ Anomalies:</strong> ${event.validationFlags}</div>`;
                }
                
                html += `</div></div>`;
                
                const existing = document.getElementById('eventModal');
                if (existing) existing.remove();
                
                document.body.insertAdjacentHTML('beforeend', html);
                document.getElementById('eventModal').style.display = 'block';
            } catch (err) {
                alert(`Erreur: ${err.message}`);
            }
        }

        async function loadStats() {
            if (!token) return showResult('stats-result', 'âŒ Connectez-vous d\'abord', false);
            setLoadingState('stats-result', 'â³ Chargement des indicateurs...');

            try {
                const [perDayRes, byTypeRes, avgSevRes] = await Promise.all([
                    apiFetchWithFallback('/api/stats/events-per-day', { headers: { 'Authorization': `Bearer ${token}` }}),
                    apiFetchWithFallback('/api/stats/events-by-type', { headers: { 'Authorization': `Bearer ${token}` }}),
                    apiFetchWithFallback('/api/stats/average-severity', { headers: { 'Authorization': `Bearer ${token}` }})
                ]);

                if (!perDayRes.ok || !byTypeRes.ok || !avgSevRes.ok) {
                    return showResult('stats-result', 'âŒ Impossible de charger les statistiques', false);
                }

                const perDay = await readResponseDataSafe(perDayRes);
                const byType = await readResponseDataSafe(byTypeRes);
                const avgSev = await readResponseDataSafe(avgSevRes);

                const totalEmails = (perDay || []).reduce((a,b) => a + b.count, 0);
                const activeDays = (perDay || []).length;
                const eventTypes = (byType || []).length;
                const avgSeverity = avgSev?.averageSeverity?.toFixed(1) || 'N/A';

                let html = '<div class="stats">';
                html += `<div class="stat-box"><div class="number">${totalEmails}</div><div class="label">Emails reÃ§us</div></div>`;
                html += `<div class="stat-box"><div class="number">${activeDays}</div><div class="label">Jour(s) d'activitÃ©</div></div>`;
                html += `<div class="stat-box"><div class="number">${eventTypes}</div><div class="label">Type(s) dÃ©tectÃ©(s)</div></div>`;
                html += `<div class="stat-box"><div class="number">${avgSeverity}</div><div class="label">Niveau moyen d'alerte</div></div>`;
                html += '</div>';

                const sortedTypes = [...(byType || [])].sort((a, b) => (b.count || 0) - (a.count || 0));
                const byTypeList = sortedTypes.map(x => `${x.type}: ${x.count}`).join(', ') || 'Aucune donnÃ©e';
                const dominantType = sortedTypes[0];

                html += `<div class="guide-box"><strong>Lecture simple</strong>: vous avez reÃ§u <strong>${totalEmails} email(s)</strong> sur <strong>${activeDays} jour(s)</strong>. Le niveau moyen d'alerte est <strong>${avgSeverity}</strong>.</div>`;
                html += `<div class="result" style="margin-top: 12px;"><strong>RÃ©partition par type:</strong> ${byTypeList}</div>`;

                if (dominantType) {
                    const percent = totalEmails > 0 ? ((dominantType.count / totalEmails) * 100).toFixed(1) : '0.0';
                    html += `<div class="result" style="margin-top: 8px;"><strong>Point clÃ©:</strong> le type principal est <strong>${dominantType.type}</strong> avec <strong>${dominantType.count}</strong> email(s), soit <strong>${percent}%</strong> du total.</div>`;
                }
                
                document.getElementById('stats-result').innerHTML = html;
            } catch (err) {
                showResult('stats-result', `âŒ Erreur: ${err.message}`, false);
            }
        }

        async function loadTimelineForFirstCase() {
            if (!token) return showResult('cases-result', 'âŒ Connectez-vous d\'abord', false);

            try {
                const casesRes = await fetch(`${API_URL}/api/cases`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const casesData = await casesRes.json();
                if (!casesRes.ok || !Array.isArray(casesData) || casesData.length === 0) {
                    return showResult('cases-result', 'âŒ Aucun dossier pour timeline', false);
                }

                const caseId = lastCaseId || casesData[0].id;
                const timelineRes = await fetch(`${API_URL}/api/cases/${caseId}/timeline`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const timelineData = await timelineRes.json();

                if (!timelineRes.ok) {
                    return showResult('cases-result', 'âŒ Erreur timeline', false);
                }

                let html = `<div class="result success">âœ… Timeline dossier ${caseId}: ${timelineData.length} Ã©vÃ©nement(s)</div>`;
                html += '<div class="event-list">';
                timelineData.forEach(e => {
                    html += `<div class="event-item">
                        <div class="date">${new Date(e.occurredAt).toLocaleString('fr-FR')}</div>
                        <div class="content">${(e.rawPayload || '').substring(0, 200)}...</div>
                    </div>`;
                });
                html += '</div>';
                document.getElementById('cases-result').innerHTML = html;
            } catch (err) {
                showResult('cases-result', `âŒ Erreur: ${err.message}`, false);
            }
        }

        async function exportEventsText() {
            if (!token) return showResult('export-result', 'âŒ Connectez-vous d\'abord', false);
            
            try {
                const res = await fetch(`${API_URL}/api/export/events-text`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (res.ok) {
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `events_text_${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    showResult('export-result', `âœ… Export rÃ©ussi (${data.length} Ã©vÃ©nement(s))`);
                } else {
                    showResult('export-result', `âŒ Erreur d'export`, false);
                }
            } catch (err) {
                showResult('export-result', `âŒ Erreur: ${err.message}`, false);
            }
        }

        async function loadAlerts() {
            if (!token) return showResult('alerts-result', 'âŒ Connectez-vous d\'abord', false);
            setLoadingState('alerts-result', 'â³ Chargement des alertes et notifications...');

            try {
                const [attentionRes, notificationsRes] = await Promise.all([
                    apiFetchWithFallback('/api/alerts/requires-attention', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    apiFetchWithFallback('/api/notifications?unreadOnly=true', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                ]);

                const attentionData = await readResponseDataSafe(attentionRes);
                const unreadNotifications = await readResponseDataSafe(notificationsRes);

                if (!attentionRes.ok) {
                    return showResult('alerts-result', 'âŒ Erreur chargement alertes', false);
                }

                const notifications = Array.isArray(unreadNotifications) ? unreadNotifications : [];
                const data = attentionData || { count: 0, events: [] };

                if ((data.count || 0) === 0 && notifications.length === 0) {
                    return showResult('alerts-result', 'âœ… Aucun email en anomalie et aucune notification en attente.');
                }

                let html = '';

                if ((data.count || 0) > 0) {
                    html += `<div class="result" style="border-left-color: orange; background: #fff3cd;">âš ï¸ ${data.count} email(s) nÃ©cessitent votre attention<br><strong>DÃ©cision finale:</strong> Utilisateur (les actions proposÃ©es sont des aides)<br>`;
                    html += `<button class="btn" style="margin-top:8px; background:#c62828;" onclick="bulkDeleteAllAttentionEvents(${data.count})">Supprimer tout d'un coup (${data.count})</button>`;
                    html += `<button class="btn" style="margin-top:8px; background:#8d6e63;" onclick="bulkDeleteAttentionExcept(${data.count})">Tout supprimer sauf un type...</button>`;
                    html += `</div>`;

                    html += '<div class="event-list">';
                    data.events.forEach(e => {
                        const payload = parseRawPayloadSafe(e.rawPayload);
                        const flags = e.validationFlags ? e.validationFlags.split(',') : [];
                        const from = payload.from || payload.From || 'Manquant';
                        const subject = payload.subject || payload.Subject || 'Manquant';
                        const body = payload.body || payload.Body || '';
                        const readableFlags = renderReadableAnomalyFlags(flags);

                        html += `<div class="event-item case-item" style="border-left-color: orange; cursor:pointer;" onclick="showEventDetail('${e.id}')">
                            <div class="date">${new Date(e.occurredAt).toLocaleString('fr-FR')}</div>
                            <div><strong>De:</strong> <span style="color:${from === 'Manquant' ? 'red' : 'inherit'};">${escapeScanHtml(from)}</span></div>
                            <div><strong>Sujet:</strong> <span style="color:${subject === 'Manquant' ? 'red' : 'inherit'};">${escapeScanHtml(subject)}</span></div>
                            <div class="content" style="margin-top:8px;">${escapeScanHtml(body.substring(0, 150))}${body.length > 150 ? '...' : ''}</div>
                            <div style="color: orange; margin-top: 8px;">âš ï¸ Anomalies: ${readableFlags}</div>
                            <button class="btn" style="margin-top: 8px;" onclick="event.stopPropagation(); showEventDetail('${e.id}')">Voir tous les dÃ©tails</button>
                            <button class="btn" style="margin-top: 8px; background:#c62828;" onclick="event.stopPropagation(); deleteEventFromAlert('${e.id}')">Supprimer cet Ã©vÃ©nement</button>
                        </div>`;
                    });
                    html += '</div>';
                }

                html += `<div class="result" style="margin-top:10px; border-left-color:#667eea; background:#eef3ff;">ðŸ”” Notifications Ã  traiter: <strong>${notifications.length}</strong>`;
                if (notifications.length > 0) {
                    html += `<div style="margin-top:8px; display:flex; gap:8px; flex-wrap:wrap;">`;
                    html += `<button class="btn" onclick="toggleAllAlertNotifications(true)">Tout cocher</button>`;
                    html += `<button class="btn" onclick="toggleAllAlertNotifications(false)">Tout dÃ©cocher</button>`;
                    html += `<button class="btn" style="background:#2e7d32;" onclick="closeSelectedNotificationsManually()">ClÃ´turer la sÃ©lection (log)</button>`;
                    html += `</div>`;
                }
                html += `</div>`;

                if (notifications.length > 0) {
                    html += '<div class="event-list">';
                    notifications.forEach(n => {
                        html += `<div class="event-item" style="border-left-color:#667eea;">
                            <label style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                                <input type="checkbox" class="alert-notification-checkbox" value="${escapeScanHtml(n.id)}" />
                                <span>SÃ©lectionner pour clÃ´ture groupÃ©e</span>
                            </label>
                            <div class="date">${new Date(n.createdAt).toLocaleString('fr-FR')} - ${escapeScanHtml(n.type || 'INFO')}</div>
                            <div><strong>${escapeScanHtml(n.title || 'Notification')}</strong></div>
                            <div class="content">${escapeScanHtml(n.message || '')}</div>
                            <div style="margin-top:8px; display:flex; gap:8px; flex-wrap:wrap;">
                                <button class="btn" onclick="markNotificationAsRead('${n.id}')">Marquer lue</button>
                                <button class="btn" style="background:#2e7d32;" onclick="closeNotificationManually('${n.id}')">ClÃ´turer manuellement (log)</button>
                                <button class="btn" style="background:#8d6e63;" onclick="dismissNotificationFromAlerts('${n.id}')">Ignorer (log)</button>
                            </div>
                        </div>`;
                    });
                    html += '</div>';
                }

                document.getElementById('alerts-result').innerHTML = html;
            } catch (err) {
                showResult('alerts-result', `âŒ Erreur: ${err.message}`, false);
            }
        }

        const ANOMALY_FLAG_LABELS = {
            DUPLICATE_EXTERNAL_ID: 'Email dÃ©jÃ  reÃ§u (mÃªme identifiant)',
            DUPLICATE_CONTENT: 'Contenu identique Ã  un email existant',
            MISSING_SENDER: 'ExpÃ©diteur manquant',
            MISSING_SUBJECT: 'Sujet manquant',
            MISSING_BODY: 'Contenu du message manquant'
        };

        function getReadableAnomalyFlag(flag) {
            const key = (flag || '').toString().trim().toUpperCase();
            return ANOMALY_FLAG_LABELS[key] || key || 'Anomalie non prÃ©cisÃ©e';
        }

        function renderReadableAnomalyFlags(flags) {
            if (!Array.isArray(flags) || flags.length === 0) {
                return '<span class="meta-chip">Aucune anomalie</span>';
            }

            return flags
                .filter(Boolean)
                .map(f => {
                    const raw = (f || '').toString().trim().toUpperCase();
                    const label = getReadableAnomalyFlag(raw);
                    return `<span class="meta-chip" title="Code: ${escapeScanHtml(raw)}">${escapeScanHtml(label)}</span>`;
                })
                .join(' ');
        }

        async function markNotificationAsRead(notificationId) {
            if (!token) return;

            try {
                const res = await apiFetchWithFallback(`/api/notifications/${notificationId}/mark-read`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                const data = await readResponseDataSafe(res);
                if (!res.ok) {
                    return showResult('alerts-result', `âŒ Impossible de marquer comme lue: ${data?.message || 'erreur'}`, false);
                }

                showResult('alerts-result', 'âœ… Notification marquÃ©e comme lue (action loguÃ©e).');
                await loadAlerts();
                await refreshAnomalyBadge();
            } catch (err) {
                showResult('alerts-result', `âŒ Erreur marquage notification: ${err.message}`, false);
            }
        }

        function getSelectedAlertNotificationIds() {
            return Array.from(document.querySelectorAll('.alert-notification-checkbox:checked'))
                .map(input => input.value)
                .filter(Boolean);
        }

        function toggleAllAlertNotifications(checked) {
            document.querySelectorAll('.alert-notification-checkbox').forEach(input => {
                input.checked = checked === true;
            });
        }

        async function closeSelectedNotificationsManually() {
            if (!token) return;

            const ids = getSelectedAlertNotificationIds();
            if (ids.length === 0) {
                return showResult('alerts-result', 'âš ï¸ Cochez au moins une notification Ã  clÃ´turer.', false);
            }

            const resolution = prompt(
                `Action de clÃ´ture Ã  journaliser pour ${ids.length} notification(s):`,
                'ClÃ´ture groupÃ©e validÃ©e par l\'utilisateur'
            );

            if (!resolution) return;

            let successCount = 0;
            let failureCount = 0;

            for (const notificationId of ids) {
                try {
                    const res = await apiFetchWithFallback(`/api/notifications/${notificationId}/resolve`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ resolution, action: 'MANUAL_CLOSE_BULK' })
                    });

                    if (res.ok) {
                        successCount++;
                    } else {
                        failureCount++;
                    }
                } catch {
                    failureCount++;
                }
            }

            if (failureCount === 0) {
                showResult('alerts-result', `âœ… ${successCount} notification(s) clÃ´turÃ©e(s) et loguÃ©e(s).`);
            } else {
                showResult('alerts-result', `âš ï¸ ClÃ´ture groupÃ©e partielle: ${successCount} rÃ©ussie(s), ${failureCount} en Ã©chec.`, false);
            }

            await loadAlerts();
            await refreshAnomalyBadge();

            const anomalyCenterEl = document.getElementById('anomaly-center-result');
            if (anomalyCenterEl && anomalyCenterEl.innerHTML.trim().length > 0) {
                await loadAnomalyCenter();
            }
        }

        async function closeNotificationManually(notificationId) {
            if (!token) return;

            const resolution = prompt('Action de clÃ´ture Ã  journaliser:', 'ClÃ´ture manuelle validÃ©e par l\'utilisateur');
            if (!resolution) return;

            try {
                const res = await apiFetchWithFallback(`/api/notifications/${notificationId}/resolve`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ resolution, action: 'MANUAL_CLOSE' })
                });

                const data = await readResponseDataSafe(res);
                if (!res.ok) {
                    return showResult('alerts-result', `âŒ ClÃ´ture manuelle impossible: ${data?.message || 'erreur'}`, false);
                }

                showResult('alerts-result', 'âœ… Notification clÃ´turÃ©e manuellement et loguÃ©e dans l\'audit.');
                await loadAlerts();
                await refreshAnomalyBadge();

                const anomalyCenterEl = document.getElementById('anomaly-center-result');
                if (anomalyCenterEl && anomalyCenterEl.innerHTML.trim().length > 0) {
                    await loadAnomalyCenter();
                }
            } catch (err) {
                showResult('alerts-result', `âŒ Erreur clÃ´ture manuelle: ${err.message}`, false);
            }
        }

        async function dismissNotificationFromAlerts(notificationId) {
            if (!token) return;

            const reason = prompt('Raison de fermeture (optionnel):', 'Notification traitÃ©e manuellement');
            if (reason === null) return;

            try {
                const res = await apiFetchWithFallback(`/api/notifications/${notificationId}/dismiss`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ reason })
                });

                const data = await readResponseDataSafe(res);
                if (!res.ok) {
                    return showResult('alerts-result', `âŒ Fermeture impossible: ${data?.message || 'erreur'}`, false);
                }

                showResult('alerts-result', 'âœ… Notification fermÃ©e et loguÃ©e.');
                await loadAlerts();
                await refreshAnomalyBadge();
            } catch (err) {
                showResult('alerts-result', `âŒ Erreur fermeture notification: ${err.message}`, false);
            }
        }

        async function bulkDeleteAllAttentionEvents(currentCount) {
            if (!token) return showResult('alerts-result', 'âŒ Connectez-vous d\'abord', false);

            const count = Number(currentCount || 0);
            const confirmed = confirm(`Supprimer d'un coup tous les emails nÃ©cessitant attention pour cet utilisateur ?\nVolume estimÃ©: ${count}.\nAction irrÃ©versible.`);
            if (!confirmed) return;

            try {
                const res = await apiFetchWithFallback('/api/events/bulk-delete-attention', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ maxToDelete: Math.max(count, 1) })
                });

                const data = await readResponseDataSafe(res);
                if (!res.ok) {
                    return showResult('alerts-result', `âŒ Suppression en masse impossible: ${data?.message || 'erreur'}`, false);
                }

                showResult('alerts-result', `âœ… ${data.message || 'Suppression en masse effectuÃ©e'} (${data.deletedCount || 0} supprimÃ©(s))`);
                await loadAlerts();
                await refreshAnomalyBadge();

                const anomalyCenterEl = document.getElementById('anomaly-center-result');
                if (anomalyCenterEl && anomalyCenterEl.innerHTML.trim().length > 0) {
                    await loadAnomalyCenter();
                }
            } catch (err) {
                showResult('alerts-result', `âŒ Erreur suppression en masse: ${err.message}`, false);
            }
        }

        async function bulkDeleteAttentionExcept(currentCount) {
            if (!token) return showResult('alerts-result', 'âŒ Connectez-vous d\'abord', false);

            const excludedFlag = prompt('Conserver quel type d\'anomalie ? (ex: MISSING_SENDER, DUPLICATE_CONTENT)', 'MISSING_SENDER');
            if (!excludedFlag) return;

            const count = Number(currentCount || 0);
            const confirmed = confirm(`Supprimer tous les emails en attention SAUF ${excludedFlag.trim().toUpperCase()} ?\nVolume estimÃ©: ${count}.\nAction irrÃ©versible.`);
            if (!confirmed) return;

            try {
                const res = await apiFetchWithFallback('/api/events/bulk-delete-attention', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        maxToDelete: Math.max(count, 1),
                        excludedValidationFlag: excludedFlag.trim().toUpperCase()
                    })
                });

                const data = await readResponseDataSafe(res);
                if (!res.ok) {
                    return showResult('alerts-result', `âŒ Suppression en masse impossible: ${data?.message || 'erreur'}`, false);
                }

                showResult('alerts-result',
                    `âœ… Suppression en masse effectuÃ©e (${data.deletedCount || 0} supprimÃ©(s))<br>` +
                    `Type conservÃ©: ${data.excludedValidationFlag || excludedFlag}`);

                await loadAlerts();
                await refreshAnomalyBadge();

                const anomalyCenterEl = document.getElementById('anomaly-center-result');
                if (anomalyCenterEl && anomalyCenterEl.innerHTML.trim().length > 0) {
                    await loadAnomalyCenter();
                }
            } catch (err) {
                showResult('alerts-result', `âŒ Erreur suppression en masse: ${err.message}`, false);
            }
        }

        async function loadAudit() {
            if (!token) return showResult('audit-result', 'âŒ Connectez-vous d\'abord', false);
            setLoadingState('audit-result', 'â³ Chargement de l\'historique d\'audit...');

            try {
                const res = await apiFetchWithFallback('/api/audit/user-actions?limit=100', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                const actions = Array.isArray(data) ? data : (data.actions || []);

                if (res.ok) {
                    let html = `<div class="result success">âœ… ${actions.length} action(s) d'audit</div>`;
                    html += '<div class="event-list">';
                    actions.forEach(a => {
                        html += `<div class="event-item">
                            <strong>${a.action}</strong>
                            <div class="date">${new Date(a.occurredAt).toLocaleString('fr-FR')}</div>
                            <div class="content">${(a.metadata || '').toString().substring(0, 200)}</div>
                        </div>`;
                    });
                    html += '</div>';
                    document.getElementById('audit-result').innerHTML = html;
                } else {
                    showResult('audit-result', `âŒ Erreur`, false);
                }
            } catch (err) {
                showResult('audit-result', `âŒ Erreur de connexion API: ${err.message}`, false);
            }
        }

        async function deleteEventFromAlert(eventId) {
            if (!token) return showResult('alerts-result', 'âŒ Connectez-vous d\'abord', false);

            if (!confirm('Supprimer cet Ã©vÃ©nement ? Cette action est irrÃ©versible.')) {
                return;
            }

            try {
                const res = await fetch(`${API_URL}/api/events/${eventId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (res.ok) {
                    showResult('alerts-result', `âœ… ${data.message} (${eventId})`);
                    await loadAlerts();
                    await refreshAnomalyBadge();
                    const anomalyCenterEl = document.getElementById('anomaly-center-result');
                    if (anomalyCenterEl && anomalyCenterEl.innerHTML.trim().length > 0) {
                        await loadAnomalyCenter();
                    }
                } else {
                    showResult('alerts-result', `âŒ Suppression impossible`, false);
                }
            } catch (err) {
                showResult('alerts-result', `âŒ Erreur: ${err.message}`, false);
            }
        }

        async function acquitterDoublon(notificationId) {
            if (!token) return alert('Connectez-vous d\'abord');

            const raison = prompt('Raison de l\'acquittement (optionnel):', 'Doublon confirmÃ© - Email lÃ©gitime');
            if (raison === null) return;

            try {
                const res = await fetch(`${API_URL}/api/notifications/${notificationId}/dismiss`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ reason: raison })
                });
                const data = await res.json();
                if (res.ok) {
                    document.getElementById('ingest-result').innerHTML = `<div class="result success">âœ… Doublon acquittÃ© - Action loguÃ©e dans l'audit</div>`;
                } else {
                    alert('Erreur lors de l\'acquittement');
                }
            } catch (err) {
                alert(`Erreur: ${err.message}`);
            }
        }

        document.getElementById('installBtn')?.addEventListener('click', async () => {
            try {
                await installApp();
            } catch (err) {
                alert(`Erreur installation: ${err.message}`);
            }
        });

        document.getElementById('stopBtn')?.addEventListener('click', async () => {
            try {
                await stopApplication();
            } catch (err) {
                alert(`Erreur arrÃªt: ${err.message}`);
            }
        });

        prefillDemoFields();
        restoreSession();
        applyAccessMode();
        autoConnectDefaultUser();
        keepPinnedSessionAlive();
        refreshServiceStatus();
        setInterval(refreshServiceStatus, 5000);
        setInterval(() => {
            if (token) refreshAnomalyBadge();
        }, 8000);
        setInterval(keepPinnedSessionAlive, 180000);

        async function testCriticalAlert() {
            if (criticalAlerts) {
                await criticalAlerts.sendUrgentAlert('Test d\'alerte critique - Nouveau dossier urgent reÃ§u!');
                criticalAlerts.showCriticalAlert({
                    message: 'Test rÃ©ussi! SystÃ¨me d\'alertes opÃ©rationnel.',
                    timestamp: new Date().toISOString()
                });
            } else {
                alert('Connectez-vous d\'abord pour tester les alertes');
            }
        }

        // Team management functions
        async function loadTeamData() {
            if (!token) {
                document.getElementById('teamMembersList').innerHTML = 'Connectez-vous d\'abord';
                document.getElementById('teamPendingList').innerHTML = 'Connectez-vous d\'abord';
                return;
            }

            setLoadingState('teamMembersList', 'â³ Chargement des membres...');
            setLoadingState('teamPendingList', 'â³ Chargement des invitations...');
            
            try {
                const response = await apiFetchWithFallback('/api/team/members', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await readResponseDataSafe(response);
                
                if (response.ok) {
                    displayTeamMembers(data.members || []);
                    displayPendingInvitations(data.pendingInvitations || []);
                } else {
                    const errorMessage = typeof data === 'string' ? data : (data?.message || 'Erreur de chargement');
                    document.getElementById('teamMembersList').innerHTML = `Erreur: ${errorMessage}`;
                    document.getElementById('teamPendingList').innerHTML = `Erreur: ${errorMessage}`;
                }
            } catch (error) {
                document.getElementById('teamMembersList').innerHTML = 'Erreur de connexion';
                document.getElementById('teamPendingList').innerHTML = 'Erreur de connexion';
            }
        }
        
        function displayTeamMembers(members) {
            const container = document.getElementById('teamMembersList');
            if (!members || members.length === 0) {
                container.innerHTML = 'Aucun membre dans l\'Ã©quipe. Invitez des collaborateurs ci-dessus.';
                return;
            }
            
            let html = '<div class="event-list">';
            members.forEach(member => {
                const memberId = pickValue(member, 'id', 'Id');
                const user = pickValue(member, 'user', 'User') || {};
                const role = pickValue(member, 'role', 'Role') || 'N/A';
                const joinedAt = pickValue(member, 'joinedAt', 'JoinedAt');
                const roleLabel = getRoleLabel(role);

                const roleOptions = ['OWNER', 'PARTNER', 'LAWYER', 'PARALEGAL', 'SECRETARY', 'INTERN']
                    .map(r => `<option value="${r}" ${r === role ? 'selected' : ''}>${getRoleLabel(r)}</option>`)
                    .join('');

                html += `<div class="event-item">
                    <strong>${pickValue(user, 'name', 'Name') || 'N/A'}</strong>
                    <div class="date">${pickValue(user, 'email', 'Email') || 'N/A'} - ${roleLabel}</div>
                    <div class="content">Rejoint le ${joinedAt ? new Date(joinedAt).toLocaleDateString('fr-FR') : 'N/A'}</div>
                    <div style="margin-top:8px; display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
                        <select id="team-role-${memberId}" style="padding:6px; border-radius:4px; border:1px solid #ddd;">
                            ${roleOptions}
                        </select>
                        <button class="btn" onclick="updateTeamMemberRole('${memberId}')">Changer rÃ´le</button>
                        <button class="btn" style="background:#c62828;" onclick="removeTeamMember('${memberId}')">Retirer membre</button>
                    </div>
                </div>`;
            });
            html += '</div>';
            container.innerHTML = html;
        }
        
        function displayPendingInvitations(invitations) {
            const container = document.getElementById('teamPendingList');
            if (!invitations || invitations.length === 0) {
                container.innerHTML = 'Aucune invitation en attente.';
                return;
            }
            
            let html = '<div class="event-list">';
            invitations.forEach(inv => {
                const invitationId = pickValue(inv, 'id', 'Id');
                const role = pickValue(inv, 'role', 'Role') || 'N/A';
                const email = pickValue(inv, 'email', 'Email') || 'N/A';
                const createdAt = pickValue(inv, 'createdAt', 'CreatedAt');
                const expiresAt = pickValue(inv, 'expiresAt', 'ExpiresAt');
                const roleLabel = getRoleLabel(role);
                const encodedEmail = encodeURIComponent(email);
                const encodedRole = encodeURIComponent(role);
                html += `<div class="event-item">
                    <strong>${email}</strong>
                    <div class="date">${roleLabel}</div>
                    <div class="content">EnvoyÃ©e le ${createdAt ? new Date(createdAt).toLocaleDateString('fr-FR') : 'N/A'}</div>
                    <div class="content">Expire le ${expiresAt ? new Date(expiresAt).toLocaleDateString('fr-FR') : 'N/A'}</div>
                    <div style="margin-top:8px; display:flex; gap:8px; flex-wrap:wrap;">
                        <button class="btn" onclick="resendPendingInvitation('${encodedEmail}','${encodedRole}')">Renvoyer invitation</button>
                        <button class="btn" style="background:#c62828;" onclick="cancelPendingInvitation('${invitationId}')">Annuler invitation</button>
                    </div>
                </div>`;
            });
            html += '</div>';
            container.innerHTML = html;
        }
        
        function getRoleLabel(role) {
            const labels = {
                'OWNER': 'PropriÃ©taire',
                'PARTNER': 'AssociÃ©',
                'LAWYER': 'Avocat',
                'PARALEGAL': 'Juriste',
                'SECRETARY': 'SecrÃ©taire',
                'INTERN': 'Stagiaire'
            };
            return labels[role] || role;
        }

        async function updateTeamMemberRole(memberId) {
            if (!token) return showResult('teamInviteResult', 'Connectez-vous d\'abord', false);

            const select = document.getElementById(`team-role-${memberId}`);
            const role = select?.value;
            if (!role) {
                return showResult('teamInviteResult', 'RÃ´le invalide', false);
            }

            try {
                const response = await apiFetchWithFallback(`/api/team/members/${memberId}/role`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ role })
                });

                const data = await readResponseDataSafe(response);
                if (!response.ok) {
                    const msg = typeof data === 'string' ? data : (data?.message || 'Mise Ã  jour impossible');
                    return showResult('teamInviteResult', `âŒ ${msg}`, false);
                }

                showResult('teamInviteResult', `âœ… RÃ´le mis Ã  jour (${getRoleLabel(role)}).`);
                await loadTeamData();
            } catch (error) {
                showResult('teamInviteResult', 'âŒ Erreur de connexion', false);
            }
        }

        async function removeTeamMember(memberId) {
            if (!token) return showResult('teamInviteResult', 'Connectez-vous d\'abord', false);

            const confirmed = confirm('Retirer ce membre de l\'Ã©quipe ?');
            if (!confirmed) return;

            try {
                const response = await apiFetchWithFallback(`/api/team/members/${memberId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data = await readResponseDataSafe(response);
                if (!response.ok) {
                    const msg = typeof data === 'string' ? data : (data?.message || 'Suppression impossible');
                    return showResult('teamInviteResult', `âŒ ${msg}`, false);
                }

                showResult('teamInviteResult', 'âœ… Membre retirÃ© de l\'Ã©quipe.');
                await loadTeamData();
            } catch (error) {
                showResult('teamInviteResult', 'âŒ Erreur de connexion', false);
            }
        }

        async function copyTeamInviteUrl(encodedUrl) {
            const inviteUrl = decodeURIComponent(encodedUrl || '');
            if (!inviteUrl) return;

            try {
                await navigator.clipboard.writeText(inviteUrl);
                showResult('teamInviteResult', `âœ… Lien d'invitation copiÃ©.<br><small>${inviteUrl}</small>`);
            } catch {
                showResult('teamInviteResult', `âœ… Invitation crÃ©Ã©e. Copiez ce lien:<br><small>${inviteUrl}</small>`);
            }
        }

        async function resendPendingInvitation(emailEnc, roleEnc) {
            if (!token) return showResult('teamInviteResult', 'Connectez-vous d\'abord', false);

            const email = decodeURIComponent(emailEnc || '');
            const role = decodeURIComponent(roleEnc || '');

            if (!email || !role) {
                return showResult('teamInviteResult', 'Invitation invalide', false);
            }

            try {
                const response = await apiFetchWithFallback('/api/team/invite', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ email, role })
                });

                const data = await readResponseDataSafe(response);
                if (!response.ok) {
                    const msg = typeof data === 'string' ? data : (data?.message || 'Impossible de renvoyer l\'invitation');
                    return showResult('teamInviteResult', `âŒ ${msg}`, false);
                }

                const inviteUrl = (data?.inviteUrl || '').toString();
                const encodedInviteUrl = encodeURIComponent(inviteUrl);
                let message = `âœ… Invitation renvoyÃ©e Ã  ${email}`;

                if (inviteUrl) {
                    message += `<br><small>Lien: ${inviteUrl}</small>`;
                    message += `<br><button class="btn" onclick="copyTeamInviteUrl('${encodedInviteUrl}')">Copier le lien d'invitation</button>`;
                }

                showResult('teamInviteResult', message);
                await loadTeamData();
            } catch {
                showResult('teamInviteResult', 'âŒ Erreur de connexion', false);
            }
        }

        async function cancelPendingInvitation(invitationId) {
            if (!token) return showResult('teamInviteResult', 'Connectez-vous d\'abord', false);
            if (!invitationId) return showResult('teamInviteResult', 'Invitation invalide', false);

            const confirmed = confirm('Annuler cette invitation en attente ?');
            if (!confirmed) return;

            try {
                const response = await apiFetchWithFallback(`/api/team/invitations/${invitationId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data = await readResponseDataSafe(response);
                if (!response.ok) {
                    const msg = typeof data === 'string' ? data : (data?.message || 'Annulation impossible');
                    return showResult('teamInviteResult', `âŒ ${msg}`, false);
                }

                showResult('teamInviteResult', 'âœ… Invitation annulÃ©e (action loguÃ©e).');
                await loadTeamData();
            } catch {
                showResult('teamInviteResult', 'âŒ Erreur de connexion', false);
            }
        }
        
        // Team invite form handler
        document.addEventListener('DOMContentLoaded', function() {
            const teamForm = document.getElementById('teamInviteForm');
            if (teamForm) {
                teamForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    if (!token) {
                        showResult('teamInviteResult', 'Connectez-vous d\'abord', false);
                        return;
                    }
                    
                    const email = document.getElementById('teamInviteEmail').value;
                    const role = document.getElementById('teamInviteRole').value;
                    
                    try {
                        const response = await fetch(`${API_URL}/api/team/invite`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ email, role })
                        });
                        
                        if (response.ok) {
                            const data = await response.json();
                            const inviteUrl = (data?.inviteUrl || '').toString();
                            const encodedInviteUrl = encodeURIComponent(inviteUrl);

                            let message = `âœ… Invitation envoyÃ©e Ã  ${email}`;
                            if (inviteUrl) {
                                message += `<br><small>Lien: ${inviteUrl}</small>`;
                                message += `<br><button class="btn" onclick="copyTeamInviteUrl('${encodedInviteUrl}')">Copier le lien d'invitation</button>`;
                            }

                            showResult('teamInviteResult', message);
                            document.getElementById('teamInviteForm').reset();
                            loadTeamData();
                        } else {
                            const errorData = await response.json().catch(() => ({}));
                            showResult('teamInviteResult', `Erreur: ${errorData.message || 'Impossible d\'envoyer l\'invitation'}`, false);
                        }
                    } catch (error) {
                        showResult('teamInviteResult', 'Erreur de connexion', false);
                    }
                });
            }
        });
        
        // showTab gÃ¨re directement le chargement de l'onglet Ã©quipe.
    
