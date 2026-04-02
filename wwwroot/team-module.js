(function () {
    const getToken = () => window.token;

    const pick = (source, ...keys) => {
        if (typeof window.pickValue === 'function') {
            return window.pickValue(source, ...keys);
        }

        for (const key of keys) {
            if (source && source[key] !== undefined && source[key] !== null) {
                return source[key];
            }
        }
        return null;
    };

    const show = (elementId, message, isSuccess = true) => {
        if (typeof window.showResult === 'function') {
            window.showResult(elementId, message, isSuccess);
            return;
        }

        const el = document.getElementById(elementId);
        if (!el) return;
        el.innerHTML = `<div class="result ${isSuccess ? 'success' : 'error'}">${message}</div>`;
    };

    const setLoading = (elementId, message) => {
        if (typeof window.setLoadingState === 'function') {
            window.setLoadingState(elementId, message);
            return;
        }

        const el = document.getElementById(elementId);
        if (!el) return;
        el.innerHTML = `<div class="result">${message || '⏳ Chargement...'}</div>`;
    };

    function getRoleLabel(role) {
        const labels = {
            OWNER: 'Propriétaire',
            PARTNER: 'Associé',
            LAWYER: 'Avocat',
            PARALEGAL: 'Juriste',
            SECRETARY: 'Secrétaire',
            INTERN: 'Stagiaire'
        };
        return labels[role] || role;
    }

    function displayTeamMembers(members) {
        const container = document.getElementById('teamMembersList');
        if (!container) return;

        if (!members || members.length === 0) {
            container.innerHTML = 'Aucun membre dans l\'équipe. Invitez des collaborateurs ci-dessus.';
            return;
        }

        let html = '<div class="event-list">';
        members.forEach(member => {
            const memberId = pick(member, 'id', 'Id');
            const user = pick(member, 'user', 'User') || {};
            const role = pick(member, 'role', 'Role') || 'N/A';
            const joinedAt = pick(member, 'joinedAt', 'JoinedAt');
            const roleLabel = getRoleLabel(role);

            const roleOptions = ['OWNER', 'PARTNER', 'LAWYER', 'PARALEGAL', 'SECRETARY', 'INTERN']
                .map(r => `<option value="${r}" ${r === role ? 'selected' : ''}>${getRoleLabel(r)}</option>`)
                .join('');

            html += `<div class="event-item">
                <strong>${pick(user, 'name', 'Name') || 'N/A'}</strong>
                <div class="date">${pick(user, 'email', 'Email') || 'N/A'} - ${roleLabel}</div>
                <div class="content">Rejoint le ${joinedAt ? new Date(joinedAt).toLocaleDateString('fr-FR') : 'N/A'}</div>
                <div style="margin-top:8px; display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
                    <select id="team-role-${memberId}" style="padding:6px; border-radius:4px; border:1px solid #ddd;">
                        ${roleOptions}
                    </select>
                    <button class="btn" onclick="updateTeamMemberRole('${memberId}')">Changer rôle</button>
                    <button class="btn" style="background:#c62828;" onclick="removeTeamMember('${memberId}')">Retirer membre</button>
                </div>
            </div>`;
        });
        html += '</div>';
        container.innerHTML = html;
    }

    function displayPendingInvitations(invitations) {
        const container = document.getElementById('teamPendingList');
        if (!container) return;

        if (!invitations || invitations.length === 0) {
            container.innerHTML = 'Aucune invitation en attente.';
            return;
        }

        let html = '<div class="event-list">';
        invitations.forEach(inv => {
            const role = pick(inv, 'role', 'Role') || 'N/A';
            const email = pick(inv, 'email', 'Email') || 'N/A';
            const createdAt = pick(inv, 'createdAt', 'CreatedAt');
            const expiresAt = pick(inv, 'expiresAt', 'ExpiresAt');
            const roleLabel = getRoleLabel(role);
            const encodedEmail = encodeURIComponent(email);
            const encodedRole = encodeURIComponent(role);

            html += `<div class="event-item">
                <strong>${email}</strong>
                <div class="date">${roleLabel}</div>
                <div class="content">Envoyée le ${createdAt ? new Date(createdAt).toLocaleDateString('fr-FR') : 'N/A'}</div>
                <div class="content">Expire le ${expiresAt ? new Date(expiresAt).toLocaleDateString('fr-FR') : 'N/A'}</div>
                <div style="margin-top:8px; display:flex; gap:8px; flex-wrap:wrap;">
                    <button class="btn" onclick="resendPendingInvitation('${encodedEmail}','${encodedRole}')">Renvoyer invitation</button>
                </div>
            </div>`;
        });
        html += '</div>';
        container.innerHTML = html;
    }

    async function loadTeamData() {
        if (!getToken()) {
            const members = document.getElementById('teamMembersList');
            const pending = document.getElementById('teamPendingList');
            if (members) members.innerHTML = 'Connectez-vous d\'abord';
            if (pending) pending.innerHTML = 'Connectez-vous d\'abord';
            return;
        }

        setLoading('teamMembersList', '⏳ Chargement des membres...');
        setLoading('teamPendingList', '⏳ Chargement des invitations...');

        try {
            const response = await window.apiFetchWithFallback('/api/team/members', {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            const data = await window.readResponseDataSafe(response);

            if (response.ok) {
                displayTeamMembers(data.members || []);
                displayPendingInvitations(data.pendingInvitations || []);
            } else {
                const errorMessage = typeof data === 'string' ? data : (data?.message || 'Erreur de chargement');
                const members = document.getElementById('teamMembersList');
                const pending = document.getElementById('teamPendingList');
                if (members) members.innerHTML = `Erreur: ${errorMessage}`;
                if (pending) pending.innerHTML = `Erreur: ${errorMessage}`;
            }
        } catch {
            const members = document.getElementById('teamMembersList');
            const pending = document.getElementById('teamPendingList');
            if (members) members.innerHTML = 'Erreur de connexion';
            if (pending) pending.innerHTML = 'Erreur de connexion';
        }
    }

    async function updateTeamMemberRole(memberId) {
        if (!getToken()) return show('teamInviteResult', 'Connectez-vous d\'abord', false);

        const select = document.getElementById(`team-role-${memberId}`);
        const role = select?.value;
        if (!role) {
            return show('teamInviteResult', 'Rôle invalide', false);
        }

        try {
            const response = await window.apiFetchWithFallback(`/api/team/members/${memberId}/role`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getToken()}`
                },
                body: JSON.stringify({ role })
            });

            const data = await window.readResponseDataSafe(response);
            if (!response.ok) {
                const msg = typeof data === 'string' ? data : (data?.message || 'Mise à jour impossible');
                return show('teamInviteResult', `❌ ${msg}`, false);
            }

            show('teamInviteResult', `✅ Rôle mis à jour (${getRoleLabel(role)}).`);
            await loadTeamData();
        } catch {
            show('teamInviteResult', '❌ Erreur de connexion', false);
        }
    }

    async function removeTeamMember(memberId) {
        if (!getToken()) return show('teamInviteResult', 'Connectez-vous d\'abord', false);

        const confirmed = confirm('Retirer ce membre de l\'équipe ?');
        if (!confirmed) return;

        try {
            const response = await window.apiFetchWithFallback(`/api/team/members/${memberId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${getToken()}`
                }
            });

            const data = await window.readResponseDataSafe(response);
            if (!response.ok) {
                const msg = typeof data === 'string' ? data : (data?.message || 'Suppression impossible');
                return show('teamInviteResult', `❌ ${msg}`, false);
            }

            show('teamInviteResult', '✅ Membre retiré de l\'équipe.');
            await loadTeamData();
        } catch {
            show('teamInviteResult', '❌ Erreur de connexion', false);
        }
    }

    async function copyTeamInviteUrl(encodedUrl) {
        const inviteUrl = decodeURIComponent(encodedUrl || '');
        if (!inviteUrl) return;

        try {
            await navigator.clipboard.writeText(inviteUrl);
            show('teamInviteResult', `✅ Lien d'invitation copié.<br><small>${inviteUrl}</small>`);
        } catch {
            show('teamInviteResult', `✅ Invitation créée. Copiez ce lien:<br><small>${inviteUrl}</small>`);
        }
    }

    async function resendPendingInvitation(emailEnc, roleEnc) {
        if (!getToken()) return show('teamInviteResult', 'Connectez-vous d\'abord', false);

        const email = decodeURIComponent(emailEnc || '');
        const role = decodeURIComponent(roleEnc || '');

        if (!email || !role) {
            return show('teamInviteResult', 'Invitation invalide', false);
        }

        try {
            const response = await window.apiFetchWithFallback('/api/team/invite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getToken()}`
                },
                body: JSON.stringify({ email, role })
            });

            const data = await window.readResponseDataSafe(response);
            if (!response.ok) {
                const msg = typeof data === 'string' ? data : (data?.message || 'Impossible de renvoyer l\'invitation');
                return show('teamInviteResult', `❌ ${msg}`, false);
            }

            const inviteUrl = (data?.inviteUrl || '').toString();
            const encodedInviteUrl = encodeURIComponent(inviteUrl);
            let message = `✅ Invitation renvoyée à ${email}`;

            if (inviteUrl) {
                message += `<br><small>Lien: ${inviteUrl}</small>`;
                message += `<br><button class="btn" onclick="copyTeamInviteUrl('${encodedInviteUrl}')">Copier le lien d'invitation</button>`;
            }

            show('teamInviteResult', message);
            await loadTeamData();
        } catch {
            show('teamInviteResult', '❌ Erreur de connexion', false);
        }
    }

    function initTeamInviteForm() {
        const teamForm = document.getElementById('teamInviteForm');
        if (!teamForm || teamForm.dataset.bound === '1') return;

        teamForm.dataset.bound = '1';
        teamForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!getToken()) {
                show('teamInviteResult', 'Connectez-vous d\'abord', false);
                return;
            }

            const email = document.getElementById('teamInviteEmail')?.value || '';
            const role = document.getElementById('teamInviteRole')?.value || '';

            try {
                const response = await window.apiFetchWithFallback('/api/team/invite', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${getToken()}`
                    },
                    body: JSON.stringify({ email, role })
                });

                const data = await window.readResponseDataSafe(response);
                if (response.ok) {
                    const inviteUrl = (data?.inviteUrl || '').toString();
                    const encodedInviteUrl = encodeURIComponent(inviteUrl);

                    let message = `✅ Invitation envoyée à ${email}`;
                    if (inviteUrl) {
                        message += `<br><small>Lien: ${inviteUrl}</small>`;
                        message += `<br><button class="btn" onclick="copyTeamInviteUrl('${encodedInviteUrl}')">Copier le lien d'invitation</button>`;
                    }

                    show('teamInviteResult', message);
                    teamForm.reset();
                    await loadTeamData();
                } else {
                    const msg = typeof data === 'string' ? data : (data?.message || 'Impossible d\'envoyer l\'invitation');
                    show('teamInviteResult', `❌ ${msg}`, false);
                }
            } catch {
                show('teamInviteResult', '❌ Erreur de connexion', false);
            }
        });
    }

    window.getRoleLabel = getRoleLabel;
    window.displayTeamMembers = displayTeamMembers;
    window.displayPendingInvitations = displayPendingInvitations;
    window.loadTeamData = loadTeamData;
    window.updateTeamMemberRole = updateTeamMemberRole;
    window.removeTeamMember = removeTeamMember;
    window.copyTeamInviteUrl = copyTeamInviteUrl;
    window.resendPendingInvitation = resendPendingInvitation;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTeamInviteForm);
    } else {
        initTeamInviteForm();
    }
})();
