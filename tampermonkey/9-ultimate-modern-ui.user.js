// ==UserScript==
// @name         MemoLib - Ultimate Modern UI
// @version      2.0.0
// @description  Interface ultra-moderne avec tous les effets visuels
// @match        http://localhost:5078/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const style = document.createElement('style');
    style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; }
        
        body {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%) !important;
            position: relative;
            overflow-x: hidden;
        }
        body::before {
            content: '';
            position: fixed;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: rotate 30s linear infinite;
            pointer-events: none;
            z-index: 0;
        }
        @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        .container, .main-content, #app {
            position: relative;
            z-index: 1;
        }
        
        h1, h2, h3, h4, h5, h6 {
            background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
            -webkit-background-clip: text !important;
            -webkit-text-fill-color: transparent !important;
            background-clip: text !important;
            font-weight: 700 !important;
        }
        
        button, .btn, input[type="submit"] {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
            color: white !important;
            border: none !important;
            padding: 16px 32px !important;
            border-radius: 12px !important;
            font-weight: 600 !important;
            cursor: pointer !important;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4) !important;
            position: relative !important;
            overflow: hidden !important;
        }
        button::before, .btn::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: rgba(255,255,255,0.3);
            transform: translate(-50%, -50%);
            transition: width 0.6s, height 0.6s;
        }
        button:hover::before, .btn:hover::before {
            width: 300px;
            height: 300px;
        }
        button:hover, .btn:hover {
            transform: translateY(-3px) !important;
            box-shadow: 0 12px 32px rgba(99, 102, 241, 0.6) !important;
        }
        
        .card, .event-item, .case-item, .client-item, .panel, .box {
            background: rgba(255, 255, 255, 0.95) !important;
            backdrop-filter: blur(10px) !important;
            border-radius: 20px !important;
            padding: 24px !important;
            box-shadow: 0 20px 60px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1) !important;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
            border: none !important;
            margin: 16px 0 !important;
        }
        .card::before, .event-item::before, .case-item::before {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 20px;
            padding: 2px;
            background: linear-gradient(135deg, #6366f1, #8b5cf6, #d946ef);
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            opacity: 0;
            transition: opacity 0.4s;
        }
        .card:hover, .event-item:hover, .case-item:hover {
            transform: translateY(-12px) scale(1.02) !important;
            box-shadow: 0 30px 80px rgba(0,0,0,0.25) !important;
        }
        .card:hover::before, .event-item:hover::before, .case-item:hover::before {
            opacity: 1;
        }
        
        input, textarea, select {
            border: 2px solid rgba(99, 102, 241, 0.2) !important;
            border-radius: 12px !important;
            padding: 14px 18px !important;
            font-size: 14px !important;
            transition: all 0.3s ease !important;
            background: white !important;
        }
        input:focus, textarea:focus, select:focus {
            outline: none !important;
            border-color: #6366f1 !important;
            box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1) !important;
        }
        
        .badge, .tag, .label {
            display: inline-block !important;
            padding: 8px 16px !important;
            border-radius: 20px !important;
            font-size: 13px !important;
            font-weight: 600 !important;
            margin: 4px !important;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
            transition: all 0.3s ease !important;
        }
        .badge:hover, .tag:hover {
            transform: translateY(-2px) !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
        }
        
        .status-open, .badge-primary {
            background: linear-gradient(135deg, #ddd6fe, #e0e7ff) !important;
            color: #5b21b6 !important;
            border: 1px solid #c4b5fd !important;
        }
        .status-in-progress, .badge-warning {
            background: linear-gradient(135deg, #fef3c7, #fde68a) !important;
            color: #92400e !important;
            border: 1px solid #fcd34d !important;
        }
        .status-closed, .badge-success {
            background: linear-gradient(135deg, #d1fae5, #a7f3d0) !important;
            color: #065f46 !important;
            border: 1px solid #6ee7b7 !important;
        }
        .badge-danger {
            background: linear-gradient(135deg, #fee2e2, #fecaca) !important;
            color: #991b1b !important;
            border: 1px solid #fca5a5 !important;
        }
        
        table {
            background: rgba(255, 255, 255, 0.95) !important;
            backdrop-filter: blur(10px) !important;
            border-radius: 16px !important;
            overflow: hidden !important;
            box-shadow: 0 10px 40px rgba(0,0,0,0.15) !important;
        }
        th {
            background: linear-gradient(135deg, #f8fafc, #f1f5f9) !important;
            font-weight: 600 !important;
            color: #475569 !important;
            padding: 16px !important;
        }
        td {
            padding: 16px !important;
            border-bottom: 1px solid #f1f5f9 !important;
        }
        tr:hover td {
            background: rgba(99, 102, 241, 0.05) !important;
        }
        
        .tab-button {
            background: transparent !important;
            color: rgba(255,255,255,0.7) !important;
            border: none !important;
            border-bottom: 3px solid transparent !important;
            padding: 12px 24px !important;
            font-weight: 600 !important;
            cursor: pointer !important;
            transition: all 0.3s ease !important;
            box-shadow: none !important;
        }
        .tab-button:hover {
            color: white !important;
            transform: none !important;
        }
        .tab-button.active {
            color: white !important;
            border-bottom-color: white !important;
            background: rgba(255,255,255,0.1) !important;
        }
        
        .notification, .toast, .alert {
            background: rgba(255, 255, 255, 0.95) !important;
            backdrop-filter: blur(10px) !important;
            border-radius: 16px !important;
            box-shadow: 0 20px 60px rgba(0,0,0,0.2) !important;
            border-left: 4px solid #6366f1 !important;
            animation: slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        ::-webkit-scrollbar {
            width: 10px;
            height: 10px;
        }
        ::-webkit-scrollbar-track {
            background: rgba(255,255,255,0.1);
            border-radius: 5px;
        }
        ::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            border-radius: 5px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(135deg, #8b5cf6, #d946ef);
        }
        
        .modal, .dialog {
            background: rgba(0,0,0,0.6) !important;
            backdrop-filter: blur(8px) !important;
        }
        .modal-content, .dialog-content {
            background: rgba(255, 255, 255, 0.95) !important;
            backdrop-filter: blur(10px) !important;
            border-radius: 24px !important;
            box-shadow: 0 30px 90px rgba(0,0,0,0.3) !important;
        }
        
        .progress-bar {
            background: rgba(255,255,255,0.2) !important;
            border-radius: 10px !important;
            overflow: hidden !important;
        }
        .progress-fill {
            background: linear-gradient(90deg, #6366f1, #8b5cf6, #d946ef) !important;
            box-shadow: 0 0 20px rgba(99, 102, 241, 0.5) !important;
            position: relative !important;
        }
        .progress-fill::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            animation: shimmer 2s infinite;
        }
        @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
    `;
    document.head.appendChild(style);

    // Indicateur
    const indicator = document.createElement('div');
    indicator.innerHTML = '🎨';
    indicator.title = 'Ultimate Modern UI Activé';
    indicator.style.cssText = `
        position: fixed;
        bottom: 380px;
        right: 20px;
        width: 56px;
        height: 56px;
        background: linear-gradient(135deg, #6366f1, #8b5cf6, #d946ef);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        cursor: pointer;
        z-index: 10000;
        box-shadow: 0 8px 32px rgba(99, 102, 241, 0.5);
        animation: float 3s ease-in-out infinite;
    `;
    
    const floatStyle = document.createElement('style');
    floatStyle.textContent = `
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
    `;
    document.head.appendChild(floatStyle);
    
    document.body.appendChild(indicator);

    console.log('🎨 Ultimate Modern UI Activé !');
})();
