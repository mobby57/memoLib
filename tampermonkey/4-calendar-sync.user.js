// ==UserScript==
// @name         MemoLib - Calendar Sync
// @version      1.0.0
// @description  Synchronise événements MemoLib avec Google Calendar
// @match        http://localhost:5078/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    const API = 'http://localhost:5078';
    
    const btn = document.createElement('button');
    btn.textContent = '📅 Sync Calendar';
    btn.style.cssText = 'position:fixed;bottom:80px;right:20px;padding:12px 20px;background:#34a853;color:white;border:none;border-radius:8px;cursor:pointer;z-index:9999;box-shadow:0 2px 8px rgba(0,0,0,0.2)';
    btn.onclick = async () => {
        const token = localStorage.getItem('memolib_token');
        if (!token) return alert('❌ Non connecté');
        
        try {
            const res = await fetch(`${API}/api/calendar`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const events = await res.json();
            
            alert(`✅ ${events.length} événements prêts à synchroniser\n\nOuvrez Google Calendar et importez le fichier .ics`);
        } catch (e) {
            alert('❌ Erreur: ' + e.message);
        }
    };
    document.body.appendChild(btn);
})();
