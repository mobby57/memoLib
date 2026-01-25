// Web Vitals Reporter - Next.js Performance Monitoring
// https://nextjs.org/docs/app/api-reference/functions/use-report-web-vitals
'use client';

import { useReportWebVitals } from 'next/web-vitals';

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    // Log en développement
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Web Vitals] ${metric.name}:`, {
        value: Math.round(metric.value * 100) / 100,
        rating: metric.rating,
        id: metric.id,
      });
    }

    // Envoyer à votre service d'analytics en production
    // Exemples: Vercel Analytics, Google Analytics, custom endpoint
    if (process.env.NODE_ENV === 'production') {
      // Option 1: Vercel Analytics (automatique si déployé sur Vercel)
      
      // Option 2: Google Analytics 4
      // window.gtag?.('event', metric.name, {
      //   value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      //   event_label: metric.id,
      //   non_interaction: true,
      // });
      
      // Option 3: Custom API endpoint
      const body = JSON.stringify({
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        id: metric.id,
        navigationType: metric.navigationType,
        url: window.location.href,
        timestamp: Date.now(),
      });
      
      // Utiliser sendBeacon pour ne pas bloquer la page
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics/web-vitals', body);
      }
    }
  });

  return null;
}

// Types de métriques:
// - LCP (Largest Contentful Paint): < 2.5s = bon
// - FID (First Input Delay): < 100ms = bon  
// - CLS (Cumulative Layout Shift): < 0.1 = bon
// - FCP (First Contentful Paint): < 1.8s = bon
// - TTFB (Time to First Byte): < 800ms = bon
// - INP (Interaction to Next Paint): < 200ms = bon
