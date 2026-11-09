'use client';

import { useEffect, useState } from 'react';

export function SidebarLayoutAdjuster() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    // ecouter les changements du localStorage
    const handleStorageChange = () => {
      const collapsed = localStorage.getItem('sidebarCollapsed') === 'true';
      setSidebarCollapsed(collapsed);
      
      // Mettre a jour le padding du main
      const main = document.querySelector('main');
      if (main && window.innerWidth >= 1024) {
        main.style.paddingLeft = collapsed ? '5rem' : '16rem';
      }
    };

    // Initial load
    handleStorageChange();

    // ecouter les changements
    window.addEventListener('storage', handleStorageChange);
    
    // Custom event pour les changements locaux
    const customEventHandler = () => handleStorageChange();
    window.addEventListener('sidebarToggle', customEventHandler);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sidebarToggle', customEventHandler);
    };
  }, []);

  return null;
}
