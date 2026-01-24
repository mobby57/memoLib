/**
 * 🎨 Figma Code Connect - Dashboard Analytics
 * 
 * Composant: IA Poste Manager > Dashboards > AnalyticsDashboard
 * Synchronisation des widgets d'analytics
 */

import { CodeConnect } from '@figma/code-connect';
import AnalyticsDashboard from '@/app/lawyer/dashboard/page';

CodeConnect.figma(
  'https://www.figma.com/design/YOUR_FILE_ID/IA-Poste-Manager?node-id=DASHBOARD_ID',
  AnalyticsDashboard,
  {
    stats: figma.nestedProps('Statistics', {
      totalCases: figma.number('Total Cases'),
      urgentCases: figma.number('Urgent Count'),
      successRate: figma.number('Success Rate %'),
      averageTime: figma.number('Avg Time (days)')
    }),
    
    filters: figma.nestedProps('Filters', {
      period: figma.enum('Time Period', {
        'week': 'week',
        'month': 'month',
        'quarter': 'quarter',
        'year': 'year'
      }),
      caseType: figma.enum('Filter by Type', {
        'OQTF': 'OQTF',
        'NATURALISATION': 'NATURALISATION',
        'ALL': 'ALL'
      }),
      status: figma.enum('Filter by Status', {
        'active': 'active',
        'completed': 'completed',
        'all': 'all'
      })
    }),
    
    // Chart controls
    chartType: figma.enum('Chart Type', {
      'line': 'line',
      'bar': 'bar',
      'pie': 'pie',
      'area': 'area'
    }),
    
    showTrends: figma.boolean('Show Trends'),
    exportEnabled: figma.boolean('Enable Export'),
    
    onExport: figma.action('On Export')
  }
);

/**
 * **Dashboard d'analytics pour avocats**
 * 
 * Affiche KPIs en temps reel:
 * - Dossiers actifs / termines
 * - Taux de succes par type
 * - Delais moyens de traitement
 * - Previsions (ML)
 * 
 * ### Sections
 * 1. **Overview Cards** - KPIs principaux
 * 2. **Trends Chart** - evolution sur periode
 * 3. **Case Distribution** - Pie chart par type
 * 4. **Performance Metrics** - Tableau detaille
 * 
 * ### Capacites
 *  Filtres par periode/type/statut
 *  Export CSV/PDF
 *  Actualisation temps reel
 *  Drill-down sur chaque metrique
 */
