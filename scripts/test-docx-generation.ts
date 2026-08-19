/**
 * Script de test : génère un mémoire de recours DOCX à partir des données
 * du cas Conseil arbitral de la sécurité sociale.
 * 
 * Usage: npx tsx scripts/test-docx-generation.ts
 */

import { Packer } from 'docx';
import { writeFileSync } from 'fs';
import { generateMemoireRecours, type MemoireRecoursVars } from '../src/lib/documents/docx-generator';

const vars: MemoireRecoursVars = {
  requerantNom: 'Moro SIDIBÉ',
  requerantAdresse: '11, rue du Pigeonnier\nF-57070 Metz',
  requerantMatricule: '1991 05 17 007 07',
  defendeurNom: 'Le Centre commun de la sécurité sociale (CCSS)',
  defendeurAdresse: 'L-2974 Luxembourg',

  juridiction: 'Conseil arbitral de la sécurité sociale',

  objet: 'Recours contre la décision du Conseil d\'administration du Centre commun de la sécurité sociale du 2 juillet 2026, notifiée le 15 juillet 2025, portant rejet de l\'opposition et confirmation de l\'annulation rétroactive de l\'affiliation du requérant en qualité de salarié pour les périodes du 15 août 2022 au 31 août 2023 et du 1er septembre 2024 au 31 octobre 2024.',
  dateDecision: '2 juillet 2026',
  dateNotification: '15 juillet 2026',

  delaiLegal: 'quarante (40) jours',
  baseLegale: 'des articles 433, alinéa 1er, 454, alinéa 1er et 455bis du Code de la sécurité sociale',
  dateDepot: '12 août 2026',

  faits: [
    {
      titre: 'La société Connexion Luxembourg S.à r.l.',
      contenu: 'La société CONNEXION LUXEMBOURG S.à r.l. (matricule 2021 2452 980 99) est une société à responsabilité limitée de droit luxembourgeois dont l\'objet social était la collecte de fonds et la prospection pour le compte d\'organisations non gouvernementales. La société comptait trois associés, dont le requérant à hauteur de 33 % des parts. L\'autorisation d\'établissement était détenue par l\'épouse du requérant, qui était également gérante de la société.',
    },
    {
      titre: 'L\'embauche du requérant',
      contenu: 'Par déclaration d\'entrée pour le secteur privé en date du 12 septembre 2022, la société a sollicité l\'affiliation de Monsieur SIDIBÉ en qualité de gérant administratif à compter du 15 août 2022, à raison de 40 heures par semaine.',
    },
    {
      titre: 'Les fonctions exercées',
      contenu: 'Malgré l\'intitulé de « gérant administratif », les fonctions exercées par le requérant étaient essentiellement opérationnelles et de terrain : organiser et superviser les campagnes de collecte de fonds, encadrer et former les équipes de collecteurs (environ cinq salariés), assurer le suivi quotidien des opérations sur le terrain, intervenir en cas de difficulté.',
    },
    {
      titre: 'Le lien de subordination',
      contenu: 'Le requérant recevait ses instructions quotidiennes de Madame Sarra Boudjellal et de Monsieur Désir Charles, qui déterminaient les villes et zones d\'intervention, les objectifs de collecte, la répartition des équipes et les horaires de travail. Le requérant ne disposait pas de la liberté de choisir ses lieux d\'intervention ni ses horaires.',
    },
    {
      titre: 'Les congés parentaux',
      contenu: 'Monsieur SIDIBÉ a bénéficié de deux congés parentaux successifs à temps plein du 1er septembre 2023 au 31 août 2024. Cette circonstance est déterminante : elle explique pourquoi les contrôles effectués entre mars et août 2024 n\'ont pas permis de constater la présence du requérant.',
    },
    {
      titre: 'La faillite de la société',
      contenu: 'La société CONNEXION LUXEMBOURG S.à r.l. a été déclarée en faillite le 25 septembre 2024. Maître Sylvain L\'HOTE a été désigné curateur.',
    },
  ],

  pointsContestes: [
    {
      titre: 'Sur les contrôles inopinés au siège',
      citationDecision: 'Les agents ont effectué quatre visites inopinées au siège de la Société, qui se trouve dans un centre d\'affaires, aux dates des 25 mars, 16 mai, 1er août et 21 août 2024. À chaque visite, aucun responsable ni salarié n\'était présent.',
      observations: [
        'L\'activité de la société est la collecte de fonds sur le terrain (rues, centres commerciaux, porte-à-porte). Le siège ne servait qu\'aux tâches administratives ponctuelles. Constater l\'absence de personnel au bureau est dépourvu de pertinence.',
        'Les quatre contrôles ont eu lieu entre mars et août 2024. Or, le requérant était en congé parental à temps plein du 1er septembre 2023 au 31 août 2024.',
        'La société connaissait des difficultés d\'accès à ses locaux en raison de retards de loyer.',
        'Le CCSS n\'a effectué aucun contrôle sur le terrain, c\'est-à-dire aux endroits où l\'activité s\'exerçait réellement.',
      ],
    },
    {
      titre: 'Sur les courriers restés sans réponse',
      citationDecision: 'Un courrier recommandé du 29 août 2024 envoyé à la Société et un courrier similaire adressé à Monsieur SIDIBÉ sont restés sans réponse.',
      observations: [
        'Le 29 août 2024, le requérant était en congé parental. La société avait des difficultés d\'accès au bureau.',
        'Le défaut de réponse à un courrier ne constitue pas la preuve d\'une absence d\'activité professionnelle antérieure.',
        'Le requérant a répondu dès qu\'il a eu connaissance de la décision, par opposition du 6 mars 2025.',
      ],
    },
    {
      titre: 'Sur la qualité d\'associé et le pouvoir de signature',
      citationDecision: 'Monsieur SIDIBÉ a été associé à hauteur de 33 % des parts pendant toute la vie de la société. Il avait le pouvoir d\'engager la Société par sa seule signature.',
      observations: [
        'La qualité d\'associé minoritaire (33 %) n\'est pas incompatible avec le statut de salarié. La jurisprudence luxembourgeoise admet qu\'un associé peut être salarié dès lors qu\'un lien de subordination effectif existe.',
        'Le requérant ne déterminait pas seul l\'organisation du travail. Il recevait ses instructions de Madame Sarra Boudjellal et Monsieur Désir Charles.',
        'L\'autorisation d\'établissement était détenue par son épouse, qui était également gérante. Le requérant n\'avait pas la maîtrise juridique exclusive de la société.',
      ],
    },
    {
      titre: 'Sur le contrat de travail',
      citationDecision: 'Le contrat de travail fourni n\'est pas signé.',
      observations: [
        'L\'article L.121-4 du Code du travail dispose que le contrat de travail peut être prouvé par tous moyens. L\'exécution effective — rémunération versée, travail accompli, lien de subordination — suffit.',
        'Le CCSS reconnaît que les salaires ont été versés régulièrement, ce qui constitue la preuve la plus directe de l\'exécution du contrat.',
        'La déclaration d\'entrée du 12 septembre 2022 auprès du CCSS lui-même constitue un élément supplémentaire.',
      ],
    },
  ],

  moyens: [
    {
      titre: 'Erreur d\'appréciation des faits',
      contenu: 'Le CCSS a commis une erreur d\'appréciation en concluant à l\'absence d\'activité personnelle du requérant sur la base de contrôles effectués au siège administratif d\'une entreprise dont l\'activité s\'exerce exclusivement sur le terrain. Les contrôles ont eu lieu pendant le congé parental du requérant.',
    },
    {
      titre: 'Violation du principe de sécurité juridique',
      contenu: 'Le requérant a été affilié à la sécurité sociale. Les cotisations ont été déclarées et encaissées par le CCSS sans objection. L\'annulation rétroactive de cette affiliation, après acceptation des cotisations pendant plus d\'un an, porte atteinte au principe de sécurité juridique et de confiance légitime.',
    },
    {
      titre: 'Renversement illégal de la charge de la preuve',
      contenu: 'Dès lors qu\'une affiliation existe, qu\'un contrat de travail existe et que des salaires sont versés, il appartient au CCSS de rapporter la preuve positive du caractère fictif du travail. Le CCSS se fonde uniquement sur des présomptions négatives qui ont toutes une explication légitime.',
    },
    {
      titre: 'Non-prise en compte du congé parental',
      contenu: 'Le CCSS reconnaît dans sa propre décision que le requérant était en congé parental du 1er septembre 2023 au 31 août 2024, mais fonde néanmoins sa décision sur des contrôles effectués pendant cette même période. Cette contradiction interne invalide le raisonnement.',
    },
  ],

  pieces: [
    { numero: 1, designation: 'Contrat de travail du requérant (12 septembre 2022)' },
    { numero: 2, designation: 'Fiches de salaire (août 2022 à juin 2023)' },
    { numero: 3, designation: 'Extraits bancaires attestant du versement des salaires' },
    { numero: 4, designation: 'Plannings des villes et campagnes de collecte' },
    { numero: 5, designation: 'SMS professionnels (instructions, coordination)' },
    { numero: 6, designation: 'Contrat de prestation – Amnesty International Luxembourg' },
    { numero: 7, designation: 'Contrat de prestation – UNICEF Luxembourg' },
    { numero: 8, designation: 'Contrat de prestation – SOS Faim' },
    { numero: 9, designation: 'Décision du Conseil d\'administration du CCSS du 2 juillet 2026' },
    { numero: 10, designation: 'Preuve de notification (15 juillet 2026)' },
    { numero: 11, designation: 'Attestation de congé parental (sept. 2023 – août 2024)' },
    { numero: 12, designation: 'Décision initiale du 7 février 2025' },
    { numero: 13, designation: 'Attestations de collègues ou clients' },
  ],

  demandesPrincipales: [
    'Déclarer le recours recevable en la forme ;',
    'Au fond, annuler la décision du Conseil d\'administration du CCSS du 2 juillet 2026 ;',
    'Dire et juger que le requérant était bien affilié en qualité de salarié de la société CONNEXION LUXEMBOURG S.à r.l. pour les périodes du 15 août 2022 au 31 août 2023 et du 1er septembre 2024 au 31 octobre 2024 ;',
    'Ordonner le rétablissement de l\'affiliation du requérant pour lesdites périodes, avec tous les droits y afférents.',
  ],

  demandesSubsidiaires: [
    'Ordonner avant dire droit toute mesure d\'instruction que le Conseil estimera utile, et notamment :',
    'La communication intégrale du dossier administratif du CCSS concernant le requérant et la société ;',
    'L\'audition des agents du service contrôle ayant procédé aux visites ;',
    'L\'audition de témoins pouvant attester de l\'activité professionnelle du requérant.',
  ],

  lieu: 'Metz',
  date: '12 août 2026',
  numeroDossier: 'D-2026-CCSS-001',
};

async function main() {
  console.log('Génération du mémoire de recours DOCX...');
  const doc = generateMemoireRecours(vars);
  const buffer = await Packer.toBuffer(doc);

  const outputPath = 'C:\\Users\\moros\\Desktop\\memolib\\MEMOIRE_RECOURS_TEST.docx';
  writeFileSync(outputPath, buffer);
  console.log(`✅ Document généré : ${outputPath}`);
  console.log(`   Taille : ${(buffer.length / 1024).toFixed(1)} Ko`);
}

main().catch(console.error);
