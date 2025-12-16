import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

export default function EmailStats() {
  const [stats, setStats] = useState({
    total_generated: 0,
    active_emails: 0,
    total_forwarded: 0,
    most_used_type: 'general'
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await apiService.get('/api/email-generator/stats');
      if (response.success) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Erreur stats:', error);
    }
  };

  return (
    <div className="email-stats">
      <h3>📊 Statistiques</h3>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{stats.total_generated}</div>
          <div className="stat-label">Emails générés</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.active_emails}</div>
          <div className="stat-label">Actifs</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.total_forwarded}</div>
          <div className="stat-label">Transférés</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.most_used_type}</div>
          <div className="stat-label">Type populaire</div>
        </div>
      </div>
    </div>
  );
}