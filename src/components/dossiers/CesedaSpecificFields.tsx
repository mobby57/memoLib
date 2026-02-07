'use client'

/**
 * Champs specifiques par type de dossier CESEDA
 * - Formulaires dynamiques selon le type selectionne
 * - Validation contextuelle
 * - Aide et documentation integrees
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
          <p className="text-sm text-red-700">Obligation de Quitter le Territoire Francais - Dossier critique</p>
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
                <div className="font-medium">OQTF sans delai de depart volontaire</div>
                <div className="text-xs text-gray-600">Refere-liberte dans les 48h</div>
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
                <div className="font-medium">OQTF avec delai de depart volontaire (30 jours)</div>
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
          <p className="text-xs text-gray-600 mt-1">Date de remise de l'arrete OQTF</p>
        </div>

        {/* Mode de notification */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mode de notification <span className="text-red-500">*</span>
          </label>
          <select {...register('metadata.oqtf.modeNotification')} className="w-full px-4 py-2 border rounded-lg">
            <option value="">-- Selectionner --</option>
            <option value="main_propre">Remise en main propre</option>
            <option value="courrier">Courrier recommande</option>
            <option value="prefecture">Notification en prefecture</option>
            <option value="domicile">Notification au domicile</option>
          </select>
        </div>

        {/* Numero de l'arrete */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Numero de l'arrete prefectoral
          </label>
          <input
            type="text"
            {...register('metadata.oqtf.numeroArrete')}
            placeholder="Ex: 2026-PREF-001234"
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        {/* Prefecture emettrice */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prefecture emettrice <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('metadata.oqtf.prefecture')}
            placeholder="Ex: Prefecture du Val-de-Marne"
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
            <span className="text-sm font-medium">Interdiction de retour sur le territoire francais (IRTF)</span>
          </label>
        </div>

        {watch('metadata.oqtf.interdictionRetour') && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duree de l'interdiction
              </label>
              <select {...register('metadata.oqtf.dureeInterdiction')} className="w-full px-4 py-2 border rounded-lg">
                <option value="">-- Selectionner --</option>
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
                placeholder="Ex: Sejour irregulier"
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </>
        )}

        {/* Pays de destination */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pays de destination prevu
          </label>
          <input
            type="text"
            {...register('metadata.oqtf.paysDestination')}
            placeholder="Ex: Algerie"
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        {/* Situation particuliere */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Situation particuliere
          </label>
          <select {...register('metadata.oqtf.situationParticuliere')} className="w-full px-4 py-2 border rounded-lg">
            <option value="">-- Aucune --</option>
            <option value="enfants_scolarises">Enfants scolarises en France</option>
            <option value="conjoint_francais">Conjoint francais</option>
            <option value="probleme_sante">Probleme de sante grave</option>
            <option value="risque_pays_origine">Risques dans pays d'origine</option>
            <option value="anciennete_france">Anciennete importante en France</option>
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
            placeholder="Decrivez le contexte: controle d'identite, interpellation, convocation prefecture, etc."
            className="w-full px-4 py-3 border rounded-lg"
          />
        </div>
      </div>

      {/* Aide contextuelle */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Delais de recours critiques :</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
              <li><strong>48 heures</strong> : Refere-liberte devant le juge administratif (OQTF sans delai)</li>
              <li><strong>48 heures</strong> : Refere-suspension (OQTF sans delai)</li>
              <li><strong>30 jours</strong> : Recours gracieux aupres de la prefecture</li>
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
          <p className="text-sm text-orange-700">Protection internationale - Statut de refugie ou protection subsidiaire</p>
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
                <div className="font-medium">Premiere demande d'asile</div>
                <div className="text-xs text-gray-600">Procedure normale ou acceleree devant l'OFPRA</div>
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
                <div className="font-medium">Demande de reexamen</div>
                <div className="text-xs text-gray-600">Nouvelle demande apres rejet ou element nouveau</div>
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
                <div className="text-xs text-gray-600">Suite a un rejet de l'OFPRA</div>
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

        {/* Numero de dossier OFPRA */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Numero de dossier OFPRA
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
            Date de depart du pays d'origine
          </label>
          <input
            type="date"
            {...register('metadata.asile.dateFuite')}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        {/* Procedure */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Procedure applicable
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="normale"
                {...register('metadata.asile.procedure')}
              />
              <span>Procedure normale (6 mois)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="acceleree"
                {...register('metadata.asile.procedure')}
              />
              <span>Procedure acceleree (15 jours + 5 mois CNDA)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="dublin"
                {...register('metadata.asile.procedure')}
              />
              <span>Procedure Dublin (demande dans un autre pays UE)</span>
            </label>
          </div>
        </div>

        {/* Motifs de persecution */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Motifs de persecution (plusieurs choix possibles)
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
              <span className="text-sm">Nationalite</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register('metadata.asile.motifs.groupe_social')} />
              <span className="text-sm">Appartenance a un groupe social</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register('metadata.asile.motifs.orientation_sexuelle')} />
              <span className="text-sm">Orientation sexuelle / Identite de genre</span>
            </label>
          </div>
        </div>

        {/* Recit synthetique */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Resume du recit (synopsis)
          </label>
          <textarea
            {...register('metadata.asile.recitSynthetique')}
            rows={5}
            placeholder="Resume chronologique des faits de persecution et raisons de la fuite..."
            className="w-full px-4 py-3 border rounded-lg"
          />
          <p className="text-xs text-gray-600 mt-1">Sera complete par le recit detaille en piece jointe</p>
        </div>

        {/* Hebergement actuel */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type d'hebergement actuel
          </label>
          <select {...register('metadata.asile.hebergement')} className="w-full px-4 py-2 border rounded-lg">
            <option value="">-- Selectionner --</option>
            <option value="cada">CADA (Centre d'Accueil pour Demandeurs d'Asile)</option>
            <option value="huda">HUDA (Hebergement d'Urgence pour Demandeurs d'Asile)</option>
            <option value="hotel">Hotel (dispositif prefectoral)</option>
            <option value="famille">Chez famille ou amis</option>
            <option value="rue">Sans hebergement stable</option>
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
          <p className="text-xs text-gray-600 mt-1">Document remis par la prefecture autorisant le sejour</p>
        </div>
      </div>

      {/* Aide contextuelle */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">etapes de la procedure d'asile :</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-800">
              <li>Enregistrement en prefecture (guichet unique)</li>
              <li>Depot du dossier a l'OFPRA (recit + documents)</li>
              <li>Convocation a l'entretien OFPRA</li>
              <li>Decision OFPRA (acceptation ou rejet)</li>
              <li>Si rejet : Recours CNDA dans 1 mois</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}

// ===== FORMULAIRE TITRE DE SeJOUR =====
function FormulaireTitreSejour() {
  const { register, watch } = useFormContext()
  const fondement = watch('metadata.titreSejour.fondement')

  return (
    <div className="space-y-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div className="flex items-start gap-3">
        <FileText className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
        <div>
          <h3 className="text-xl font-bold text-blue-900 mb-1">Titre de Sejour</h3>
          <p className="text-sm text-blue-700">Demande ou renouvellement de titre de sejour</p>
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
              <span className="font-medium">Premiere demande de titre de sejour</span>
            </label>
            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-white">
              <input
                type="radio"
                value="renouvellement"
                {...register('metadata.titreSejour.natureDemande')}
                className="mr-3"
              />
              <span className="font-medium">Renouvellement de titre de sejour</span>
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
            <option value="">-- Selectionner --</option>
            <optgroup label="Vie privee et familiale">
              <option value="L423-23">L.423-23 - Conjoint de Francais</option>
              <option value="L423-1">L.423-1 - Parent d'enfant francais</option>
              <option value="L435-1">L.435-1 - Vie privee et familiale (10 ans en France)</option>
              <option value="L425-9">L.425-9 - Jeune majeur entre mineur</option>
            </optgroup>
            <optgroup label="Travail">
              <option value="L421-1">L.421-1 - Salarie</option>
              <option value="L421-5">L.421-5 - Travailleur temporaire</option>
              <option value="L421-10">L.421-10 - Entrepreneur / Profession liberale</option>
            </optgroup>
            <optgroup label="etudes">
              <option value="L422-1">L.422-1 - etudiant</option>
              <option value="L422-10">L.422-10 - Stagiaire</option>
            </optgroup>
            <optgroup label="Sante">
              <option value="L425-10">L.425-10 - etranger malade</option>
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
              <p className="text-xs text-gray-600 mt-1">Deposer la demande 2 mois avant l'expiration</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numero du titre actuel
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
                <option value="">-- Selectionner --</option>
                <option value="cdi">CDI (Contrat a Duree Indeterminee)</option>
                <option value="cdd">CDD (Contrat a Duree Determinee)</option>
                <option value="interim">Interim</option>
                <option value="promesse_embauche">Promesse d'embauche</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Salaire brut mensuel (�)
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

        {/* etablissement (si etudiant) */}
        {fondement === 'L422-1' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                etablissement d'enseignement <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('metadata.titreSejour.etablissement')}
                placeholder="Ex: Universite Paris-Sorbonne"
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Niveau d'etudes
              </label>
              <select {...register('metadata.titreSejour.niveauEtudes')} className="w-full px-4 py-2 border rounded-lg">
                <option value="">-- Selectionner --</option>
                <option value="licence">Licence (L1, L2, L3)</option>
                <option value="master">Master (M1, M2)</option>
                <option value="doctorat">Doctorat</option>
                <option value="autre">Autre formation</option>
              </select>
            </div>
          </>
        )}

        {/* Lien familial (si vie privee et familiale) */}
        {(fondement === 'L423-23' || fondement === 'L423-1') && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Identite du membre de famille francais
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

        {/* Prefecture de depot */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prefecture de depot <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('metadata.titreSejour.prefecture')}
            placeholder="Ex: Prefecture de Paris"
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        {/* Date de rendez-vous */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date du rendez-vous en prefecture
          </label>
          <input
            type="date"
            {...register('metadata.titreSejour.dateRendezVous')}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        {/* Recepisse */}
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register('metadata.titreSejour.recepisse')}
            />
            <span className="text-sm font-medium">Recepisse deja obtenu</span>
          </label>
          <p className="text-xs text-gray-600 mt-1">Recepisse de depot de demande</p>
        </div>
      </div>

      {/* Aide contextuelle */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Documents generalement requis :</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
              <li>Passeport en cours de validite</li>
              <li>3 photos d'identite recentes</li>
              <li>Justificatif de domicile de moins de 3 mois</li>
              <li>Titre de sejour actuel (si renouvellement)</li>
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
        <div className="text-3xl">????</div>
        <div>
          <h3 className="text-xl font-bold text-indigo-900 mb-1">Naturalisation Francaise</h3>
          <p className="text-sm text-indigo-700">Acquisition de la nationalite francaise par decret ou declaration</p>
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
                <div className="font-medium">Naturalisation par decret</div>
                <div className="text-xs text-gray-600">Procedure standard (5 ans de residence)</div>
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
                <div className="font-medium">Declaration par mariage avec un Francais</div>
                <div className="text-xs text-gray-600">4 ans de mariage + communaute de vie</div>
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
                <div className="font-medium">Parent d'enfant francais</div>
                <div className="text-xs text-gray-600">Condition de residence reduite</div>
              </div>
            </label>
          </div>
        </div>

        {/* Duree de residence en France */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date d'arrivee en France <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            {...register('metadata.naturalisation.dateArrivee')}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Annees de residence en France
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

        {/* Titres de sejour */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Titres de sejour detenus (historique)
          </label>
          <textarea
            {...register('metadata.naturalisation.titresSejour')}
            rows={3}
            placeholder="Ex: 2018-2019: etudiant, 2019-2024: Salarie, 2024-2029: Resident 10 ans"
            className="w-full px-4 py-3 border rounded-lg"
          />
        </div>

        {/* Niveau de francais */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Niveau de francais certifie <span className="text-red-500">*</span>
          </label>
          <select {...register('metadata.naturalisation.niveauFrancais')} className="w-full px-4 py-2 border rounded-lg">
            <option value="">-- Selectionner --</option>
            <option value="B1_oral">B1 oral minimum (requis)</option>
            <option value="B2">B2 (recommande)</option>
            <option value="C1">C1</option>
            <option value="C2">C2</option>
            <option value="diplome_francais">Diplome obtenu en francais</option>
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
            <option value="">-- Selectionner --</option>
            <option value="cdi">Salarie en CDI</option>
            <option value="cdd">Salarie en CDD</option>
            <option value="independant">Travailleur independant</option>
            <option value="fonctionnaire">Fonctionnaire</option>
            <option value="chomage">En recherche d'emploi</option>
            <option value="retraite">Retraite</option>
            <option value="etudiant">etudiant</option>
            <option value="autre">Autre</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Revenus annuels (�)
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
            <span className="text-sm font-medium">Casier judiciaire vierge (bulletin n deg3)</span>
          </label>
          <p className="text-xs text-gray-600 mt-1">Requis pour la naturalisation</p>
        </div>

        {/* Assimilation */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            elements d'assimilation a la communaute francaise
          </label>
          <textarea
            {...register('metadata.naturalisation.assimilation')}
            rows={4}
            placeholder="Ex: Engagement associatif, activite professionnelle, liens familiaux, formation suivie en France..."
            className="w-full px-4 py-3 border rounded-lg"
          />
        </div>

        {/* Prefecture de depot */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prefecture de depot <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('metadata.naturalisation.prefecture')}
            placeholder="Ex: Prefecture de Paris"
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date de depot du dossier
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
            <span className="text-sm font-medium">Entretien d'assimilation deja passe</span>
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
              <li><strong>Residence</strong> : 5 ans minimum en France (sauf exceptions)</li>
              <li><strong>Langue</strong> : Niveau B1 oral minimum certifie</li>
              <li><strong>Ressources</strong> : Ressources stables et suffisantes</li>
              <li><strong>Assimilation</strong> : Connaissance de l'histoire, culture et societe francaises</li>
              <li><strong>Moralite</strong> : Casier judiciaire vierge</li>
              <li><strong>Delai</strong> : Instruction 12 a 18 mois</li>
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
            Membres concernes par le regroupement <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register('metadata.regroupement.conjoint')} />
              <span>Conjoint (marie ou pacse)</span>
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
              Nombre d'enfants concernes
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
            Duree de residence reguliere en France <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            {...register('metadata.regroupement.dureeResidence')}
            placeholder="En mois (minimum 18 mois)"
            className="w-full px-4 py-2 border rounded-lg"
          />
          <p className="text-xs text-gray-600 mt-1">Minimum 18 mois de residence reguliere</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type de titre de sejour actuel
          </label>
          <input
            type="text"
            {...register('metadata.regroupement.titreSejour')}
            placeholder="Ex: Carte de resident 10 ans"
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        {/* Ressources */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Revenus mensuels nets (�) <span className="text-red-500">*</span>
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
            <option value="">-- Selectionner --</option>
            <option value="cdi">CDI</option>
            <option value="cdd_long">CDD longue duree (+ 1 an)</option>
            <option value="independant">Travailleur independant</option>
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
            <option value="">-- Selectionner --</option>
            <option value="proprietaire">Proprietaire</option>
            <option value="locataire">Locataire</option>
            <option value="heberge">Heberge</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Surface habitable (m�) <span className="text-red-500">*</span>
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
            Nombre de pieces
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
            <span className="text-sm font-medium">Logement decent et conforme (normes sanitaires)</span>
          </label>
        </div>

        {/* Visite du logement */}
        <div className="md:col-span-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register('metadata.regroupement.visiteEffectuee')}
            />
            <span className="text-sm font-medium">Visite du logement par l'OFII deja effectuee</span>
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
                Resultat de la visite
              </label>
              <select {...register('metadata.regroupement.resultatVisite')} className="w-full px-4 py-2 border rounded-lg">
                <option value="">-- Selectionner --</option>
                <option value="favorable">Avis favorable</option>
                <option value="reserve">Avis avec reserves</option>
                <option value="defavorable">Avis defavorable</option>
              </select>
            </div>
          </>
        )}

        {/* Prefecture */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prefecture de depot <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('metadata.regroupement.prefecture')}
            placeholder="Ex: Prefecture de Seine-et-Marne"
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date de depot de la demande
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
            Observations particulieres
          </label>
          <textarea
            {...register('metadata.regroupement.observations')}
            rows={3}
            placeholder="Ex: Situation d'urgence, probleme de sante d'un membre de la famille, etc."
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
              <li><strong>Residence</strong> : 18 mois minimum de residence reguliere en France</li>
              <li><strong>Ressources</strong> : Revenus = SMIC (stables et reguliers)</li>
              <li><strong>Logement</strong> : Surface minimale selon composition familiale + visite OFII</li>
              <li><strong>Delai</strong> : Instruction 6 mois environ + visite logement</li>
              <li><strong>Famille</strong> : Conjoint + enfants mineurs (sauf exceptions)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
