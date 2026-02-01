/**
 * 📧 Générateur d'Emails de Test Réalistes - Insertion Base de Données
 * Simule des vrais emails pour tester le système de classification IA
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const prisma = new PrismaClient();

// Emails de simulation ultra-réalistes
const emailTemplates = [
  // 1. NOUVEAU CLIENT - Demande OQTF
  {
    from: 'marie.dupont@gmail.com',
    to: 'cabinet@avocat.fr',
    subject: 'URGENT - Notification OQTF reçue ce matin',
    bodyText: `Bonjour Maître,

Je me permets de vous contacter suite à une recommandation de Monsieur Karim Ben Ahmed.

J'ai reçu ce matin une notification d'OQTF (Obligation de Quitter le Territoire Français) de la Préfecture de Paris. Je suis complètement perdue et je ne sais pas quoi faire.

Voici ma situation :
- Arrivée en France en 2018 avec un visa touristique
- Demande de titre de séjour déposée en 2019 (motif vie privée et familiale)
- Refus reçu en 2020 avec OQTF sans délai
- Mon mari est français et nous avons deux enfants nés en France (3 ans et 5 ans)

La notification indique que j'ai 48 heures pour quitter le territoire. Je suis terrorisée à l'idée d'être séparée de mes enfants.

Pouvez-vous me recevoir en urgence pour étudier mon dossier ? Je suis disponible tous les jours.

En attente de votre retour rapide,
Cordialement,
Marie DUPONT
Tél : 06 12 34 56 78`,
    classification: 'ceseda',
    priority: 'critical',
  },
  
  // 2. LA POSTE - Notification de suivi
  {
    from: 'noreply@laposte.fr',
    to: 'cabinet@avocat.fr',
    subject: 'Votre colis 3Y00123456789FR a été livré',
    bodyText: `Bonjour,

Nous vous informons que votre envoi recommandé avec accusé de réception a été distribué avec succès.

Numéro de suivi : 3Y00123456789FR
Date de livré : 07/01/2026 à 10:32
Destinataire : Préfecture de Paris - Service des Étrangers
Adresse : 5 rue Leblanc, 75015 Paris

Vous pouvez consulter le détail de votre envoi sur laposte.fr/suivi

Cordialement,
La Poste`,
    classification: 'laposte_notification',
    priority: 'high',
  },
  
  // 3. NOUVEAU CLIENT - Demande de naturalisation
  {
    from: 'ahmed.benali@yahoo.fr',
    to: 'cabinet@avocat.fr',
    subject: 'Demande de renseignements - Naturalisation française',
    bodyText: `Bonjour,

Je souhaiterais avoir des informations sur la procédure de naturalisation française.

Ma situation :
- Résident en France depuis 7 ans
- Titulaire d'une carte de résident 10 ans
- Marié à une française depuis 5 ans
- Deux enfants français
- CDI dans une entreprise depuis 4 ans
- Aucun antécédent judiciaire

Je souhaiterais connaître :
1. Mes chances d'obtenir la nationalité
2. Les documents à préparer
3. La durée de la procédure
4. Vos honoraires

Pouvez-vous me proposer un rendez-vous pour discuter de mon projet ?

Merci d'avance,
Ahmed BENALI
06 23 45 67 89`,
    classification: 'nouveau_client',
    priority: 'medium',
  },
  
  // 4. RÉPONSE CLIENT EXISTANT
  {
    from: 'karim.mohamed@hotmail.com',
    to: 'cabinet@avocat.fr',
    subject: 'Re: Votre dossier D-2026-001 - Documents complémentaires',
    bodyText: `Bonjour Maître,

Suite à votre email du 5 janvier, je vous transmets les documents demandés :

- Justificatif de domicile (facture EDF du mois de décembre)
- Bulletins de salaire des 3 derniers mois
- Attestation de mon employeur
- Acte de naissance de mes enfants

Je reste à votre disposition pour tout complément d'information.

J'ai aussi une question : faut-il que je prenne rendez-vous à la préfecture maintenant ou attendez-vous de recevoir la réponse au recours ?

Merci pour votre aide précieuse,
Cordialement,
Karim MOHAMED`,
    classification: 'reponse_client',
    priority: 'medium',
  },
  
  // 5. URGENT - Convocation audience
  {
    from: 'ta-paris@justice.fr',
    to: 'cabinet@avocat.fr',
    subject: 'Convocation audience - N° RG 2545678/2025',
    bodyText: `Tribunal Administratif de Paris

CONVOCATION À AUDIENCE

Affaire n° RG 2545678/2025
Requérant : M. Youssef EL AMRANI
Contre : Préfecture de Seine-Saint-Denis

Date de l'audience : 15 janvier 2026 à 14h00
Salle : Chambre 3, Bâtiment B
Rapporteur public : Mme BERNARD

La présence du requérant est obligatoire.

Merci de confirmer votre présence avant le 10 janvier 2026.

Le Greffe`,
    classification: 'urgent',
    priority: 'critical',
  },
  
  // 6. SPAM - Publicité
  {
    from: 'promo@formations-juridiques.com',
    to: 'cabinet@avocat.fr',
    subject: '🎓 Formation Droit des Étrangers - 30% de réduction',
    bodyText: `Cher Confrère,

Profitez de notre offre exceptionnelle !

Formation "Maîtriser le contentieux OQTF" - 2 jours
Prix normal : 1200€ HT
VOTRE PRIX : 840€ HT (-30%)

Programme :
- Les nouveautés législatives 2026
- Stratégies de recours efficaces
- Cas pratiques

Inscrivez-vous avant le 15 janvier !
www.formations-juridiques.com/promo

L'équipe Formations Juridiques`,
    classification: 'spam',
    priority: 'low',
  },
  
  // 7. CLIENT - Question simple
  {
    from: 'fatima.zahra@gmail.com',
    to: 'cabinet@avocat.fr',
    subject: 'Question sur mon récépissé',
    bodyText: `Bonjour Maître,

Mon récépissé expire le 20 janvier. Est-ce que je dois prendre rendez-vous à la préfecture maintenant ou je peux attendre ?

J'ai peur de perdre mon autorisation de travail.

Merci,
Fatima`,
    classification: 'reponse_client',
    priority: 'high',
  },
  
  // 8. NOUVEAU CLIENT - Regroupement familial
  {
    from: 'mohamed.hassan@outlook.com',
    to: 'cabinet@avocat.fr',
    subject: 'Demande de regroupement familial - Procédure',
    bodyText: `Bonjour,

Je suis en France depuis 3 ans avec un titre de séjour "salarié" valable jusqu'en 2027.

Je souhaite faire venir ma femme et mes deux enfants (8 ans et 12 ans) qui sont restés au Maroc.

Mes questions :
- Quelles sont les conditions à remplir ?
- Combien de temps prend la procédure ?
- Quel est le montant de vos honoraires ?

Je gagne 2300€ net par mois et j'ai un appartement de 70m² à Montreuil.

Merci de me dire si vous pouvez m'aider.

Mohamed HASSAN
06 34 56 78 90`,
    classification: 'nouveau_client',
    priority: 'medium',
  },
  
  // 9. LA POSTE - Recommandé en instance
  {
    from: 'distribution@laposte.fr',
    to: 'cabinet@avocat.fr',
    subject: 'Avis de passage - Recommandé 1A01234567890',
    bodyText: `Un envoi recommandé est en attente de retrait.

Numéro : 1A01234567890
Destinataire : Cabinet Maître DUPONT
Expéditeur : Préfecture du Val-de-Marne

Votre colis est disponible au bureau de poste :
La Poste - Créteil Centre
23 avenue du Général de Gaulle
94000 CRÉTEIL

Horaires : Lundi-Vendredi 9h-18h, Samedi 9h-12h
Délai de garde : 15 jours

Munissez-vous de cet avis et d'une pièce d'identité.`,
    classification: 'laposte_notification',
    priority: 'high',
  },
  
  // 10. URGENT - Décision préfecture
  {
    from: 'prefecture93@seine-saint-denis.gouv.fr',
    to: 'cabinet@avocat.fr',
    subject: 'DÉCISION - Refus de titre de séjour - Dossier N°2026/00234',
    bodyText: `Madame, Monsieur,

Nous accusons réception de la demande de titre de séjour déposée par votre client, M. Ibrahim DIALLO.

Après examen du dossier, le Préfet de Seine-Saint-Denis a décidé de REFUSER la délivrance du titre de séjour sollicité.

Motifs du refus :
- Insuffisance des ressources (Article L.313-11 du CESEDA)
- Documents justificatifs incomplets

Une OQTF avec délai de départ volontaire de 30 jours est assortie à cette décision.

Voies de recours :
- Recours gracieux : 2 mois
- Recours contentieux (TA Montreuil) : 2 mois

Notification par LRAR : 07/01/2026

Le service des étrangers`,
    classification: 'ceseda',
    priority: 'critical',
  },
];

async function generateTestEmails() {
  console.log('📧 Génération d\'emails de test réalistes...\n');
  
  try {
    // Nettoyer les emails existants (optionnel)
    console.log('🧹 Nettoyage des anciens emails de test...');
    await prisma.email.deleteMany({
      where: {
        from: {
          in: emailTemplates.map(e => e.from)
        }
      }
    });
    
    let successCount = 0;
    
    for (const template of emailTemplates) {
      try {
        // Créer l'email
        const email = await prisma.email.create({
          data: {
            messageId: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            threadId: `thread-${Math.random().toString(36).substr(2, 9)}`,
            from: template.from,
            to: template.to,
            subject: template.subject,
            bodyText: template.bodyText,
            bodyHtml: `<p>${template.bodyText.replace(/\n/g, '<br>')}</p>`,
            receivedDate: new Date(),
            isRead: false,
            isArchived: false,
            needsResponse: ['nouveau_client', 'ceseda', 'urgent'].includes(template.classification),
          },
        });
        
        // Créer la classification
        await prisma.emailClassification.create({
          data: {
            emailId: email.id,
            type: template.classification,
            priority: template.priority,
            confidence: 0.85 + Math.random() * 0.1, // Entre 0.85 et 0.95
            tags: JSON.stringify(getTagsForType(template.classification)),
            suggestedAction: getActionForType(template.classification),
            validated: false,
          },
        });
        
        successCount++;
        console.log(`✅ Email créé: "${template.subject}" (${template.classification})`);
        
      } catch (error) {
        console.error(`❌ Erreur pour: ${template.subject}`);
        console.error(error);
      }
    }
    
    console.log(`\n🎉 ${successCount}/${emailTemplates.length} emails de test créés avec succès !`);
    
    // Afficher les statistiques
    const stats = await getEmailStats();
    console.log('\n📊 Statistiques:');
    console.log(`   Total emails: ${stats.total}`);
    console.log(`   Non lus: ${stats.unread}`);
    console.log(`   Critiques: ${stats.critical}`);
    console.log(`   Nouveaux clients: ${stats.nouveauxClients}`);
    console.log(`   CESEDA: ${stats.ceseda}`);
    console.log(`   La Poste: ${stats.laposte}`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la génération:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function getTagsForType(type: string): string[] {
  const tagsMap: Record<string, string[]> = {
    'nouveau_client': ['Nouveau client', 'Premier contact', 'Consultation'],
    'ceseda': ['CESEDA', 'Droit des étrangers', 'Urgent', 'Délai légal'],
    'laposte_notification': ['La Poste', 'Suivi courrier', 'Recommandé'],
    'urgent': ['Urgent', 'Prioritaire', 'Audience', 'Convocation'],
    'reponse_client': ['Client existant', 'Suivi dossier'],
    'spam': ['Spam', 'À ignorer', 'Publicité'],
  };
  
  return tagsMap[type] || ['Général'];
}

function getActionForType(type: string): string {
  const actionsMap: Record<string, string> = {
    'nouveau_client': 'Créer fiche client et programmer consultation',
    'ceseda': 'Traiter en urgence - Délais CESEDA critiques',
    'laposte_notification': 'Extraire numéro de suivi et associer au dossier',
    'urgent': 'Notifier avocat immédiatement - Action requise',
    'reponse_client': 'Mettre à jour le dossier client',
    'spam': 'Marquer comme spam et archiver',
  };
  
  return actionsMap[type] || 'À traiter';
}

async function getEmailStats() {
  const total = await prisma.email.count();
  const unread = await prisma.email.count({ where: { isRead: false } });
  
  const classifications = await prisma.emailClassification.groupBy({
    by: ['type', 'priority'],
    _count: true,
  });
  
  const critical = classifications
    .filter(c => c.priority === 'critical')
    .reduce((sum, c) => sum + c._count, 0);
  
  const nouveauxClients = classifications
    .filter(c => c.type === 'nouveau_client')
    .reduce((sum, c) => sum + c._count, 0);
  
  const ceseda = classifications
    .filter(c => c.type === 'ceseda')
    .reduce((sum, c) => sum + c._count, 0);
  
  const laposte = classifications
    .filter(c => c.type === 'laposte_notification')
    .reduce((sum, c) => sum + c._count, 0);
  
  return { total, unread, critical, nouveauxClients, ceseda, laposte };
}

// Exécuter
generateTestEmails();
