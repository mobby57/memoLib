import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Traductions
const resources = {
  fr: {
    translation: {
      // Navigation
      nav: {
        dashboard: "Tableau de bord",
        inbox: "Boîte de réception",
        send: "Envoyer",
        wizard: "Assistant",
        history: "Historique",
        templates: "Modèles",
        contacts: "Contacts",
        ai: "IA Générative",
        multimodal: "IA Multimodale",
        voice: "Transcription",
        config: "Configuration",
        accessibility: "Accessibilité",
        logout: "Déconnexion"
      },
      // Common
      common: {
        save: "Enregistrer",
        cancel: "Annuler",
        delete: "Supprimer",
        edit: "Modifier",
        close: "Fermer",
        search: "Rechercher",
        filter: "Filtrer",
        loading: "Chargement...",
        error: "Erreur",
        success: "Succès",
        confirm: "Confirmer",
        back: "Retour",
        next: "Suivant",
        finish: "Terminer",
        yes: "Oui",
        no: "Non"
      },
      // Email
      email: {
        to: "Destinataire",
        subject: "Objet",
        body: "Corps du message",
        send: "Envoyer",
        draft: "Brouillon",
        sent: "Envoyé",
        failed: "Échec",
        schedule: "Programmer l'envoi",
        scheduleDate: "Date d'envoi",
        scheduleTime: "Heure d'envoi",
        attachment: "Pièce jointe",
        recipient: "Qui est le destinataire ?",
        context: "Pourquoi envoyez-vous cet email ?",
        tone: "Quel ton souhaitez-vous ?",
        length: "Longueur souhaitée"
      },
      // Templates
      templates: {
        title: "Modèles d'emails",
        create: "Créer un modèle",
        use: "Utiliser",
        professional: "Professionnel",
        friendly: "Amical",
        formal: "Formel",
        variables: "Variables",
        fillVariables: "Remplir les variables"
      },
      // Statistics
      stats: {
        title: "Statistiques",
        totalEmails: "Total emails",
        successRate: "Taux de succès",
        uniqueRecipients: "Destinataires uniques",
        last30Days: "30 derniers jours",
        byStatus: "Par statut",
        topRecipients: "Top destinataires"
      },
      // Admin France
      admin: {
        title: "Administration française",
        prefecture: "Préfecture",
        prefecture_appointment: "Rendez-vous préfecture",
        visa: "Demande de visa",
        residence_permit: "Titre de séjour",
        work_permit: "Autorisation de travail",
        family_reunification: "Regroupement familial",
        naturalization: "Naturalisation",
        documents_required: "Documents requis",
        appointment_booking: "Prise de rendez-vous",
        status_check: "Vérifier le statut",
        help: "Aide et assistance"
      }
    }
  },
  en: {
    translation: {
      // Navigation
      nav: {
        dashboard: "Dashboard",
        inbox: "Inbox",
        send: "Send",
        wizard: "Wizard",
        history: "History",
        templates: "Templates",
        contacts: "Contacts",
        ai: "AI Generate",
        multimodal: "Multimodal AI",
        voice: "Transcription",
        config: "Settings",
        accessibility: "Accessibility",
        logout: "Logout"
      },
      // Common
      common: {
        save: "Save",
        cancel: "Cancel",
        delete: "Delete",
        edit: "Edit",
        close: "Close",
        search: "Search",
        filter: "Filter",
        loading: "Loading...",
        error: "Error",
        success: "Success",
        confirm: "Confirm",
        back: "Back",
        next: "Next",
        finish: "Finish",
        yes: "Yes",
        no: "No"
      },
      // Email
      email: {
        to: "To",
        subject: "Subject",
        body: "Body",
        send: "Send",
        draft: "Draft",
        sent: "Sent",
        failed: "Failed",
        schedule: "Schedule sending",
        scheduleDate: "Send date",
        scheduleTime: "Send time",
        attachment: "Attachment",
        recipient: "Who is the recipient?",
        context: "Why are you sending this email?",
        tone: "What tone do you want?",
        length: "Desired length"
      },
      // Templates
      templates: {
        title: "Email Templates",
        create: "Create template",
        use: "Use",
        professional: "Professional",
        friendly: "Friendly",
        formal: "Formal",
        variables: "Variables",
        fillVariables: "Fill variables"
      },
      // Statistics
      stats: {
        title: "Statistics",
        totalEmails: "Total emails",
        successRate: "Success rate",
        uniqueRecipients: "Unique recipients",
        last30Days: "Last 30 days",
        byStatus: "By status",
        topRecipients: "Top recipients"
      },
      // Admin France
      admin: {
        title: "French administration",
        prefecture: "Prefecture",
        prefecture_appointment: "Prefecture appointment",
        visa: "Visa application",
        residence_permit: "Residence permit",
        work_permit: "Work permit",
        family_reunification: "Family reunification",
        naturalization: "Naturalization",
        documents_required: "Required documents",
        appointment_booking: "Book appointment",
        status_check: "Check status",
        help: "Help and support"
      }
    }
  },
  es: {
    translation: {
      // Navigation
      nav: {
        dashboard: "Tablero",
        inbox: "Bandeja de entrada",
        send: "Enviar",
        wizard: "Asistente",
        history: "Historial",
        templates: "Plantillas",
        contacts: "Contactos",
        ai: "IA Generativa",
        multimodal: "IA Multimodal",
        voice: "Transcripción",
        config: "Configuración",
        accessibility: "Accesibilidad",
        logout: "Cerrar sesión"
      },
      // Common
      common: {
        save: "Guardar",
        cancel: "Cancelar",
        delete: "Eliminar",
        edit: "Editar",
        close: "Cerrar",
        search: "Buscar",
        filter: "Filtrar",
        loading: "Cargando...",
        error: "Error",
        success: "Éxito",
        confirm: "Confirmar",
        back: "Atrás",
        next: "Siguiente",
        finish: "Finalizar",
        yes: "Sí",
        no: "No"
      },
      // Email
      email: {
        to: "Para",
        subject: "Asunto",
        body: "Cuerpo",
        send: "Enviar",
        draft: "Borrador",
        sent: "Enviado",
        failed: "Fallido",
        schedule: "Programar envío",
        scheduleDate: "Fecha de envío",
        scheduleTime: "Hora de envío",
        attachment: "Adjunto",
        recipient: "¿Quién es el destinatario?",
        context: "¿Por qué envías este correo?",
        tone: "¿Qué tono deseas?",
        length: "Longitud deseada"
      },
      // Templates
      templates: {
        title: "Plantillas de correo",
        create: "Crear plantilla",
        use: "Usar",
        professional: "Profesional",
        friendly: "Amigable",
        formal: "Formal",
        variables: "Variables",
        fillVariables: "Rellenar variables"
      },
      // Statistics
      stats: {
        title: "Estadísticas",
        totalEmails: "Total correos",
        successRate: "Tasa de éxito",
        uniqueRecipients: "Destinatarios únicos",
        last30Days: "Últimos 30 días",
        byStatus: "Por estado",
        topRecipients: "Top destinatarios"
      },
      // Admin France
      admin: {
        title: "Administración francesa",
        prefecture: "Prefectura",
        prefecture_appointment: "Cita en prefectura",
        visa: "Solicitud de visa",
        residence_permit: "Permiso de residencia",
        work_permit: "Permiso de trabajo",
        family_reunification: "Reagrupación familiar",
        naturalization: "Naturalización",
        documents_required: "Documentos requeridos",
        appointment_booking: "Reservar cita",
        status_check: "Verificar estado",
        help: "Ayuda y soporte"
      }
    }
  },
  bm: {
    translation: {
      // Navigation (Bambara)
      nav: {
        dashboard: "Bɔlen yɔrɔ",
        inbox: "Bataki sanbɔrɔ",
        send: "Ka ci",
        wizard: "Dɛmɛbaga",
        history: "Kɔnɔkow",
        templates: "Misaliw",
        contacts: "Tɛrɛmaw",
        ai: "AI Daɲɛkɔrɔsili",
        multimodal: "AI Caman",
        voice: "Kan sɛbɛncikan",
        config: "Labɛncogo",
        accessibility: "Sɔrɔko",
        logout: "Ka bɔ"
      },
      // Common
      common: {
        save: "Ka mara",
        cancel: "Ka bàn",
        delete: "Ka bɔ",
        edit: "Ka yɛlɛma",
        close: "Ka datugu",
        search: "Ka ɲini",
        filter: "Ka filɛ",
        loading: "I bɛ don...",
        error: "Fili",
        success: "A kɛra",
        confirm: "Ka lajɛ",
        back: "Ka segin",
        next: "Nata",
        finish: "Ka ban",
        yes: "Ɔwɔ",
        no: "Ayi"
      },
      // Email
      email: {
        to: "Ma a ci",
        subject: "Kuma kunba",
        body: "Kuma",
        send: "Ka ci",
        draft: "Labɛn",
        sent: "A cirata",
        failed: "A tɛ kɛ",
        schedule: "Ka waati sugandi",
        scheduleDate: "Don tile",
        scheduleTime: "Lɛrɛ",
        attachment: "Fɛn faralen",
        recipient: "Mɔgɔ min bɛ sɔrɔ?",
        context: "Mun na i bɛ nin ci?",
        tone: "Kuma cogo jumɛn?",
        length: "Janw"
      },
      // Templates
      templates: {
        title: "Bataki misaliw",
        create: "Ka misali dilan",
        use: "Ka baara kɛ ni a ye",
        professional: "Baarakɛcogo",
        friendly: "Teriw ka cogo",
        formal: "Jɛkulu",
        variables: "Fɛn yɛlɛmanen",
        fillVariables: "Ka fɛnw fa"
      },
      // Statistics
      stats: {
        title: "Jatebɔw",
        totalEmails: "Bataki bɛɛ",
        successRate: "Ɲɛtaa hakɛ",
        uniqueRecipients: "Mɔgɔw kɛrɛnkɛrɛnnin",
        last30Days: "Tile 30 tɛmɛnenw",
        byStatus: "Ka kɔrɔ cogoya ma",
        topRecipients: "Mɔgɔ minw ka ca"
      },
      // Admin France
      admin: {
        title: "Faransi jamana baarakɛcogo",
        prefecture: "Prefɛkitiiri",
        prefecture_appointment: "Prefɛkitiiri lajɛrencogo",
        visa: "Visa ɲinili",
        residence_permit: "Sigiyɔrɔ sɛbɛn",
        work_permit: "Baara kɛcogo sɛbɛn",
        family_reunification: "Somɔgɔw lajɛ",
        naturalization: "Jamana denmisɛnw sɔrɔli",
        documents_required: "Sɛbɛnw minw ka kan",
        appointment_booking: "Ka lajɛrencogo ta",
        status_check: "Ka cogoya lajɛ",
        help: "Dɛmɛ ani kɔlɔsili"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'fr',
    lng: localStorage.getItem('i18nextLng') || 'fr',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;
