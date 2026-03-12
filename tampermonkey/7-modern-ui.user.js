// ==UserScript==
// @name         MemoLib - Modern UI
// @version      1.0.0
// @description  Interface moderne avec composants de qualité
// @match        http://localhost:5078/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Injecter styles modernes
    const style = document.createElement('style');
    style.textContent = `
        /* Reset & Base */
        * { box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
        
        /* Buttons modernes */
        button, .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }
        button:hover, .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
        }
        
        /* Cards modernes */
        .card, .event-item, .case-item {
            background: white;
            border-radius: 12px;
            padding: 20px;
            margin: 12px 0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            border: 1px solid rgba(0,0,0,0.05);
            transition: all 0.3s ease;
        }
        .card:hover, .event-item:hover, .case-item:hover {
            box-shadow: 0 8px 24px rgba(0,0,0,0.12);
            transform: translateY(-4px);
        }
        
        /* Inputs modernes */
        input, textarea, select {
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px 16px;
            font-size: 14px;
            transition: all 0.3s ease;
            width: 100%;
        }
        input:focus, textarea:focus, select:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        /* Tabs modernes */
        .tab-button {
            background: transparent;
            color: #64748b;
            border: none;
            border-bottom: 3px solid transparent;
            padding: 12px 24px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .tab-button.active {
            color: #667eea;
            border-bottom-color: #667eea;
        }
        
        /* Badges modernes */
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            background: #e0e7ff;
            color: #4338ca;
        }
        
        /* Notifications modernes */
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.15);
            border-left: 4px solid #667eea;
            animation: slideIn 0.3s ease;
            z-index: 10000;
        }
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        /* Tables modernes */
        table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        th {
            background: #f8fafc;
            padding: 16px;
            text-align: left;
            font-weight: 600;
            color: #475569;
            border-bottom: 2px solid #e2e8f0;
        }
        td {
            padding: 16px;
            border-bottom: 1px solid #f1f5f9;
        }
        tr:hover td {
            background: #f8fafc;
        }
        
        /* Modals modernes */
        .modal {
            background: rgba(0,0,0,0.5);
            backdrop-filter: blur(4px);
        }
        .modal-content {
            background: white;
            border-radius: 16px;
            padding: 32px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        
        /* Loading spinner moderne */
        .spinner {
            border: 3px solid #f3f4f6;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        /* Scrollbar moderne */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        ::-webkit-scrollbar-track {
            background: #f1f5f9;
        }
        ::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
        }
        
        /* Container moderne */
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 24px;
        }
        
        /* Grid moderne */
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 24px;
        }
        
        /* Status badges */
        .status-open { background: #dbeafe; color: #1e40af; }
        .status-in-progress { background: #fef3c7; color: #92400e; }
        .status-closed { background: #d1fae5; color: #065f46; }
        
        /* Priority badges */
        .priority-high { background: #fee2e2; color: #991b1b; }
        .priority-medium { background: #fef3c7; color: #92400e; }
        .priority-low { background: #e0e7ff; color: #3730a3; }
    `;
    document.head.appendChild(style);

    // Améliorer les boutons existants
    document.querySelectorAll('button').forEach(btn => {
        if (!btn.classList.contains('modernized')) {
            btn.classList.add('modernized');
        }
    });

    // Ajouter des icônes aux boutons
    const buttonIcons = {
        'login': '🔐',
        'register': '📝',
        'send': '📧',
        'save': '💾',
        'delete': '🗑️',
        'search': '🔍',
        'filter': '🔽',
        'export': '📥',
        'import': '📤'
    };

    document.querySelectorAll('button').forEach(btn => {
        const text = btn.textContent.toLowerCase();
        for (const [key, icon] of Object.entries(buttonIcons)) {
            if (text.includes(key) && !btn.textContent.includes(icon)) {
                btn.textContent = `${icon} ${btn.textContent}`;
                break;
            }
        }
    });

    // Améliorer les inputs avec labels flottants
    document.querySelectorAll('input, textarea').forEach(input => {
        if (input.placeholder && !input.previousElementSibling?.classList.contains('floating-label')) {
            const wrapper = document.createElement('div');
            wrapper.style.cssText = 'position:relative;margin:16px 0';
            
            const label = document.createElement('label');
            label.textContent = input.placeholder;
            label.className = 'floating-label';
            label.style.cssText = 'position:absolute;left:16px;top:12px;color:#94a3b8;font-size:14px;pointer-events:none;transition:all 0.3s ease';
            
            input.parentNode.insertBefore(wrapper, input);
            wrapper.appendChild(label);
            wrapper.appendChild(input);
            
            input.addEventListener('focus', () => {
                label.style.top = '-8px';
                label.style.fontSize = '12px';
                label.style.color = '#667eea';
                label.style.background = 'white';
                label.style.padding = '0 4px';
            });
            
            input.addEventListener('blur', () => {
                if (!input.value) {
                    label.style.top = '12px';
                    label.style.fontSize = '14px';
                    label.style.color = '#94a3b8';
                }
            });
        }
    });

    // Toast notification moderne
    window.showModernToast = (message, type = 'info') => {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#667eea'
        };
        
        const toast = document.createElement('div');
        toast.className = 'notification';
        toast.style.borderLeftColor = colors[type];
        toast.innerHTML = `
            <div style="display:flex;align-items:center;gap:12px">
                <div style="font-size:24px">${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}</div>
                <div style="flex:1">${message}</div>
            </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    };

    // Indicateur UI moderne
    const indicator = document.createElement('div');
    indicator.innerHTML = '✨';
    indicator.title = 'Interface moderne activée';
    indicator.style.cssText = `
        position: fixed;
        bottom: 260px;
        right: 20px;
        width: 50px;
        height: 50px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        cursor: pointer;
        z-index: 9999;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        animation: pulse 2s infinite;
    `;
    
    const pulseStyle = document.createElement('style');
    pulseStyle.textContent = `
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
    `;
    document.head.appendChild(pulseStyle);
    
    indicator.onclick = () => showModernToast('Interface moderne activée ! 🎨', 'success');
    document.body.appendChild(indicator);

    console.log('✨ Interface moderne activée !');
})();
