// ==UserScript==
// @name         MemoLib - Advanced Components
// @version      1.0.0
// @description  Composants avancés: charts, animations, skeleton loaders
// @match        http://localhost:5078/*
// @require      https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Styles pour composants avancés
    const style = document.createElement('style');
    style.textContent = `
        /* Skeleton Loaders */
        .skeleton {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: loading 1.5s infinite;
            border-radius: 8px;
        }
        @keyframes loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }
        .skeleton-text { height: 16px; margin: 8px 0; }
        .skeleton-title { height: 24px; width: 60%; margin: 12px 0; }
        .skeleton-avatar { width: 48px; height: 48px; border-radius: 50%; }
        
        /* Progress Bars */
        .progress-bar {
            width: 100%;
            height: 8px;
            background: #e2e8f0;
            border-radius: 4px;
            overflow: hidden;
            position: relative;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea, #764ba2);
            border-radius: 4px;
            transition: width 0.3s ease;
        }
        
        /* Tooltips */
        .tooltip {
            position: absolute;
            background: #1e293b;
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            pointer-events: none;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.2s;
        }
        .tooltip.show { opacity: 1; }
        .tooltip::after {
            content: '';
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            border: 6px solid transparent;
            border-top-color: #1e293b;
        }
        
        /* Dropdowns */
        .dropdown {
            position: relative;
            display: inline-block;
        }
        .dropdown-menu {
            position: absolute;
            top: 100%;
            left: 0;
            background: white;
            border-radius: 8px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.15);
            padding: 8px 0;
            min-width: 200px;
            opacity: 0;
            transform: translateY(-10px);
            transition: all 0.3s ease;
            pointer-events: none;
        }
        .dropdown.active .dropdown-menu {
            opacity: 1;
            transform: translateY(0);
            pointer-events: all;
        }
        .dropdown-item {
            padding: 12px 16px;
            cursor: pointer;
            transition: background 0.2s;
        }
        .dropdown-item:hover {
            background: #f8fafc;
        }
        
        /* Chips/Tags */
        .chip {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            background: #e0e7ff;
            color: #4338ca;
            border-radius: 16px;
            font-size: 13px;
            font-weight: 500;
            margin: 4px;
        }
        .chip-close {
            cursor: pointer;
            opacity: 0.6;
            transition: opacity 0.2s;
        }
        .chip-close:hover { opacity: 1; }
        
        /* Accordion */
        .accordion-item {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            margin: 8px 0;
            overflow: hidden;
        }
        .accordion-header {
            padding: 16px;
            cursor: pointer;
            background: #f8fafc;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: background 0.2s;
        }
        .accordion-header:hover { background: #f1f5f9; }
        .accordion-content {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease;
            padding: 0 16px;
        }
        .accordion-item.active .accordion-content {
            max-height: 500px;
            padding: 16px;
        }
        
        /* Stats Cards */
        .stat-card {
            background: white;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            display: flex;
            align-items: center;
            gap: 16px;
        }
        .stat-icon {
            width: 56px;
            height: 56px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
        }
        .stat-value {
            font-size: 32px;
            font-weight: 700;
            color: #1e293b;
        }
        .stat-label {
            font-size: 14px;
            color: #64748b;
        }
        
        /* Timeline */
        .timeline {
            position: relative;
            padding-left: 40px;
        }
        .timeline::before {
            content: '';
            position: absolute;
            left: 12px;
            top: 0;
            bottom: 0;
            width: 2px;
            background: #e2e8f0;
        }
        .timeline-item {
            position: relative;
            padding-bottom: 24px;
        }
        .timeline-dot {
            position: absolute;
            left: -34px;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #667eea;
            border: 3px solid white;
            box-shadow: 0 0 0 2px #667eea;
        }
        
        /* Empty State */
        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #64748b;
        }
        .empty-state-icon {
            font-size: 64px;
            margin-bottom: 16px;
            opacity: 0.5;
        }
    `;
    document.head.appendChild(style);

    // Fonction: Créer skeleton loader
    window.createSkeleton = (type = 'text') => {
        const skeleton = document.createElement('div');
        skeleton.className = `skeleton skeleton-${type}`;
        return skeleton;
    };

    // Fonction: Progress bar
    window.createProgressBar = (value, max = 100) => {
        const container = document.createElement('div');
        container.className = 'progress-bar';
        const fill = document.createElement('div');
        fill.className = 'progress-fill';
        fill.style.width = `${(value / max) * 100}%`;
        container.appendChild(fill);
        return container;
    };

    // Fonction: Tooltip
    window.addTooltip = (element, text) => {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = text;
        document.body.appendChild(tooltip);
        
        element.addEventListener('mouseenter', (e) => {
            const rect = element.getBoundingClientRect();
            tooltip.style.left = rect.left + rect.width / 2 + 'px';
            tooltip.style.top = rect.top - 40 + 'px';
            tooltip.style.transform = 'translateX(-50%)';
            tooltip.classList.add('show');
        });
        
        element.addEventListener('mouseleave', () => {
            tooltip.classList.remove('show');
        });
    };

    // Fonction: Créer chart
    window.createChart = (canvasId, type, data) => {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        new Chart(canvas, {
            type: type,
            data: data,
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    };

    // Fonction: Stat card
    window.createStatCard = (icon, value, label, color) => {
        const card = document.createElement('div');
        card.className = 'stat-card';
        card.innerHTML = `
            <div class="stat-icon" style="background:${color}20;color:${color}">${icon}</div>
            <div>
                <div class="stat-value">${value}</div>
                <div class="stat-label">${label}</div>
            </div>
        `;
        return card;
    };

    // Fonction: Empty state
    window.createEmptyState = (icon, message) => {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.innerHTML = `
            <div class="empty-state-icon">${icon}</div>
            <div>${message}</div>
        `;
        return empty;
    };

    // Auto-améliorer les listes vides
    document.querySelectorAll('.event-list, .case-list').forEach(list => {
        if (list.children.length === 0) {
            list.appendChild(createEmptyState('📭', 'Aucun élément pour le moment'));
        }
    });

    // Indicateur
    const indicator = document.createElement('div');
    indicator.innerHTML = '🎨';
    indicator.title = 'Composants avancés activés';
    indicator.style.cssText = `
        position: fixed;
        bottom: 320px;
        right: 20px;
        width: 50px;
        height: 50px;
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        cursor: pointer;
        z-index: 9999;
        box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);
    `;
    document.body.appendChild(indicator);

    console.log('🎨 Composants avancés activés !');
})();
