import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Globe, 
  Check,
  FileText,
  Calendar,
  MapPin,
  Users,
  AlertCircle,
  ExternalLink,
  Phone,
  Mail,
  Clock,
  CheckCircle2
} from 'lucide-react';

export default function FrenchAdmin() {
  const { t, i18n } = useTranslation();
  const [activeCategory, setActiveCategory] = useState('prefecture');

  const categories = [
    {
      id: 'prefecture',
      icon: MapPin,
      color: 'blue'
    },
    {
      id: 'visa',
      icon: FileText,
      color: 'purple'
    },
    {
      id: 'residence_permit',
      icon: FileText,
      color: 'green'
    },
    {
      id: 'work_permit',
      icon: Users,
      color: 'orange'
    },
    {
      id: 'family_reunification',
      icon: Users,
      color: 'pink'
    },
    {
      id: 'naturalization',
      icon: FileText,
      color: 'indigo'
    }
  ];

  const adminResources = {
    prefecture: {
      description: {
        fr: "Gérez vos rendez-vous et démarches en préfecture",
        en: "Manage your prefecture appointments and procedures",
        es: "Gestiona tus citas y trámites en la prefectura",
        bm: "I ka prefɛkitiiri lajɛrencogo ni baaraw ɲɛmɔgɔya"
      },
      links: [
        { 
          name: { fr: "Prendre RDV en ligne", en: "Book appointment online", es: "Reservar cita online", bm: "Ka lajɛrencogo ta Internɛti kan" },
          url: "https://www.interieur.gouv.fr/Administration-de-l-Etat/Prefectures"
        },
        {
          name: { fr: "Trouver ma préfecture", en: "Find my prefecture", es: "Encontrar mi prefectura", bm: "Ka n ka prefɛkitiiri sɔrɔ" },
          url: "https://lannuaire.service-public.fr/navigation/prefecture"
        }
      ],
      documents: {
        fr: [
          "Passeport en cours de validité",
          "Justificatif de domicile (- 3 mois)",
          "Photos d'identité récentes",
          "Formulaire de demande complété"
        ],
        en: [
          "Valid passport",
          "Proof of address (< 3 months)",
          "Recent ID photos",
          "Completed application form"
        ],
        es: [
          "Pasaporte válido",
          "Justificante de domicilio (< 3 meses)",
          "Fotos de identidad recientes",
          "Formulario de solicitud completado"
        ],
        bm: [
          "Pasipɔri min bɛ se ka kɛ",
          "Sigiyɔrɔ jateminɛw (kalo 3 tɛmɛnenw)",
          "Foto koraw",
          "Ɲininkali sɛbɛn dafalen"
        ]
      }
    },
    visa: {
      description: {
        fr: "Demande de visa pour la France",
        en: "French visa application",
        es: "Solicitud de visa para Francia",
        bm: "Faransi visa ɲinili"
      },
      links: [
        {
          name: { fr: "France-Visas", en: "France-Visas", es: "France-Visas", bm: "France-Visas" },
          url: "https://france-visas.gouv.fr/"
        },
        {
          name: { fr: "Prendre RDV VFS Global", en: "Book VFS Global appointment", es: "Reservar cita VFS Global", bm: "VFS Global lajɛrencogo" },
          url: "https://www.vfsglobal.com/france/"
        }
      ],
      documents: {
        fr: [
          "Formulaire Cerfa complété et signé",
          "2 photos d'identité",
          "Passeport + photocopies",
          "Justificatif d'hébergement",
          "Assurance voyage",
          "Justificatifs de ressources financières"
        ],
        en: [
          "Completed and signed Cerfa form",
          "2 ID photos",
          "Passport + photocopies",
          "Proof of accommodation",
          "Travel insurance",
          "Proof of financial resources"
        ],
        es: [
          "Formulario Cerfa completado y firmado",
          "2 fotos de identidad",
          "Pasaporte + fotocopias",
          "Justificante de alojamiento",
          "Seguro de viaje",
          "Justificantes de recursos financieros"
        ],
        bm: [
          "Cerfa sɛbɛn dafalen ani tɔgɔsɛbɛnnen",
          "Foto 2",
          "Pasipɔri + kopi",
          "Duniyayɔrɔ jateminɛw",
          "Taama kanko",
          "Wariko jateminɛw"
        ]
      }
    },
    residence_permit: {
      description: {
        fr: "Obtenir ou renouveler votre titre de séjour",
        en: "Get or renew your residence permit",
        es: "Obtener o renovar tu permiso de residencia",
        bm: "Ka sigiyɔrɔ sɛbɛn sɔrɔ walima ka a yɛlɛma"
      },
      links: [
        {
          name: { fr: "ANEF - Administration Numérique", en: "ANEF - Digital Administration", es: "ANEF - Administración Digital", bm: "ANEF - Internɛti baarakɛcogo" },
          url: "https://administration-etrangers-en-france.interieur.gouv.fr/"
        },
        {
          name: { fr: "Service Public - Titres de séjour", en: "Public Service - Residence permits", es: "Servicio Público - Permisos de residencia", bm: "Foroba baarakɛcogo - Sigiyɔrɔ sɛbɛnw" },
          url: "https://www.service-public.fr/particuliers/vosdroits/N110"
        }
      ],
      documents: {
        fr: [
          "Titre de séjour actuel (si renouvellement)",
          "Passeport valide",
          "Justificatif de domicile (- 3 mois)",
          "3 photos d'identité",
          "Justificatifs de ressources",
          "Attestation de présence (VLS-TS)"
        ],
        en: [
          "Current residence permit (if renewal)",
          "Valid passport",
          "Proof of address (< 3 months)",
          "3 ID photos",
          "Proof of income",
          "Certificate of presence (VLS-TS)"
        ],
        es: [
          "Permiso de residencia actual (si renovación)",
          "Pasaporte válido",
          "Justificante de domicilio (< 3 meses)",
          "3 fotos de identidad",
          "Justificantes de ingresos",
          "Certificado de presencia (VLS-TS)"
        ],
        bm: [
          "Sigiyɔrɔ sɛbɛn min bɛ yen sisan (ni yɛlɛmali don)",
          "Pasipɔri min bɛ se ka kɛ",
          "Sigiyɔrɔ jateminɛw (kalo 3 tɛmɛnenw)",
          "Foto 3",
          "Wari sɔrɔko jateminɛw",
          "Ɲɛjirali sɛbɛn (VLS-TS)"
        ]
      }
    },
    work_permit: {
      description: {
        fr: "Autorisation de travail en France",
        en: "Work authorization in France",
        es: "Autorización de trabajo en Francia",
        bm: "Baara kɛcogo sɛbɛn Faransi"
      },
      links: [
        {
          name: { fr: "Procédure employeur", en: "Employer procedure", es: "Procedimiento empleador", bm: "Baarakɛlaw ka taabolo" },
          url: "https://www.immigration.interieur.gouv.fr/Immigration/L-immigration-professionnelle"
        }
      ],
      documents: {
        fr: [
          "Contrat de travail ou promesse d'embauche",
          "Diplômes et qualifications",
          "CV détaillé",
          "Attestation employeur",
          "Justificatif OFII si applicable"
        ],
        en: [
          "Work contract or job offer",
          "Degrees and qualifications",
          "Detailed CV",
          "Employer certificate",
          "OFII certificate if applicable"
        ],
        es: [
          "Contrato de trabajo u oferta de empleo",
          "Títulos y calificaciones",
          "CV detallado",
          "Certificado del empleador",
          "Certificado OFII si aplica"
        ],
        bm: [
          "Baara sɛbɛn walima baara diyali",
          "Kalanko sɛbɛnw",
          "CV dakun",
          "Baarakɛlaw ka sɛbɛn",
          "OFII sɛbɛn ni a ka kan"
        ]
      }
    },
    family_reunification: {
      description: {
        fr: "Faire venir votre famille en France",
        en: "Bring your family to France",
        es: "Traer a tu familia a Francia",
        bm: "Ka i ka somɔgɔw na Faransi"
      },
      links: [
        {
          name: { fr: "Regroupement familial", en: "Family reunification", es: "Reagrupación familiar", bm: "Somɔgɔw lajɛ" },
          url: "https://www.service-public.fr/particuliers/vosdroits/F11166"
        }
      ],
      documents: {
        fr: [
          "Titre de séjour valide",
          "Justificatifs de ressources stables",
          "Justificatif de logement décent",
          "Actes d'état civil (mariage, naissance)",
          "Photos d'identité de tous"
        ],
        en: [
          "Valid residence permit",
          "Proof of stable income",
          "Proof of decent housing",
          "Civil status documents (marriage, birth)",
          "ID photos of everyone"
        ],
        es: [
          "Permiso de residencia válido",
          "Justificantes de ingresos estables",
          "Justificante de vivienda decente",
          "Documentos de estado civil (matrimonio, nacimiento)",
          "Fotos de identidad de todos"
        ],
        bm: [
          "Sigiyɔrɔ sɛbɔn min bɛ se ka kɛ",
          "Wari sɔrɔko sabatilen jateminɛw",
          "So ɲuman jateminɛw",
          "Denmisɛnya sɛbɛnw (furu, wolo)",
          "Bɛɛ ka foto"
        ]
      }
    },
    naturalization: {
      description: {
        fr: "Devenir citoyen français",
        en: "Become a French citizen",
        es: "Convertirse en ciudadano francés",
        bm: "Ka kɛ Faransidenw ye"
      },
      links: [
        {
          name: { fr: "Naturalisation", en: "Naturalization", es: "Naturalización", bm: "Jamana denmisɛnw sɔrɔli" },
          url: "https://www.service-public.fr/particuliers/vosdroits/N111"
        }
      ],
      documents: {
        fr: [
          "5 ans de résidence régulière",
          "Niveau B1 de français (TCF/TEF)",
          "Justificatifs d'intégration",
          "Extrait de casier judiciaire",
          "Attestation d'emploi ou de formation"
        ],
        en: [
          "5 years of legal residence",
          "B1 level French (TCF/TEF)",
          "Proof of integration",
          "Criminal record extract",
          "Employment or training certificate"
        ],
        es: [
          "5 años de residencia legal",
          "Nivel B1 de francés (TCF/TEF)",
          "Justificantes de integración",
          "Extracto de antecedentes penales",
          "Certificado de empleo o formación"
        ],
        bm: [
          "San 5 sigili sabatilen na",
          "Faransi kan B1 (TCF/TEF)",
          "Jɛkulu jateminɛw",
          "Kibaaru ɲuman sɛbɛn",
          "Baara walima kalanko sɛbɛn"
        ]
      }
    }
  };

  const emergencyContacts = {
    title: { 
      fr: "Contacts urgents", 
      en: "Emergency contacts", 
      es: "Contactos de emergencia",
      bm: "Teliya jɔndalaw"
    },
    contacts: [
      {
        name: { fr: "Préfecture", en: "Prefecture", es: "Prefectura", bm: "Prefɛkitiiri" },
        phone: "Selon votre département",
        info: { fr: "Consultez l'annuaire", en: "Check directory", es: "Consultar directorio", bm: "Lisɛli lajɛ" }
      },
      {
        name: { fr: "OFII (Immigration)", en: "OFII (Immigration)", es: "OFII (Inmigración)", bm: "OFII (Mɔgɔ doncogo)" },
        phone: "01 53 69 53 70",
        website: "https://www.ofii.fr"
      },
      {
        name: { fr: "Info Migrants", en: "Info Migrants", es: "Info Migrants", bm: "Mɔgɔ donw ka kunnafoni" },
        phone: "01 53 26 52 82",
        website: "https://www.infomigrants.net"
      },
      {
        name: "La Cimade",
        phone: "01 40 08 05 34",
        website: "https://www.lacimade.org"
      }
    ]
  };

  const currentLang = i18n.language;
  const category = adminResources[activeCategory];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header avec sélecteur de langue */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {t('admin.title')}
          </h1>
          
          {/* Language Selector */}
          <div className="flex gap-2 bg-white rounded-xl p-2 shadow-lg">
            {['fr', 'en', 'es', 'bm'].map((lang) => (
              <button
                key={lang}
                onClick={() => i18n.changeLanguage(lang)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  i18n.language === lang
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {lang === 'fr' && '🇫🇷 Français'}
                {lang === 'en' && '🇬🇧 English'}
                {lang === 'es' && '🇪🇸 Español'}
                {lang === 'bm' && '🇲🇱 Bambara'}
              </button>
            ))}
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <motion.button
                key={cat.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveCategory(cat.id)}
                className={`p-6 rounded-xl shadow-lg transition-all ${
                  isActive
                    ? `bg-gradient-to-br from-${cat.color}-500 to-${cat.color}-600 text-white`
                    : 'bg-white text-gray-700 hover:shadow-xl'
                }`}
              >
                <Icon className={`w-8 h-8 mx-auto mb-2 ${isActive ? 'text-white' : `text-${cat.color}-600`}`} />
                <p className="text-sm font-semibold text-center">
                  {t(`admin.${cat.id}`)}
                </p>
              </motion.button>
            );
          })}
        </div>

        {/* Category Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="card p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {t(`admin.${activeCategory}`)}
              </h2>
              <p className="text-gray-600">
                {category.description[currentLang]}
              </p>
            </div>

            {/* Required Documents */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-6 h-6 text-purple-600" />
                <h3 className="text-xl font-bold text-gray-900">
                  {t('admin.documents_required')}
                </h3>
              </div>
              <ul className="space-y-2">
                {category.documents[currentLang].map((doc, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{doc}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Useful Links */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <ExternalLink className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-900">
                  {currentLang === 'fr' ? 'Liens utiles' : 
                   currentLang === 'en' ? 'Useful links' :
                   currentLang === 'es' ? 'Enlaces útiles' : 
                   'Liyɛnw nafa'}
                </h3>
              </div>
              <div className="space-y-3">
                {category.links.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
                  >
                    <span className="text-blue-700 font-medium">
                      {link.name[currentLang]}
                    </span>
                    <ExternalLink className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Emergency Contacts */}
            <div className="card p-6 bg-gradient-to-br from-red-50 to-orange-50">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <h3 className="text-lg font-bold text-gray-900">
                  {emergencyContacts.title[currentLang]}
                </h3>
              </div>
              <div className="space-y-4">
                {emergencyContacts.contacts.map((contact, idx) => (
                  <div key={idx} className="p-3 bg-white rounded-lg">
                    <p className="font-semibold text-gray-900">
                      {typeof contact.name === 'object' ? contact.name[currentLang] : contact.name}
                    </p>
                    {contact.phone && (
                      <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-sm text-blue-600 mt-1">
                        <Phone className="w-4 h-4" />
                        {contact.phone}
                      </a>
                    )}
                    {contact.website && (
                      <a href={contact.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 mt-1">
                        <Globe className="w-4 h-4" />
                        {currentLang === 'fr' ? 'Site web' : 
                         currentLang === 'en' ? 'Website' :
                         currentLang === 'es' ? 'Sitio web' : 
                         'Siti'}
                      </a>
                    )}
                    {contact.info && (
                      <p className="text-xs text-gray-600 mt-1">{contact.info[currentLang]}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="card p-6 bg-gradient-to-br from-green-50 to-emerald-50">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-bold text-gray-900">
                  {currentLang === 'fr' ? 'Conseils' : 
                   currentLang === 'en' ? 'Tips' :
                   currentLang === 'es' ? 'Consejos' : 
                   'Hakilinaw'}
                </h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>
                    {currentLang === 'fr' ? 'Prenez RDV tôt le matin' : 
                     currentLang === 'en' ? 'Book appointments early morning' :
                     currentLang === 'es' ? 'Reserve citas temprano' : 
                     'Lajɛrencogo ta sɔgɔma-sɔgɔma'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>
                    {currentLang === 'fr' ? 'Gardez des copies de tout' : 
                     currentLang === 'en' ? 'Keep copies of everything' :
                     currentLang === 'es' ? 'Guarda copias de todo' : 
                     'Fɛn bɛɛ kopi mara'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>
                    {currentLang === 'fr' ? 'Arrivez 15 min en avance' : 
                     currentLang === 'en' ? 'Arrive 15 min early' :
                     currentLang === 'es' ? 'Llega 15 min antes' : 
                     'Na miniti 15 fɔlɔ'}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
