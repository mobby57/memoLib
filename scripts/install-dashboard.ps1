#!/usr/bin/env pwsh

Write-Host "📊 INSTALLATION DASHBOARD TEMPS RÉEL" -ForegroundColor Cyan

# 1. Créer le contrôleur Dashboard avancé
$dashboardController = @'
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;

namespace MemoLib.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly MemoLibDbContext _context;

    public DashboardController(MemoLibDbContext context)
    {
        _context = context;
    }

    [HttpGet("realtime")]
    public async Task<IActionResult> GetRealtimeStats()
    {
        var stats = new
        {
            TotalCases = await _context.Cases.CountAsync(),
            TotalClients = await _context.Clients.CountAsync(),
            TotalEvents = await _context.Events.CountAsync(),
            OpenAnomalies = await _context.Events.CountAsync(e => e.RequiresAttention),
            TodayEvents = await _context.Events.CountAsync(e => e.OccurredAt.Date == DateTime.Today),
            LastUpdate = DateTime.UtcNow
        };

        return Ok(stats);
    }

    [HttpGet("charts")]
    public async Task<IActionResult> GetChartData()
    {
        var last7Days = Enumerable.Range(0, 7)
            .Select(i => DateTime.Today.AddDays(-i))
            .Reverse()
            .ToList();

        var dailyStats = new List<object>();
        
        foreach (var day in last7Days)
        {
            var dayEvents = await _context.Events
                .CountAsync(e => e.OccurredAt.Date == day);
                
            dailyStats.Add(new
            {
                Date = day.ToString("yyyy-MM-dd"),
                Events = dayEvents
            });
        }

        return Ok(new { DailyEvents = dailyStats });
    }
}
'@

$dashboardPath = "../Controllers/DashboardController.cs"
Set-Content -Path $dashboardPath -Value $dashboardController -Encoding UTF8

# 2. Créer la page dashboard avancée
$dashboardHtml = @'
<!DOCTYPE html>
<html>
<head>
    <title>MemoLib - Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; background: #f5f5f5; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .stat-number { font-size: 2.5em; font-weight: bold; color: #667eea; }
        .stat-label { color: #666; margin-top: 5px; }
        .chart-container { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .realtime { position: fixed; top: 20px; right: 20px; background: #28a745; color: white; padding: 10px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Dashboard MemoLib</h1>
        <p>Tableau de bord temps réel</p>
    </div>

    <div class="realtime" id="realtime">🔴 Temps réel</div>

    <div class="container">
        <div class="stats-grid" id="statsGrid">
            <!-- Stats dynamiques -->
        </div>

        <div class="chart-container">
            <h3>Activité des 7 derniers jours</h3>
            <canvas id="activityChart" width="400" height="200"></canvas>
        </div>
    </div>

    <script>
        const API_URL = 'http://localhost:5078';
        let token = localStorage.getItem('memolib_token');

        async function fetchStats() {
            try {
                const response = await fetch(`${API_URL}/api/dashboard/realtime`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (!response.ok) return;
                
                const stats = await response.json();
                updateStatsGrid(stats);
                
                document.getElementById('realtime').style.background = '#28a745';
                document.getElementById('realtime').textContent = '🟢 En ligne';
            } catch (error) {
                document.getElementById('realtime').style.background = '#dc3545';
                document.getElementById('realtime').textContent = '🔴 Hors ligne';
            }
        }

        function updateStatsGrid(stats) {
            const grid = document.getElementById('statsGrid');
            grid.innerHTML = `
                <div class="stat-card">
                    <div class="stat-number">${stats.totalCases}</div>
                    <div class="stat-label">Dossiers</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.totalClients}</div>
                    <div class="stat-label">Clients</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.totalEvents}</div>
                    <div class="stat-label">Emails</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.openAnomalies}</div>
                    <div class="stat-label">Anomalies</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.todayEvents}</div>
                    <div class="stat-label">Aujourd'hui</div>
                </div>
            `;
        }

        async function loadChart() {
            try {
                const response = await fetch(`${API_URL}/api/dashboard/charts`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                const data = await response.json();
                
                const ctx = document.getElementById('activityChart').getContext('2d');
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: data.dailyEvents.map(d => d.date),
                        datasets: [{
                            label: 'Emails reçus',
                            data: data.dailyEvents.map(d => d.events),
                            borderColor: '#667eea',
                            backgroundColor: 'rgba(102, 126, 234, 0.1)',
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: { beginAtZero: true }
                        }
                    }
                });
            } catch (error) {
                console.error('Erreur chargement graphique:', error);
            }
        }

        // Actualisation temps réel
        fetchStats();
        loadChart();
        setInterval(fetchStats, 5000); // Toutes les 5 secondes
    </script>
</body>
</html>
'@

$htmlPath = "../wwwroot/dashboard.html"
Set-Content -Path $htmlPath -Value $dashboardHtml -Encoding UTF8

Write-Host "✅ Dashboard temps réel installé!" -ForegroundColor Green
Write-Host "🌐 Accès: http://localhost:5078/dashboard.html" -ForegroundColor Cyan