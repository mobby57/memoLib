const getOrCreateAnnouncer = (priority = 'polite') => {
  const announcerId = priority === 'assertive' ? 'sr-announcer-assertive' : 'sr-announcer-polite';
  let announcement = document.getElementById(announcerId);

  if (!announcement) {
    announcement = document.createElement('div');
    announcement.id = announcerId;
    announcement.setAttribute('role', priority === 'assertive' ? 'alert' : 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;';
    document.body.appendChild(announcement);
  }

  return announcement;
};

export const enhanceAccessibility = () => {
  if (document.body.dataset.a11yEnhanced === 'true') {
    return;
  }

  document.querySelectorAll('button:not([aria-label])').forEach(btn => {
    const text = btn.textContent.trim();
    if (text) btn.setAttribute('aria-label', text);
  });

  document.querySelectorAll('[onclick]:not([role])').forEach(el => {
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.querySelector('.modal[style*="display: block"]');
      if (modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
        announceToScreenReader('Modal fermée');
      }
    }
  });

  if (!document.querySelector('a.skip-link[href="#main-content"]')) {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Aller au contenu principal';
    skipLink.className = 'skip-link';
    skipLink.style.cssText = 'position:absolute;left:-9999px;z-index:999;';
    skipLink.addEventListener('focus', () => {
      skipLink.style.left = '0';
    });
    skipLink.addEventListener('blur', () => {
      skipLink.style.left = '-9999px';
    });
    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  document.body.dataset.a11yEnhanced = 'true';
};

export const trapFocus = (modalElement) => {
  if (!modalElement) {
    return () => {};
  }

  const focusable = modalElement.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  if (!focusable.length) {
    return () => {};
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  const onKeyDown = (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  modalElement.addEventListener('keydown', onKeyDown);
  first.focus();

  return () => {
    modalElement.removeEventListener('keydown', onKeyDown);
  };
};

export const announceToScreenReader = (message, priority = 'polite') => {
  if (!message) {
    return;
  }

  const announcement = getOrCreateAnnouncer(priority);
  announcement.textContent = '';
  requestAnimationFrame(() => {
    announcement.textContent = message;
  });
};

export const setLoadingState = (element, isLoading) => {
  if (isLoading) {
    element.setAttribute('aria-busy', 'true');
    element.setAttribute('disabled', 'true');
    announceToScreenReader('Chargement en cours...');
  } else {
    element.removeAttribute('aria-busy');
    element.removeAttribute('disabled');
    announceToScreenReader('Chargement terminé');
  }
};

export const addKeyboardNavigation = (element, onActivate) => {
  element.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onActivate(e);
    }
  });
};
