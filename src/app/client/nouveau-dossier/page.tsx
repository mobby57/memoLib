/**
 * Formulaire Complet - Client remplit son dossier
 * Toutes informations + documents + listes déroulantes
 */

'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, FormEvent } from 'react';

// Types de dossiers CESEDA
const TYPES_DOSSIER = [
  { value: 'TITRE_SEJOUR', label: '📄 Demande Titre de Séjour' },
  { value: 'RECOURS_OQTF', label: '⚠️ Recours OQTF' },
  { value: 'NATURALISATION', label: '🇫🇷 Demande Naturalisation' },
  { value: 'REGROUPEMENT_FAMILIAL', label: '👨‍👩‍👧 Regroupement Familial' },
  { value: 'ASILE', label: '🏠 Demande Asile' },
  { value: 'VISA', label: '✈️ Demande Visa' },
  { value: 'AUTRE', label: '📋 Autre' },
];

const NATIONALITES = [
  'Afghane', 'Albanaise', 'Algérienne', 'Allemande', 'Américaine', 'Britannique',
  'Camerounaise', 'Chinoise', 'Congolaise', 'Égyptienne', 'Espagnole', 'Irakienne',
  'Iranienne', 'Italienne', 'Ivoirienne', 'Marocaine', 'Nigériane', 'Portugaise',
  'Russe', 'Sénégalaise', 'Syrienne', 'Tunisienne', 'Turque', 'Ukrainienne', 'Autre'
];

const SITUATIONS_FAMILIALES = [
  { value: 'CELIBATAIRE', label: 'Célibataire' },
  { value: 'MARIE', label: 'Marié(e)' },
  { value: 'PACSE', label: 'Pacsé(e)' },
  { value: 'CONCUBINAGE', label: 'En concubinage' },
  { value: 'DIVORCE', label: 'Divorcé(e)' },
  { value: 'VEUF', label: 'Veuf/Veuve' },
];

const NIVEAUX_FRANCAIS = [
  { value: 'A1', label: 'A1 - Débutant' },
  { value: 'A2', label: 'A2 - Élémentaire' },
  { value: 'B1', label: 'B1 - Intermédiaire' },
  { value: 'B2', label: 'B2 - Avancé' },
  { value: 'C1', label: 'C1 - Autonome' },
  { value: 'C2', label: 'C2 - Maîtrise' },
  { value: 'LANGUE_MATERNELLE', label: 'Langue maternelle' },
];

const SITUATIONS_PROFESSIONNELLES = [
  { value: 'SALARIE_CDI', label: 'Salarié(e) en CDI' },
  { value: 'SALARIE_CDD', label: 'Salarié(e) en CDD' },
  { value: 'INTERIM', label: 'Intérimaire' },
  { value: 'INDEPENDANT', label: 'Travailleur indépendant' },
  { value: 'CHOMAGE', label: 'Au chômage' },
  { value: 'ETUDIANT', label: 'Étudiant(e)' },
  { value: 'RETRAITE', label: 'Retraité(e)' },
  { value: 'SANS_EMPLOI', label: 'Sans emploi' },
];

const TYPES_LOGEMENT = [
  { value: 'PROPRIETAIRE', label: 'Propriétaire' },
  { value: 'LOCATAIRE', label: 'Locataire' },
  { value: 'HERBERGE', label: 'Hébergé(e) gratuitement' },
  { value: 'FOYER', label: 'Foyer/Résidence sociale' },
  { value: 'SANS_DOMICILE', label: 'Sans domicile fixe' },
];

const TYPES_DOCUMENTS = [
  { type: 'IDENTITE' as const, label: 'Pièce d\'identité (passeport, carte nationale)', required: true },
  { type: 'ACTE_NAISSANCE', label: 'Acte de naissance', required: true },
  { type: 'JUSTIFICATIF_DOMICILE', label: 'Justificatif de domicile (-3 mois)', required: true },
  { type: 'PHOTOS', label: 'Photos d\'identité (format e-photo)', required: true },
  { type: 'TITRE_SEJOUR', label: 'Titre de séjour actuel (si renouvellement)', required: false },
  { type: 'CONTRAT_TRAVAIL', label: 'Contrat de travail', required: false },
  { type: 'BULLETINS_SALAIRE', label: 'Bulletins de salaire (3 derniers mois)', required: false },
  { type: 'AVIS_IMPOSITION', label: 'Avis d\'imposition', required: false },
  { type: 'CERTIFICAT_FRANCAIS', label: 'Certificat niveau français (DELF/TCF)', required: false },
  { type: 'DIPLOMES', label: 'Diplômes', required: false },
  { type: 'ACTE_MARIAGE', label: 'Acte de mariage', required: false },
  { type: 'LIVRET_FAMILLE', label: 'Livret de famille', required: false },
  { type: 'BAIL', label: 'Bail ou attestation hébergement', required: false },
  { type: 'RELEVES_BANCAIRES', label: 'Relevés bancaires (3 mois)', required: false },
  { type: 'CASIER_JUDICIAIRE', label: 'Casier judiciaire', required: false },
  { type: 'CERTIFICAT_MEDICAL', label: 'Certificat médical', required: false },
  { type: 'AUTRES', label: 'Autres documents', required: false },
];

export default function NouveauDossierClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Formulaire - Informations Générales
  const [typeDossier, setTypeDossier] = useState('');
  const [objetDemande, setObjetDemande] = useState('');
  const [urgence, setUrgence] = useState(false);
  const [dateEcheance, setDateEcheance] = useState('');

  // Informations Personnelles
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [nomNaissance, setNomNaissance] = useState('');
  const [dateNaissance, setDateNaissance] = useState('');
  const [lieuNaissance, setLieuNaissance] = useState('');
  const [paysNaissance, setPaysNaissance] = useState('');
  const [nationalite, setNationalite] = useState('');
  const [autreNationalite, setAutreNationalite] = useState('');
  const [sexe, setSexe] = useState('');

  // Contact
  const [telephone, setTelephone] = useState('');
  const [telephoneSecondaire, setTelephoneSecondaire] = useState('');
  const [email, setEmail] = useState('');
  
  // Adresse actuelle
  const [adresse, setAdresse] = useState('');
  const [codePostal, setCodePostal] = useState('');
  const [ville, setVille] = useState('');
  const [pays, _setPays] = useState('France');
  const [typeLogement, setTypeLogement] = useState('');
  const [depuisQuand, setDepuisQuand] = useState('');

  // Situation Familiale
  const [situationFamiliale, setSituationFamiliale] = useState('');
  const [nombreEnfants, setNombreEnfants] = useState('0');
  const [enfantsEnFrance, setEnfantsEnFrance] = useState('0');
  const [conjointNom, setConjointNom] = useState('');
  const [conjointPrenom, setConjointPrenom] = useState('');
  const [conjointNationalite, setConjointNationalite] = useState('');

  // Situation Professionnelle
  const [situationPro, setSituationPro] = useState('');
  const [employeur, setEmployeur] = useState('');
  const [profession, setProfession] = useState('');
  const [salaireMensuel, setSalaireMensuel] = useState('');
  const [dateEmbauche, setDateEmbauche] = useState('');
  const [numeroSecu, setNumeroSecu] = useState('');

  // Parcours en France
  const [dateArrivee, setDateArrivee] = useState('');
  const [modeEntree, setModeEntree] = useState('');
  const [numeroVisa, setNumeroVisa] = useState('');
  const [titresSejour, setTitresSejour] = useState('');
  const [niveauFrancais, setNiveauFrancais] = useState('');

  // Situation Administrative
  const [numeroEtranger, setNumeroEtranger] = useState('');
  const [prefectureRattachement, setPrefectureRattachement] = useState('');
  const [recusAnterieur, setRecusAnterieur] = useState(false);
  const [motifRecusAnterieur, setMotifRecusAnterieur] = useState('');
  const [mesuresEloignement, setMesuresEloignement] = useState(false);
  const [detailsMesures, setDetailsMesures] = useState('');

  // Informations Complémentaires
  const [motivations, setMotivations] = useState('');
  const [attachementFrance, setAttachementFrance] = useState('');
  const [problemeSante, setProblemeSante] = useState(false);
  const [detailsSante, setDetailsSante] = useState('');
  const [autresInfos, setAutresInfos] = useState('');

  // Documents uploadés
  const [documents, setDocuments] = useState<{[key: string]: File[]}>({});

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (session?.user && session.user.role !== 'CLIENT') {
      router.push('/dashboard');
    }
  }, [session, status, router]);

  const handleFileChange = (type: string, files: FileList | null) => {
    if (files) {
      setDocuments(prev => ({
        ...prev,
        [type]: Array.from(files)
      }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Vérifier documents obligatoires
      const docsObligatoires = TYPES_DOCUMENTS.filter(d => d.required);
      const missingDocs = docsObligatoires.filter(d => !documents[d.type]?.length);
      
      if (missingDocs.length > 0) {
        setError(`Documents obligatoires manquants : ${missingDocs.map(d => d.label).join(', ')}`);
        setLoading(false);
        return;
      }

      // Préparer FormData pour upload
      const formData = new FormData();
      
      // Informations générales
      formData.append('typeDossier', typeDossier);
      formData.append('objetDemande', objetDemande);
      formData.append('urgence', urgence.toString());
      formData.append('dateEcheance', dateEcheance);

      // Informations personnelles
      const infosPersonnelles = {
        nom, prenom, nomNaissance, dateNaissance, lieuNaissance,
        paysNaissance, nationalite, autreNationalite, sexe,
        telephone, telephoneSecondaire, email,
        adresse, codePostal, ville, pays, typeLogement, depuisQuand,
        situationFamiliale, nombreEnfants, enfantsEnFrance,
        conjointNom, conjointPrenom, conjointNationalite,
        situationPro, employeur, profession, salaireMensuel, dateEmbauche, numeroSecu,
        dateArrivee, modeEntree, numeroVisa, titresSejour, niveauFrancais,
        numeroEtranger, prefectureRattachement, recusAnterieur, motifRecusAnterieur,
        mesuresEloignement, detailsMesures,
        motivations, attachementFrance, problemeSante, detailsSante, autresInfos
      };
      
      formData.append('informations', JSON.stringify(infosPersonnelles));

      // Documents
      Object.entries(documents).forEach(([type, files]) => {
        files.forEach((file, index) => {
          formData.append(`${type}_${index}`, file);
        });
      });

      // Envoi
      const response = await fetch('/api/client/nouveau-dossier', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la soumission');
      }

      setSuccess(true);
      setTimeout(() => router.push('/client'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Chargement...</div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="bg-white rounded-2xl shadow-2xl p-12 text-center max-w-md">
          <div className="text-6xl mb-6">✅</div>
          <h2 className="text-3xl font-bold text-green-600 mb-4">Dossier Envoyé !</h2>
          <p className="text-gray-600 mb-6">
            Votre dossier a été transmis à votre avocat. Vous serez contacté sous 48h.
          </p>
          <div className="text-sm text-gray-500">Redirection en cours...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">📋</span>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Nouveau Dossier
              </h1>
              <p className="text-gray-600">Remplissez toutes les informations nécessaires</p>
            </div>
          </div>
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-sm text-blue-800">
              <strong>Important :</strong> Remplissez ce formulaire avec le maximum de détails. 
              Tous les champs marqués d'un <span className="text-red-500">*</span> sont obligatoires.
            </p>
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* SECTION 1 : Type de Dossier */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span>📄</span>
              Type de Demande
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block font-semibold mb-2">
                  Type de dossier <span className="text-red-500">*</span>
                </label>
                <select
                  value={typeDossier}
                  onChange={(e) => setTypeDossier(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  required
                >
                  <option value="">Sélectionnez...</option>
                  {TYPES_DOSSIER.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-2">
                  Date d'échéance (si connue)
                </label>
                <input
                  type="date"
                  value={dateEcheance}
                  onChange={(e) => setDateEcheance(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold mb-2">
                  Objet de la demande <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={objetDemande}
                  onChange={(e) => setObjetDemande(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  rows={3}
                  placeholder="Ex: Renouvellement titre de séjour salarié arrivant à échéance..."
                  required
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="urgence"
                  checked={urgence}
                  onChange={(e) => setUrgence(e.target.checked)}
                  className="w-5 h-5"
                />
                <label htmlFor="urgence" className="font-semibold">
                  ⚠️ Dossier urgent (OQTF, deadline proche)
                </label>
              </div>
            </div>
          </div>

          {/* SECTION 2 : Identité */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span>👤</span>
              Identité
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block font-semibold mb-2">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">
                  Nom de naissance (si différent)
                </label>
                <input
                  type="text"
                  value={nomNaissance}
                  onChange={(e) => setNomNaissance(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">
                  Sexe <span className="text-red-500">*</span>
                </label>
                <select
                  value={sexe}
                  onChange={(e) => setSexe(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  required
                >
                  <option value="">Sélectionnez...</option>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-2">
                  Date de naissance <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={dateNaissance}
                  onChange={(e) => setDateNaissance(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">
                  Lieu de naissance <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={lieuNaissance}
                  onChange={(e) => setLieuNaissance(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">
                  Pays de naissance <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={paysNaissance}
                  onChange={(e) => setPaysNaissance(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">
                  Nationalité <span className="text-red-500">*</span>
                </label>
                <select
                  value={nationalite}
                  onChange={(e) => setNationalite(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  required
                >
                  <option value="">Sélectionnez...</option>
                  {NATIONALITES.map(nat => (
                    <option key={nat} value={nat}>{nat}</option>
                  ))}
                </select>
              </div>

              {nationalite === 'Autre' && (
                <div>
                  <label className="block font-semibold mb-2">
                    Précisez la nationalité <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={autreNationalite}
                    onChange={(e) => setAutreNationalite(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3 : Contact */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span>📞</span>
              Contact
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block font-semibold mb-2">
                  Téléphone principal <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="06 12 34 56 78"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">
                  Téléphone secondaire
                </label>
                <input
                  type="tel"
                  value={telephoneSecondaire}
                  onChange={(e) => setTelephoneSecondaire(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="07 98 76 54 32"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* SECTION 4 : Adresse */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span>🏠</span>
              Domicile Actuel
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block font-semibold mb-2">
                  Adresse complète <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={adresse}
                  onChange={(e) => setAdresse(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="123 rue de la République"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">
                  Code postal <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={codePostal}
                  onChange={(e) => setCodePostal(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">
                  Ville <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={ville}
                  onChange={(e) => setVille(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">
                  Type de logement <span className="text-red-500">*</span>
                </label>
                <select
                  value={typeLogement}
                  onChange={(e) => setTypeLogement(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  required
                >
                  <option value="">Sélectionnez...</option>
                  {TYPES_LOGEMENT.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-2">
                  Depuis quand ? <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={depuisQuand}
                  onChange={(e) => setDepuisQuand(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* SECTION 5 : Situation Familiale */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span>👨‍👩‍👧‍👦</span>
              Situation Familiale
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block font-semibold mb-2">
                  Situation familiale <span className="text-red-500">*</span>
                </label>
                <select
                  value={situationFamiliale}
                  onChange={(e) => setSituationFamiliale(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  required
                >
                  <option value="">Sélectionnez...</option>
                  {SITUATIONS_FAMILIALES.map(sit => (
                    <option key={sit.value} value={sit.value}>{sit.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-2">
                  Nombre d'enfants
                </label>
                <input
                  type="number"
                  value={nombreEnfants}
                  onChange={(e) => setNombreEnfants(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  min="0"
                />
              </div>

              {parseInt(nombreEnfants) > 0 && (
                <div>
                  <label className="block font-semibold mb-2">
                    Enfants résidant en France
                  </label>
                  <input
                    type="number"
                    value={enfantsEnFrance}
                    onChange={(e) => setEnfantsEnFrance(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    min="0"
                    max={nombreEnfants}
                  />
                </div>
              )}

              {(situationFamiliale === 'MARIE' || situationFamiliale === 'PACSE') && (
                <>
                  <div>
                    <label className="block font-semibold mb-2">
                      Nom du conjoint
                    </label>
                    <input
                      type="text"
                      value={conjointNom}
                      onChange={(e) => setConjointNom(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-2">
                      Prénom du conjoint
                    </label>
                    <input
                      type="text"
                      value={conjointPrenom}
                      onChange={(e) => setConjointPrenom(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-2">
                      Nationalité du conjoint
                    </label>
                    <select
                      value={conjointNationalite}
                      onChange={(e) => setConjointNationalite(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">Sélectionnez...</option>
                      {NATIONALITES.map(nat => (
                        <option key={nat} value={nat}>{nat}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* SECTION 6 : Situation Professionnelle */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span>💼</span>
              Situation Professionnelle
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block font-semibold mb-2">
                  Situation professionnelle <span className="text-red-500">*</span>
                </label>
                <select
                  value={situationPro}
                  onChange={(e) => setSituationPro(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  required
                >
                  <option value="">Sélectionnez...</option>
                  {SITUATIONS_PROFESSIONNELLES.map(sit => (
                    <option key={sit.value} value={sit.value}>{sit.label}</option>
                  ))}
                </select>
              </div>

              {(situationPro.includes('SALARIE') || situationPro === 'INTERIM') && (
                <>
                  <div>
                    <label className="block font-semibold mb-2">
                      Employeur
                    </label>
                    <input
                      type="text"
                      value={employeur}
                      onChange={(e) => setEmployeur(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-2">
                      Profession / Poste
                    </label>
                    <input
                      type="text"
                      value={profession}
                      onChange={(e) => setProfession(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-2">
                      Salaire mensuel net (€)
                    </label>
                    <input
                      type="number"
                      value={salaireMensuel}
                      onChange={(e) => setSalaireMensuel(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-2">
                      Date d'embauche
                    </label>
                    <input
                      type="date"
                      value={dateEmbauche}
                      onChange={(e) => setDateEmbauche(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block font-semibold mb-2">
                  Numéro de sécurité sociale
                </label>
                <input
                  type="text"
                  value={numeroSecu}
                  onChange={(e) => setNumeroSecu(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="1 23 45 67 890 123 45"
                />
              </div>
            </div>
          </div>

          {/* SECTION 7 : Parcours en France */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span>🇫🇷</span>
              Parcours en France
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block font-semibold mb-2">
                  Date d'arrivée en France <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={dateArrivee}
                  onChange={(e) => setDateArrivee(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">
                  Mode d'entrée
                </label>
                <select
                  value={modeEntree}
                  onChange={(e) => setModeEntree(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Sélectionnez...</option>
                  <option value="VISA_TOURISME">Visa tourisme</option>
                  <option value="VISA_ETUDIANT">Visa étudiant</option>
                  <option value="VISA_TRAVAIL">Visa travail</option>
                  <option value="VISA_FAMILLE">Visa famille</option>
                  <option value="DEMANDE_ASILE">Demande d'asile</option>
                  <option value="SANS_VISA">Sans visa (UE/EEE)</option>
                  <option value="AUTRE">Autre</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-2">
                  Numéro de visa (si applicable)
                </label>
                <input
                  type="text"
                  value={numeroVisa}
                  onChange={(e) => setNumeroVisa(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">
                  Niveau de français
                </label>
                <select
                  value={niveauFrancais}
                  onChange={(e) => setNiveauFrancais(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Sélectionnez...</option>
                  {NIVEAUX_FRANCAIS.map(niv => (
                    <option key={niv.value} value={niv.value}>{niv.label}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold mb-2">
                  Titres de séjour antérieurs (types et dates)
                </label>
                <textarea
                  value={titresSejour}
                  onChange={(e) => setTitresSejour(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  rows={3}
                  placeholder="Ex: Étudiant (2020-2023), Salarié (2023-2025)..."
                />
              </div>
            </div>
          </div>

          {/* SECTION 8 : Situation Administrative */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span>📋</span>
              Situation Administrative
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block font-semibold mb-2">
                  Numéro étranger (AGDREF)
                </label>
                <input
                  type="text"
                  value={numeroEtranger}
                  onChange={(e) => setNumeroEtranger(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">
                  Préfecture de rattachement
                </label>
                <input
                  type="text"
                  value={prefectureRattachement}
                  onChange={(e) => setPrefectureRattachement(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="Ex: Préfecture de Paris"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={recusAnterieur}
                    onChange={(e) => setRecusAnterieur(e.target.checked)}
                    className="w-5 h-5"
                  />
                  <span className="font-semibold">Avez-vous déjà eu des refus de titre de séjour ?</span>
                </label>
              </div>

              {recusAnterieur && (
                <div className="md:col-span-2">
                  <label className="block font-semibold mb-2">
                    Précisez les motifs et dates
                  </label>
                  <textarea
                    value={motifRecusAnterieur}
                    onChange={(e) => setMotifRecusAnterieur(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    rows={3}
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={mesuresEloignement}
                    onChange={(e) => setMesuresEloignement(e.target.checked)}
                    className="w-5 h-5"
                  />
                  <span className="font-semibold">Avez-vous fait l'objet de mesures d'éloignement (OQTF, ITF, etc.) ?</span>
                </label>
              </div>

              {mesuresEloignement && (
                <div className="md:col-span-2">
                  <label className="block font-semibold mb-2">
                    Détails des mesures <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={detailsMesures}
                    onChange={(e) => setDetailsMesures(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    rows={3}
                    required
                  />
                </div>
              )}
            </div>
          </div>

          {/* SECTION 9 : Informations Complémentaires */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span>💡</span>
              Informations Complémentaires
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block font-semibold mb-2">
                  Motivations de votre demande
                </label>
                <textarea
                  value={motivations}
                  onChange={(e) => setMotivations(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  rows={4}
                  placeholder="Expliquez pourquoi vous souhaitez rester/venir en France..."
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">
                  Liens avec la France (famille, travail, études, associations...)
                </label>
                <textarea
                  value={attachementFrance}
                  onChange={(e) => setAttachementFrance(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  rows={4}
                  placeholder="Décrivez vos attaches en France..."
                />
              </div>

              <div>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={problemeSante}
                    onChange={(e) => setProblemeSante(e.target.checked)}
                    className="w-5 h-5"
                  />
                  <span className="font-semibold">Avez-vous des problèmes de santé nécessitant un traitement en France ?</span>
                </label>
              </div>

              {problemeSante && (
                <div>
                  <label className="block font-semibold mb-2">
                    Détails de l'état de santé
                  </label>
                  <textarea
                    value={detailsSante}
                    onChange={(e) => setDetailsSante(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    rows={3}
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold mb-2">
                  Autres informations importantes
                </label>
                <textarea
                  value={autresInfos}
                  onChange={(e) => setAutresInfos(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  rows={4}
                  placeholder="Toute autre information qui pourrait être utile à votre dossier..."
                />
              </div>
            </div>
          </div>

          {/* SECTION 10 : Documents */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span>📎</span>
              Documents à Fournir
            </h2>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Important :</strong> Scannez tous vos documents en PDF ou JPG. 
                Les documents marqués <span className="text-red-500">*</span> sont obligatoires.
              </p>
            </div>
            
            <div className="space-y-4">
              {TYPES_DOCUMENTS.map(doc => (
                <div key={doc.type} className="p-4 border-2 border-gray-200 rounded-lg">
                  <label className="block font-semibold mb-2">
                    {doc.label} {doc.required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(doc.type, e.target.files)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                  {documents[doc.type]?.length > 0 && (
                    <div className="mt-2 text-sm text-green-600">
                      ✅ {documents[doc.type].length} fichier(s) sélectionné(s)
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Erreur */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Bouton Submit */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xl font-bold rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '⏳ Envoi en cours...' : '📤 Envoyer le Dossier à mon Avocat'}
            </button>

            <p className="text-center text-sm text-gray-500 mt-4">
              Vos données sont protégées et ne seront partagées qu'avec votre avocat.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
