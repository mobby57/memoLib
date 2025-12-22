class BlindModeService {
  constructor() {
    this.isActive = false;
    this.speechSynthesis = window.speechSynthesis;
    this.speechRecognition = null;
    this.currentElement = null;
    this.navigationHistory = [];
    this.shortcuts = this.initializeShortcuts();
    this.voiceCommands = this.initializeVoiceCommands();
  }

  activate() {
    this.isActive = true;
    this.setupVoiceNavigation();
    this.setupKeyboardNavigation();
    this.setupScreenReader();
    this.announceActivation();
    document.body.classList.add('blind-mode');
  }

  deactivate() {
    this.isActive = false;
    this.cleanup();
    document.body.classList.remove('blind-mode');
  }

  announceActivation() {
    this.speak("Mode aveugle activé. Utilisez les flèches pour naviguer, Entrée pour activer, Échap pour l'aide vocale.");
  }

  setupVoiceNavigation() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.speechRecognition = new SpeechRecognition();
      this.speechRecognition.lang = 'fr-FR';
      this.speechRecognition.continuous = true;
      this.speechRecognition.interimResults = false;

      this.speechRecognition.onresult = (event) => {
        const command = event.results[event.results.length - 1][0].transcript.toLowerCase();
        this.processVoiceCommand(command);
      };

      this.speechRecognition.start();
    }
  }

  setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      if (!this.isActive) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          this.navigateNext();
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.navigatePrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.navigateInto();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          this.navigateOut();
          break;
        case 'Enter':
          e.preventDefault();
          this.activateElement();
          break;
        case 'Escape':
          e.preventDefault();
          this.provideHelp();
          break;
        case ' ':
          e.preventDefault();
          this.describeElement();
          break;
      }
    });
  }

  setupScreenReader() {
    // Améliorer les attributs ARIA
    this.enhanceARIA();
    
    // Observer les changements DOM
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          this.enhanceNewElements(mutation.addedNodes);
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  enhanceARIA() {
    // Boutons
    document.querySelectorAll('button:not([aria-label])').forEach(btn => {
      const text = btn.textContent.trim() || btn.getAttribute('title') || 'Bouton';
      btn.setAttribute('aria-label', text);
    });

    // Liens
    document.querySelectorAll('a:not([aria-label])').forEach(link => {
      const text = link.textContent.trim() || link.getAttribute('href') || 'Lien';
      link.setAttribute('aria-label', text);
    });

    // Inputs
    document.querySelectorAll('input:not([aria-label])').forEach(input => {
      const label = document.querySelector(`label[for="${input.id}"]`)?.textContent ||
                   input.getAttribute('placeholder') ||
                   input.getAttribute('name') ||
                   'Champ de saisie';
      input.setAttribute('aria-label', label);
    });
  }

  navigateNext() {
    const focusableElements = this.getFocusableElements();
    const currentIndex = focusableElements.indexOf(this.currentElement);
    const nextIndex = (currentIndex + 1) % focusableElements.length;
    this.focusElement(focusableElements[nextIndex]);
  }

  navigatePrevious() {
    const focusableElements = this.getFocusableElements();
    const currentIndex = focusableElements.indexOf(this.currentElement);
    const prevIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
    this.focusElement(focusableElements[prevIndex]);
  }

  navigateInto() {
    if (this.currentElement) {
      const children = this.currentElement.querySelectorAll(this.getFocusableSelector());
      if (children.length > 0) {
        this.focusElement(children[0]);
      }
    }
  }

  navigateOut() {
    if (this.currentElement) {
      const parent = this.currentElement.closest('[tabindex], button, a, input, select, textarea');
      if (parent && parent !== this.currentElement) {
        this.focusElement(parent);
      }
    }
  }

  focusElement(element) {
    if (this.currentElement) {
      this.currentElement.classList.remove('blind-focus');
    }

    this.currentElement = element;
    element.classList.add('blind-focus');
    element.focus();
    
    this.announceElement(element);
    this.navigationHistory.push(element);
  }

  announceElement(element) {
    const description = this.getElementDescription(element);
    this.speak(description);
  }

  getElementDescription(element) {
    const tag = element.tagName.toLowerCase();
    const role = element.getAttribute('role');
    const ariaLabel = element.getAttribute('aria-label');
    const text = element.textContent.trim();
    const type = element.getAttribute('type');

    let description = '';

    // Type d'élément
    if (role) {
      description += role + ' ';
    } else {
      switch (tag) {
        case 'button':
          description += 'Bouton ';
          break;
        case 'a':
          description += 'Lien ';
          break;
        case 'input':
          description += (type === 'text' ? 'Champ de texte ' : 
                         type === 'email' ? 'Champ email ' :
                         type === 'password' ? 'Champ mot de passe ' :
                         'Champ de saisie ');
          break;
        case 'select':
          description += 'Liste déroulante ';
          break;
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          description += `Titre niveau ${tag.charAt(1)} `;
          break;
        default:
          description += 'Élément ';
      }
    }

    // Contenu
    if (ariaLabel) {
      description += ariaLabel;
    } else if (text) {
      description += text.substring(0, 100);
    }

    // État
    if (element.disabled) {
      description += ' désactivé';
    }
    if (element.checked) {
      description += ' coché';
    }
    if (element.selected) {
      description += ' sélectionné';
    }

    return description;
  }

  activateElement() {
    if (this.currentElement) {
      this.currentElement.click();
      this.speak('Élément activé');
    }
  }

  describeElement() {
    if (this.currentElement) {
      const fullDescription = this.getDetailedDescription(this.currentElement);
      this.speak(fullDescription);
    }
  }

  getDetailedDescription(element) {
    const basic = this.getElementDescription(element);
    const position = this.getElementPosition(element);
    const context = this.getElementContext(element);
    
    return `${basic}. ${position}. ${context}`;
  }

  getElementPosition(element) {
    const siblings = Array.from(element.parentElement?.children || []);
    const index = siblings.indexOf(element) + 1;
    const total = siblings.length;
    return `Élément ${index} sur ${total}`;
  }

  getElementContext(element) {
    const section = element.closest('section, article, main, nav, aside');
    if (section) {
      const heading = section.querySelector('h1, h2, h3, h4, h5, h6');
      if (heading) {
        return `Dans la section ${heading.textContent}`;
      }
    }
    return '';
  }

  getFocusableElements() {
    return Array.from(document.querySelectorAll(this.getFocusableSelector()))
      .filter(el => this.isVisible(el) && !el.disabled);
  }

  getFocusableSelector() {
    return 'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"]), [role="button"], [role="link"]';
  }

  isVisible(element) {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0';
  }

  processVoiceCommand(command) {
    const commands = this.voiceCommands;
    
    for (const [pattern, action] of Object.entries(commands)) {
      if (command.includes(pattern)) {
        action.call(this, command);
        return;
      }
    }

    this.speak("Commande non reconnue. Dites 'aide' pour la liste des commandes.");
  }

  initializeVoiceCommands() {
    return {
      'suivant': () => this.navigateNext(),
      'précédent': () => this.navigatePrevious(),
      'entrer': () => this.navigateInto(),
      'sortir': () => this.navigateOut(),
      'activer': () => this.activateElement(),
      'cliquer': () => this.activateElement(),
      'décrire': () => this.describeElement(),
      'aide': () => this.provideHelp(),
      'où suis-je': () => this.announceLocation(),
      'répéter': () => this.repeatLastAnnouncement(),
      'retour': () => this.goBack()
    };
  }

  initializeShortcuts() {
    return {
      'h': () => this.navigateToNextHeading(),
      'b': () => this.navigateToNextButton(),
      'l': () => this.navigateToNextLink(),
      'f': () => this.navigateToNextForm(),
      'r': () => this.navigateToNextRegion()
    };
  }

  navigateToNextHeading() {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    this.navigateToNextOfType(headings, 'titre');
  }

  navigateToNextButton() {
    const buttons = document.querySelectorAll('button, [role="button"]');
    this.navigateToNextOfType(buttons, 'bouton');
  }

  navigateToNextLink() {
    const links = document.querySelectorAll('a[href]');
    this.navigateToNextOfType(links, 'lien');
  }

  navigateToNextOfType(elements, type) {
    const elementsArray = Array.from(elements);
    const currentIndex = elementsArray.indexOf(this.currentElement);
    const nextElement = elementsArray[currentIndex + 1] || elementsArray[0];
    
    if (nextElement) {
      this.focusElement(nextElement);
    } else {
      this.speak(`Aucun ${type} suivant trouvé`);
    }
  }

  provideHelp() {
    const help = `
      Commandes vocales disponibles:
      - Suivant, Précédent: Navigation
      - Entrer, Sortir: Navigation hiérarchique
      - Activer, Cliquer: Activer l'élément
      - Décrire: Description détaillée
      - Où suis-je: Position actuelle
      - Aide: Cette aide
      
      Raccourcis clavier:
      - Flèches: Navigation
      - Entrée: Activer
      - Espace: Décrire
      - Échap: Aide
      - H: Titre suivant
      - B: Bouton suivant
      - L: Lien suivant
    `;
    this.speak(help);
  }

  announceLocation() {
    if (this.currentElement) {
      const location = this.getElementContext(this.currentElement);
      const description = this.getElementDescription(this.currentElement);
      this.speak(`Vous êtes sur ${description}. ${location}`);
    }
  }

  repeatLastAnnouncement() {
    if (this.lastAnnouncement) {
      this.speak(this.lastAnnouncement);
    }
  }

  goBack() {
    if (this.navigationHistory.length > 1) {
      this.navigationHistory.pop(); // Remove current
      const previous = this.navigationHistory.pop(); // Get previous
      if (previous && document.contains(previous)) {
        this.focusElement(previous);
      }
    }
  }

  speak(text) {
    this.speechSynthesis.cancel();
    this.lastAnnouncement = text;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // Sélectionner une voix française
    const voices = this.speechSynthesis.getVoices();
    const frenchVoice = voices.find(voice => voice.lang.startsWith('fr'));
    if (frenchVoice) {
      utterance.voice = frenchVoice;
    }
    
    this.speechSynthesis.speak(utterance);
  }

  cleanup() {
    if (this.speechRecognition) {
      this.speechRecognition.stop();
    }
    this.speechSynthesis.cancel();
    
    document.querySelectorAll('.blind-focus').forEach(el => {
      el.classList.remove('blind-focus');
    });
  }
}

// Hook React pour le mode aveugle
export const useBlindMode = () => {
  const [blindMode] = useState(() => new BlindModeService());
  const [isActive, setIsActive] = useState(false);

  const activate = () => {
    blindMode.activate();
    setIsActive(true);
  };

  const deactivate = () => {
    blindMode.deactivate();
    setIsActive(false);
  };

  const toggle = () => {
    if (isActive) {
      deactivate();
    } else {
      activate();
    }
  };

  useEffect(() => {
    return () => {
      if (isActive) {
        blindMode.cleanup();
      }
    };
  }, [isActive]);

  return {
    activate,
    deactivate,
    toggle,
    isActive,
    blindMode
  };
};

export default BlindModeService;