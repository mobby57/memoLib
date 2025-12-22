import { useEffect, useRef } from 'react';

export const useAutoSave = (data, key, delay = 2000) => {
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (data && (data.subject || data.body || data.context)) {
        localStorage.setItem(`draft_${key}`, JSON.stringify({
          ...data,
          savedAt: new Date().toISOString()
        }));
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, key, delay]);

  const loadDraft = () => {
    const saved = localStorage.getItem(`draft_${key}`);
    return saved ? JSON.parse(saved) : null;
  };

  const clearDraft = () => {
    localStorage.removeItem(`draft_${key}`);
  };

  return { loadDraft, clearDraft };
};