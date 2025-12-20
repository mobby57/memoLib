// ==UserScript==
// @name         IAPosteManager - Performance Monitor
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Moniteur de performance pour IAPosteManager
// @author       You
// @match        https://iapostemanager.onrender.com/*
// @match        http://localhost:5000/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    let performanceData = [];
    let startTime = performance.now();
    
    function measurePageLoad() {
        window.addEventListener('load', () => {
            const loadTime = performance.now() - startTime;
            logPerformance('Page Load', loadTime);
        });
    }
    
    function measureAPIRequests() {
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            const [url] = args;
            const requestStart = performance.now();
            
            return originalFetch.apply(this, args).then(response => {
                const requestTime = performance.now() - requestStart;
                logPerformance(`API: ${url}`, requestTime);
                return response;
            });
        };
    }
    
    function logPerformance(action, time) {
        const entry = {
            action,
            time: Math.round(time),
            timestamp: new Date().toISOString()
        };
        
        performanceData.push(entry);
        updatePerformanceDisplay();
        
        // Garder seulement les 50 dernières mesures
        if (performanceData.length > 50) {
            performanceData = performanceData.slice(-50);
        }
    }
    
    function createPerformancePanel() {
        const panel = document.createElement('div');
        panel.id = 'performance-panel';
        panel.style.cssText = `
            position: fixed; top: 60px; left: 10px; z-index: 9999;
            background: rgba(0,0,0,0.8); color: #00ff00; padding: 10px;
            border-radius: 5px; font-family: monospace; font-size: 12px;
            width: 300px; max-height: 200px; overflow-y: auto;
            display: none;
        `;
        
        panel.innerHTML = `
            <div style="color: #fff; font-weight: bold; margin-bottom: 5px;">
                ⚡ Performance Monitor
                <span style="float: right; cursor: pointer;" onclick="this.parentElement.parentElement.style.display='none'">×</span>
            </div>
            <div id="performance-content"></div>
        `;
        
        document.body.appendChild(panel);
    }
    
    function updatePerformanceDisplay() {
        const content = document.getElementById('performance-content');
        if (!content) return;
        
        const recent = performanceData.slice(-10);
        const avgTime = recent.length > 0 ? 
            Math.round(recent.reduce((sum, entry) => sum + entry.time, 0) / recent.length) : 0;
        
        content.innerHTML = `
            <div style="color: #ffff00;">Moyenne: ${avgTime}ms</div>
            ${recent.reverse().map(entry => `
                <div style="color: ${entry.time > 1000 ? '#ff0000' : entry.time > 500 ? '#ffaa00' : '#00ff00'};">
                    ${entry.action}: ${entry.time}ms
                </div>
            `).join('')}
        `;
    }
    
    function addPerformanceToggle() {
        const button = document.createElement('button');
        button.innerHTML = '⚡';
        button.style.cssText = `
            position: fixed; top: 60px; left: 10px; z-index: 9999;
            background: #333; color: #00ff00; border: none;
            border-radius: 3px; width: 30px; height: 30px;
            cursor: pointer; font-size: 16px;
        `;
        button.onclick = () => {
            const panel = document.getElementById('performance-panel');
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        };
        document.body.appendChild(button);
    }
    
    function monitorMemoryUsage() {
        if (performance.memory) {
            setInterval(() => {
                const memory = performance.memory;
                const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
                const totalMB = Math.round(memory.totalJSHeapSize / 1048576);
                
                if (usedMB > 100) { // Alert si plus de 100MB
                    console.warn(`⚠️ Mémoire élevée: ${usedMB}MB/${totalMB}MB`);
                }
            }, 30000);
        }
    }
    
    function detectSlowOperations() {
        // Observer les mutations DOM lentes
        const observer = new MutationObserver((mutations) => {
            const mutationStart = performance.now();
            // Laisser le navigateur traiter les mutations
            setTimeout(() => {
                const mutationTime = performance.now() - mutationStart;
                if (mutationTime > 100) {
                    logPerformance('DOM Mutation', mutationTime);
                }
            }, 0);
        });
        
        observer.observe(document.body, { 
            childList: true, 
            subtree: true, 
            attributes: true 
        });
    }
    
    // Initialiser le monitoring
    measurePageLoad();
    measureAPIRequests();
    monitorMemoryUsage();
    detectSlowOperations();
    
    setTimeout(() => {
        createPerformancePanel();
        addPerformanceToggle();
    }, 1000);
    
    console.log('🚀 Performance Monitor activé');
})();