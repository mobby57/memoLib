'use client';

import { useNotifications } from '@/components/NotificationProvider';

export default function NotificationCenter() {
  const { notifications } = useNotifications();
  
  // Sécurité absolue : si le provider n'est pas prêt, on affiche un tableau vide
  const safe = notifications || {
    emails: [],
    dossiers: [],
    deadlines: [],
    system: []
  };

  const allNotifications = [
    ...((safe as any).emails || []).map(n => ({ ...n, category: 'email' })),
    ...((safe as any).dossiers || []).map(n => ({ ...n, category: 'dossier' })),
    ...((safe as any).deadlines || []).map(n => ({ ...n, category: 'deadline' })),
    ...((safe as any).system || []).map(n => ({ ...n, category: 'system' }))
  ];

  return (
    <div className="relative">
      <div className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        {allNotifications.length > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        )}
      </div>
    </div>
  );
}
