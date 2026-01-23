'use client'

/**
 * Champs spécifiques par type de dossier CESEDA
 * - Formulaires dynamiques selon le type sélectionné
 * - Validation contextuelle
 * - Aide et documentation intégrées
 */

import { useFormContext } from 'react-hook-form'
import { AlertCircle, Calendar, FileText, Info, Shield, Users } from 'lucide-react'

export function CesedaSpecificFields() {
  const { watch } = useFormContext()
  const typeDossier = watch('typeDossier')

  switch (typeDossier) {
    case 'RECOURS_OQTF':
      return <FormulaireOQTF />
    case 'ASILE':
      return <FormulaireAsile />
    case 'TITRE_SEJOUR':
      return <FormulaireTitreSejour />
    case 'NATURALISATION':
      return <FormulaireNaturalisation />
    case 'REGROUPEMENT_FAMILIAL':
      return <FormulaireRegroupementFamilial />
    default:
      return null
  }
}

// ===== FORMULAIRE OQTF =====
function FormulaireOQTF() {
  const { register, watch, formState: { errors } } = useFormContext()
  const typeOqtf = watch('metadata.oqtf.type')
  const modeNotification = watch('metadata.oqtf.modeNotification')

  return (
    <div className="space-y-6 bg-red-50 border border-red-200 rounded-lg p-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
        <div>
          <h3 className="text-xl font-bold text-red-900 mb-1">Recours contre OQTF</h3>
          <p className="text-sm text-red-700">Obligation de Quitter le Territoire Français - Dossier critique</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Type d'OQTF */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type d'OQTF <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-white">
              <input
                type="radio"
                value="sans_delai"
                {...register('metadata.oqtf.type')}
                className="mr-3"
              />
              <div>
                <div className="font-medium">OQTF sans délai de départ volontaire</div>
                <div className="text-xs text-gray-600">Référé-liberté dans les 48h</div>
              </div>
            </label>
            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-white">
              <input
                type="radio"
                value="30_jours"
                {...register('metadata.oqtf.type')}
                className="mr-3"
              />
              <div>
                <div className="font-medium">OQTF avec délai de départ volontaire (30 jours)</div>
                <div className="text-xs text-gray-600">Recours administratif et contentieux possibles</div>
              </div>
            </label>
          </div>
        </div>

        {/* Date de notification */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date de notification OQTF <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            {...register('metadata.oqtf.dateNotification')}
            className="w-full px-4 py-2 border rounded-lg"
          />
          <p className="text-xs text-gray-600 mt-1">Date de remise de l'arrêté OQTF</p>
        </div>

        {/* Mode de notification */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mode de notification <span className="text-red-500">*</span>
          </label>
          <select {...register('metadata.oqtf.modeNotification')} className="w-full px-4 py-2 border rounded-lg">
            <option value="">-- Sélectionner --</option>
            <option value="main_propre">Remise en main propre</option>
            <option value="courrier">Courrier recommandé</option>
            <option value="prefecture">Notification en préfecture</option>
            <option value="domicile">Notification au domicile</option>
          </select>
        </div>

        {/* Numéro de l'arrêté */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Numéro de l'arrêté préfectoral
          </label>
          <input
            type="text"
            {...register('metadata.oqtf.numeroArrete')}
            placeholder="Ex: 2026-PREF-001234"
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        {/* Préfecture émettrice */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Préfecture émettrice <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('metadata.oqtf.prefecture')}
            placeholder="Ex: Préfecture du Val-de-Marne"
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        {/* Interdiction de retour */}
        <div className="md:col-span-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register('metadata.oqtf.interdictionRetour')}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium">Interdiction de retour sur le territoire français (IRTF)</span>
          </label>
        </div>

        {watch('metadata.oqtf.interdictionRetour') && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Durée de l'interdiction
              </label>
              <select {...register('metadata.oqtf.dureeInterdiction')} className="w-full px-4 py-2 border rounded-lg">
                <option value="">-- Sélectionner --</option>
                <option value="1_an">1 an</option>
                <option value="2_ans">2 ans</option>
                <option value="3_ans">3 ans</option>
                <option value="plus_3_ans">Plus de 3 ans</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motif de l'interdiction
              </label>
              <input
                type="text"
                {...register('metadata.oqtf.motifInterdiction')}
                placeholder="Ex: Séjour irrégulier"
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </>
        )}

        {/* Pays de destination */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pays de destination prévu
          </label>
          <input
            type="text"
            {...register('metadata.oqtf.paysDestination')}
            placeholder="Ex: Algérie"
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        {/* Situation particulière */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Situation particulière
          </label>
          <select {...register('metadata.oqtf.situationParticuliere')} className="w-full px-4 py-2 border rounded-lg">
            <option value="">-- Aucune --</option>
            <option value="enfants_scolarises">Enfants scolarisés en France</option>
            <option value="conjoint_francais">Conjoint français</option>
            <option value="probleme_sante">Problème de santé grave</option>
            <option value="risque_pays_origine">Risques dans pays d'origine</option>
            <option value="anciennete_france">Ancienneté importante en France</option>
          </select>
        </div>

        {/* Contexte et observations */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contexte et observations importantes
          </label>
          <textarea
            {...register('metadata.oqtf.contexte')}
            rows={4}
            placeholder="Décrivez le contexte: contrôle d'identité, interpellation, convocation préfecture, etc."
            className="w-full px-4 py-3 border rounded-lg"
          />
        </div>
      </div>

      {/* Aide contextuelle */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Délais de recours critiques :</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
              <li><strong>48 heures</strong> : Référé-liberté devant le juge administratif (OQTF sans délai)</li>
              <li><strong>48 heures</strong> : Référé-suspension (OQTF sans délai)</li>
              <li><strong>30 jours</strong> : Recours gracieux auprès de la préfecture</li>
              <li><strong>2 mois</strong> : Recours contentieux devant le Tribunal Administratif</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

// ===== FORMULAIRE ASILE =====
function FormulaireAsile() {
  const { register, watch, formState: { errors } } = useFormContext()
  const typeAsile = watch('metadata.asile.typeDemande')

  return (
    <div className="space-y-6 bg-orange-50 border border-orange-200 rounded-lg p-6">
      <div className="flex items-start gap-3">
        <Shield className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
        <div>
          <h3 className="text-xl font-bold text-orange-900 mb-1">Demande d'Asile</h3>
          <p className="text-sm text-orange-700">Protection internationale - Statut de réfugié ou protection subsidiaire</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Type de demande */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type de demande <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-white">
              <input
                type="radio"
                value="premiere_demande"
                {...register('metadata.asile.typeDemande')}
                className="mr-3"
              />
              <div>
                <div className="font-medium">Première demande d'asile</div>
                <div className="text-xs text-gray-600">Procédure normale ou accélérée devant l'OFPRA</div>
              </div>
            </label>
            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-white">
              <input
                type="radio"
                value="reexamen"
                {...register('metadata.asile.typeDemande')}
                className="mr-3"
              />
              <div>
                <div className="font-medium">Demande de réexamen</div>
                <div className="text-xs text-gray-600">Nouvelle demande après rejet ou élément nouveau</div>
              </div>
            </label>
            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-white">
              <input
                type="radio"
                value="recours_cnda"
                {...register('metadata.asile.typeDemande')}
                className="mr-3"
              />
              <div>
                <div className="font-medium">Recours devant la CNDA</div>
                <div className="text-xs text-gray-600">Suite à un rejet de l'OFPRA</div>
              </div>
            </label>
          </div>
        </div>

        {/* Date de la demande */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date d'enregistrement OFPRA
          </label>
          <input
            type="date"
            {...register('metadata.asile.dateEnregistrement')}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        {/* Numéro de dossier OFPRA */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Numéro de dossier OFPRA
          </label>
          <input
            type="text"
            {...register('metadata.asile.numeroOfpra')}
            placeholder="Ex: 23001234"
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        {/* Pays d'origine */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pays d'origine <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('metadata.asile.paysOrigine')}
            placeholder="Ex: Syrie"
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        {/* Date de fuite */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date de départ du pays d'origine
          </label>
          <input
            type="date"
            {...register('metadata.asile.dateFuite')}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        {/* Procédure */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Procédure applicable
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="normale"
                {...register('metadata.asile.procedure')}
              />
              <span>Procédure normale (6 mois)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="acceleree"
                {...register('metadata.asile.procedure')}
              />
              <span>Procédure accélérée (15 jours + 5 mois CNDA)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="dublin"
                {...register('metadata.asile.procedure')}
              />
              <span>Procédure Dublin (demande dans un autre pays UE)</span>
            </label>
          </div>
        </div>

        {/* Motifs de persécution */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Motifs de persécution (plusieurs choix possibles)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register('metadata.asile.motifs.politique')} />
              <span className="text-sm">Opinions politiques</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register('metadata.asile.motifs.religion')} />
              <span className="text-sm">Religion</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register('metadata.asile.motifs.race')} />
              <span className="text-sm">Race / Ethnie</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register('metadata.asile.motifs.nationalite')} />
              <span className="text-sm">Nationalité</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register('metadata.asile.motifs.groupe_social')} />
              <span className="text-sm">Appartenance à un groupe social</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register('metadata.asile.motifs.orientation_sexuelle')} />
              <span className="text-sm">Orientation sexuelle / Identité de genre</span>
            </label>
          </div>
        </div>

        {/* Récit synthétique */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Résumé du récit (synopsis)
          </label>
          <textarea
            {...register('metadata.asile.recitSynthetique')}
            rows={5}
            placeholder="Résumé chronologique des faits de persécution et raisons de la fuite..."
            className="w-full px-4 py-3 border rounded-lg"
          />
          <p className="text-xs text-gray-600 mt-1">Sera complété par le récit détaillé en pièce jointe</p>
        </div>

        {/* Hébergement actuel */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type d'hébergement actuel
          </label>
          <select {...register('metadata.asile.hebergement')} className="w-full px-4 py-2 border rounded-lg">
            <option value="">-- Sélectionner --</option>
            <option value="cada">CADA (Centre d'Accueil pour Demandeurs d'Asile)</option>
            <option value="huda">HUDA (Hébergement d'Urgence pour Demandeurs d'Asile)</option>
            <option value="hotel">Hôtel (dispositif préfectoral)</option>
            <option value="famille">Chez famille ou amis</option>
            <option value="rue">Sans hébergement stable</option>
            <option value="autre">Autre</option>
          </select>
        </div>

        {/* Attestation de demande d'asile */}
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register('metadata.asile.attestationDemande')}
            />
            <span className="text-sm font-medium">Possession de l'attestation de demande d'asile</span>
          </label>
          <p className="text-xs text-gray-600 mt-1">Document remis par la préfecture autorisant le séjour</p>
        </div>
      </div>

      {/* Aide contextuelle */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Étapes de la procédure d'asile :</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-800">
              <li>Enregistrement en préfecture (guichet unique)</li>
              <li>Dépôt du dossier à l'OFPRA (récit + documents)</li>
              <li>Convocation à l'entretien OFPRA</li>
              <li>Décision OFPRA (acceptation ou rejet)</li>
              <li>Si rejet : Recours CNDA dans 1 mois</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}

// ===== FORMULAIRE TITRE DE SÉJOUR =====
function FormulaireTitreSejour() {
  const { register, watch } = useFormContext()
  const fondement = watch('metadata.titreSejour.fondement')

  return (
    <div className="space-y-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div className="flex items-start gap-3">
        <FileText className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
        <div>
          <h3 className="text-xl font-bold text-blue-900 mb-1">Titre de Séjour</h3>
          <p className="text-sm text-blue-700">Demande ou renouvellement de titre de séjour</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nature de la demande */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nature de la demande <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-white">
              <input
                type="radio"
                value="premiere_demande"
                {...register('metadata.titreSejour.natureDemande')}
                className="mr-3"
              />
              <span className="font-medium">Première demande de titre de séjour</span>
            </label>
            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-white">
              <input
                type="radio"
                value="renouvellement"
                {...register('metadata.titreSejour.natureDemande')}
                className="mr-3"
              />
              <span className="font-medium">Renouvellement de titre de séjour</span>
            </label>
            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-white">
              <input
                type="radio"
                value="changement_statut"
                {...register('metadata.titreSejour.natureDemande')}
                className="mr-3"
              />
              <span className="font-medium">Changement de statut</span>
            </label>
          </div>
        </div>

        {/* Fondement juridique */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fondement juridique (article CESEDA) <span className="text-red-500">*</span>
          </label>
          <select {...register('metadata.titreSejour.fondement')} className="w-full px-4 py-2 border rounded-lg">
            <option value="">-- Sélectionner --</option>
            <optgroup label="Vie privée et familiale">
              <option value="L423-23">L.423-23 - Conjoint de Français</option>
              <option value="L423-1">L.423-1 - Parent d'enfant français</option>
              <option value="L435-1">L.435-1 - Vie privée et familiale (10 ans en France)</option>
              <option value="L425-9">L.425-9 - Jeune majeur entré mineur</option>
            </optgroup>
            <optgroup label="Travail">
              <option value="L421-1">L.421-1 - Salarié</option>
              <option value="L421-5">L.421-5 - Travailleur temporaire</option>
              <option value="L421-10">L.421-10 - Entrepreneur / Profession libérale</option>
            </optgroup>
            <optgroup label="Études">
              <option value="L422-1">L.422-1 - Étudiant</option>
              <option value="L422-10">L.422-10 - Stagiaire</option>
            </optgroup>
            <optgroup label="Santé">
              <option value="L425-10">L.425-10 - Étranger malade</option>
            </optgroup>
            <optgroup label="Autres">
              <option value="L426-1">L.426-1 - Visiteur</option>
              <option value="autre">Autre fondement</option>
            </optgroup>
          </select>
        </div>

        {/* Titre actuel (si renouvellement) */}
        {watch('metadata.titreSejour.natureDemande') === 'renouvellement' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date d'expiration du titre actuel <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register('metadata.titreSejour.dateExpiration')}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <p className="text-xs text-gray-600 mt-1">Déposer la demande 2 mois avant l'expiration</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numéro du titre actuel
              </label>
              <input
                type="text"
                {...register('metadata.titreSejour.numeroTitreActuel')}
                placeholder="Ex: 2023123456789"
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </>
        )}

        {/* Situation professionnelle (si fondement travail) */}
        {fondement?.startsWith('L421') && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de contrat <span className="text-red-500">*</span>
              </label>
              <select {...register('metadata.titreSejour.typeContrat')} className="w-full px-4 py-2 border rounded-lg">
                <option value="">-- Sélectionner --</option>
                <option value="cdi">CDI (Contrat à Durée Indéterminée)</option>
                <option value="cdd">CDD (Contrat à Durée Déterminée)</option>
                <option value="interim">Intérim</option>
                <option value="promesse_embauche">Promesse d'embauche</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Salaire brut mensuel (€)
              </label>
              <input
                type="number"
                {...register('metadata.titreSejour.salaireMensuel')}
                placeholder="Ex: 2500"
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de l'employeur
              </label>
              <input
                type="text"
                {...register('metadata.titreSejour.nomEmployeur')}
                placeholder="Ex: SARL Dupont et Fils"
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </>
        )}

        {/* Établissement (si étudiant) */}
        {fondement === 'L422-1' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Établissement d'enseignement <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('metadata.titreSejour.etablissement')}
                placeholder="Ex: Université Paris-Sorbonne"
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Niveau d'études
              </label>
              <select {...register('metadata.titreSejour.niveauEtudes')} className="w-full px-4 py-2 border rounded-lg">
                <option value="">-- Sélectionner --</option>
                <option value="licence">Licence (L1, L2, L3)</option>
                <option value="master">Master (M1, M2)</option>
                <option value="doctorat">Doctorat</option>
                <option value="autre">Autre formation</option>
              </select>
            </div>
          </>
        )}

        {/* Lien familial (si vie privée et familiale) */}
        {(fondement === 'L423-23' || fondement === 'L423-1') && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Identité du membre de famille français
              </label>
              <input
                type="text"
                {...register('metadata.titreSejour.membreFamille')}
                placeholder="Ex: Marie DUPONT"
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date du mariage / PACS / naissance
              </label>
              <input
                type="date"
                {...register('metadata.titreSejour.dateEvenement')}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </>
        )}

        {/* Préfecture de dépôt */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Préfecture de dépôt <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('metadata.titreSejour.prefecture')}
            placeholder="Ex: Préfecture de Paris"
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        {/* Date de rendez-vous */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date du rendez-vous en préfecture
          </label>
          <input
            type="date"
            {...register('metadata.titreSejour.dateRendezVous')}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        {/* Récépissé */}
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register('metadata.titreSejour.recepisse')}
            />
            <span className="text-sm font-medium">Récépissé déjà obtenu</span>
          </label>
          <p className="text-xs text-gray-600 mt-1">Récépissé de dépôt de demande</p>
        </div>
      </div>

      {/* Aide contextuelle */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Documents généralement requis :</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
              <li>Passeport en cours de validité</li>
              <li>3 photos d'identité récentes</li>
              <li>Justificatif de domicile de moins de 3 mois</li>
              <li>Titre de séjour actuel (si renouvellement)</li>
              <li>Documents justifiant le fondement (contrat de travail, mariage, etc.)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

// ===== FORMULAIRE NATURALISATION =====
function FormulaireNaturalisation() {
  const { register, watch } = useFormContext()

  return (
    <div className="space-y-6 bg-indigo-50 border border-indigo-200 rounded-lg p-6">
      <div className="flex items-start gap-3">
        <div className="text-3xl">🇫🇷</div>
        <div>
          <h3 className="text-xl font-bold text-indigo-900 mb-1">Naturalisation Française</h3>
          <p className="text-sm text-indigo-700">Acquisition de la nationalité française par décret ou déclaration</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mode d'acquisition */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mode d'acquisition <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-white">
              <input
                type="radio"
                value="decret"
                {...register('metadata.naturalisation.mode')}
                className="mr-3"
              />
              <div>
                <div className="font-medium">Naturalisation par décret</div>
                <div className="text-xs text-gray-600">Procédure standard (5 ans de résidence)</div>
              </div>
            </label>
            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-white">
              <input
                type="radio"
                value="mariage"
                {...register('metadata.naturalisation.mode')}
                className="mr-3"
              />
              <div>
                <div className="font-medium">Déclaration par mariage avec un Français</div>
                <div className="text-xs text-gray-600">4 ans de mariage + communauté de vie</div>
              </div>
            </label>
            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-white">
              <input
                type="radio"
                value="ascendant"
                {...register('metadata.naturalisation.mode')}
                className="mr-3"
              />
              <div>
                <div className="font-medium">Parent d'enfant français</div>
                <div className="text-xs text-gray-600">Condition de résidence réduite</div>
              </div>
            </label>
          </div>
        </div>

        {/* Durée de résidence en France */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date d'arrivée en France <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            {...register('metadata.naturalisation.dateArrivee')}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Années de résidence en France
          </label>
          <input
            type="number"
            {...register('metadata.naturalisation.anneesResidence')}
            placeholder="Ex: 5"
            className="w-full px-4 py-2 border rounded-lg"
            min="0"
          />
          <p className="text-xs text-gray-600 mt-1">Minimum 5 ans (sauf exceptions)</p>
        </div>

        {/* Titres de séjour */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Titres de séjour détenus (historique)
          </label>
          <textarea
            {...register('metadata.naturalisation.titresSejour')}
            rows={3}
            placeholder="Ex: 2018-2019: Étudiant, 2019-2024: Salarié, 2024-2029: Résident 10 ans"
            className="w-full px-4 py-3 border rounded-lg"
          />
        </div>

        {/* Niveau de français */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Niveau de français certifié <span className="text-red-500">*</span>
          </label>
          <select {...register('metadata.naturalisation.niveauFrancais')} className="w-full px-4 py-2 border rounded-lg">
            <option value="">-- Sélectionner --</option>
            <option value="B1_oral">B1 oral minimum (requis)</option>
            <option value="B2">B2 (recommandé)</option>
            <option value="C1">C1</option>
            <option value="C2">C2</option>
            <option value="diplome_francais">Diplôme obtenu en français</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Organisme de certification
          </label>
          <input
            type="text"
            {...register('metadata.naturalisation.organismeCertif')}
            placeholder="Ex: TCF, DELF, DALF"
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        {/* Situation professionnelle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Situation professionnelle actuelle <span className="text-red-500">*</span>
          </label>
          <select {...register('metadata.naturalisation.situationPro')} className="w-full px-4 py-2 border rounded-lg">
            <option value="">-- Sélectionner --</option>
            <option value="cdi">Salarié en CDI</option>
            <option value="cdd">Salarié en CDD</option>
            <option value="independant">Travailleur indépendant</option>
            <option value="fonctionnaire">Fonctionnaire</option>
            <option value="chomage">En recherche d'emploi</option>
            <option value="retraite">Retraité</option>
            <option value="etudiant">Étudiant</option>
            <option value="autre">Autre</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Revenus annuels (€)
          </label>
          <input
            type="number"
            {...register('metadata.naturalisation.revenusAnnuels')}
            placeholder="Ex: 30000"
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        {/* Casier judiciaire */}
        <div className="md:col-span-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register('metadata.naturalisation.casierVierge')}
            />
            <span className="text-sm font-medium">Casier judiciaire vierge (bulletin n°3)</span>
          </label>
          <p className="text-xs text-gray-600 mt-1">Requis pour la naturalisation</p>
        </div>

        {/* Assimilation */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Éléments d'assimilation à la communauté française
          </label>
          <textarea
            {...register('metadata.naturalisation.assimilation')}
            rows={4}
            placeholder="Ex: Engagement associatif, activité professionnelle, liens familiaux, formation suivie en France..."
            className="w-full px-4 py-3 border rounded-lg"
          />
        </div>

        {/* Préfecture de dépôt */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Préfecture de dépôt <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('metadata.naturalisation.prefecture')}
            placeholder="Ex: Préfecture de Paris"
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date de dépôt du dossier
          </label>
          <input
            type="date"
            {...register('metadata.naturalisation.dateDepot')}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        {/* Entretien */}
        <div className="md:col-span-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register('metadata.naturalisation.entretienPasse')}
            />
            <span className="text-sm font-medium">Entretien d'assimilation déjà passé</span>
          </label>
        </div>

        {watch('metadata.naturalisation.entretienPasse') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de l'entretien
            </label>
            <input
              type="date"
              {...register('metadata.naturalisation.dateEntretien')}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
        )}
      </div>

      {/* Aide contextuelle */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Conditions principales de naturalisation :</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
              <li><strong>Résidence</strong> : 5 ans minimum en France (sauf exceptions)</li>
              <li><strong>Langue</strong> : Niveau B1 oral minimum certifié</li>
              <li><strong>Ressources</strong> : Ressources stables et suffisantes</li>
              <li><strong>Assimilation</strong> : Connaissance de l'histoire, culture et société françaises</li>
              <li><strong>Moralité</strong> : Casier judiciaire vierge</li>
              <li><strong>Délai</strong> : Instruction 12 à 18 mois</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

// ===== FORMULAIRE REGROUPEMENT FAMILIAL =====
function FormulaireRegroupementFamilial() {
  const { register, watch } = useFormContext()

  return (
    <div className="space-y-6 bg-green-50 border border-green-200 rounded-lg p-6">
      <div className="flex items-start gap-3">
        <Users className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
        <div>
          <h3 className="text-xl font-bold text-green-900 mb-1">Regroupement Familial</h3>
          <p className="text-sm text-green-700">Faire venir conjoint et/ou enfants en France</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Membres de la famille */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Membres concernés par le regroupement <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register('metadata.regroupement.conjoint')} />
              <span>Conjoint (marié ou pacsé)</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register('metadata.regroupement.enfants')} />
              <span>Enfants mineurs (moins de 18 ans)</span>
            </label>
          </div>
        </div>

        {watch('metadata.regroupement.enfants') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre d'enfants concernés
            </label>
            <input
              type="number"
              {...register('metadata.regroupement.nombreEnfants')}
              min="0"
              max="10"
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
        )}

        {/* Situation du demandeur */}
        <div className="md:col-span-2">
          <h4 className="font-semibold text-gray-800 mb-3">Situation du demandeur (en France)</h4>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Durée de résidence régulière en France <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            {...register('metadata.regroupement.dureeResidence')}
            placeholder="En mois (minimum 18 mois)"
            className="w-full px-4 py-2 border rounded-lg"
          />
          <p className="text-xs text-gray-600 mt-1">Minimum 18 mois de résidence régulière</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type de titre de séjour actuel
          </label>
          <input
            type="text"
            {...register('metadata.regroupement.titreSejour')}
            placeholder="Ex: Carte de résident 10 ans"
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        {/* Ressources */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Revenus mensuels nets (€) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            {...register('metadata.regroupement.revenusMensuels')}
            placeholder="Minimum SMIC requis"
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type d'emploi
          </label>
          <select {...register('metadata.regroupement.typeEmploi')} className="w-full px-4 py-2 border rounded-lg">
            <option value="">-- Sélectionner --</option>
            <option value="cdi">CDI</option>
            <option value="cdd_long">CDD longue durée (+ 1 an)</option>
            <option value="independant">Travailleur indépendant</option>
            <option value="retraite">Pension de retraite</option>
          </select>
        </div>

        {/* Logement */}
        <div className="md:col-span-2">
          <h4 className="font-semibold text-gray-800 mb-3">Conditions de logement</h4>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type de logement <span className="text-red-500">*</span>
          </label>
          <select {...register('metadata.regroupement.typeLogement')} className="w-full px-4 py-2 border rounded-lg">
            <option value="">-- Sélectionner --</option>
            <option value="proprietaire">Propriétaire</option>
            <option value="locataire">Locataire</option>
            <option value="heberge">Hébergé</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Surface habitable (m²) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            {...register('metadata.regroupement.surfaceLogement')}
            placeholder="Ex: 50"
            className="w-full px-4 py-2 border rounded-lg"
          />
          <p className="text-xs text-gray-600 mt-1">Surface minimale requise selon composition familiale</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre de pièces
          </label>
          <input
            type="number"
            {...register('metadata.regroupement.nombrePieces')}
            min="1"
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register('metadata.regroupement.logementDecent')}
            />
            <span className="text-sm font-medium">Logement décent et conforme (normes sanitaires)</span>
          </label>
        </div>

        {/* Visite du logement */}
        <div className="md:col-span-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register('metadata.regroupement.visiteEffectuee')}
            />
            <span className="text-sm font-medium">Visite du logement par l'OFII déjà effectuée</span>
          </label>
        </div>

        {watch('metadata.regroupement.visiteEffectuee') && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de la visite OFII
              </label>
              <input
                type="date"
                {...register('metadata.regroupement.dateVisite')}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Résultat de la visite
              </label>
              <select {...register('metadata.regroupement.resultatVisite')} className="w-full px-4 py-2 border rounded-lg">
                <option value="">-- Sélectionner --</option>
                <option value="favorable">Avis favorable</option>
                <option value="reserve">Avis avec réserves</option>
                <option value="defavorable">Avis défavorable</option>
              </select>
            </div>
          </>
        )}

        {/* Préfecture */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Préfecture de dépôt <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('metadata.regroupement.prefecture')}
            placeholder="Ex: Préfecture de Seine-et-Marne"
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date de dépôt de la demande
          </label>
          <input
            type="date"
            {...register('metadata.regroupement.dateDepot')}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        {/* Observations */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Observations particulières
          </label>
          <textarea
            {...register('metadata.regroupement.observations')}
            rows={3}
            placeholder="Ex: Situation d'urgence, problème de santé d'un membre de la famille, etc."
            className="w-full px-4 py-3 border rounded-lg"
          />
        </div>
      </div>

      {/* Aide contextuelle */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Conditions du regroupement familial :</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
              <li><strong>Résidence</strong> : 18 mois minimum de résidence régulière en France</li>
              <li><strong>Ressources</strong> : Revenus ≥ SMIC (stables et réguliers)</li>
              <li><strong>Logement</strong> : Surface minimale selon composition familiale + visite OFII</li>
              <li><strong>Délai</strong> : Instruction 6 mois environ + visite logement</li>
              <li><strong>Famille</strong> : Conjoint + enfants mineurs (sauf exceptions)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
