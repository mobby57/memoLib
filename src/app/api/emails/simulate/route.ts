import { auth } from '@/lib/clerk-auth';
import { NextResponse } from 'next/server';
import { generateWebhookHeaders } from '@/lib/security/webhook-verification';
import { randomUUID } from 'node:crypto';
const DEMO_EMAILS = [
  {
    from: 'Fatima Benali <fatima.benali@gmail.com>',
    subject: 'URGENT - OQTF reçue ce matin',
    body: `Maître,

Je vous contacte en urgence. J'ai reçu ce matin une Obligation de Quitter le Territoire Français (OQTF) avec un délai de départ volontaire de 30 jours.

Je suis en France depuis 8 ans, mes enfants sont scolarisés ici (CE2 et 6ème). Mon titre de séjour "vie privée et familiale" a expiré il y a 3 mois, j'avais déposé un renouvellement mais la préfecture ne m'a jamais répondu.

Pouvez-vous m'aider à faire un recours ? C'est très urgent.

Cordialement,
Fatima Benali
06 12 34 56 78`,
  },
  {
    from: 'Ahmed Kaddouri <a.kaddouri@outlook.fr>',
    subject: 'Demande de regroupement familial - refus préfecture',
    body: `Bonjour Maître,

La préfecture de Metz vient de refuser ma demande de regroupement familial pour ma femme et mes deux enfants restés au Maroc. Le motif invoqué est "ressources insuffisantes".

Je travaille en CDI depuis 3 ans comme technicien (salaire net 1 850€/mois). Mon logement fait 65m² (T3).

Je ne comprends pas ce refus. Pouvez-vous examiner mon dossier et me dire si un recours est possible ?

Merci,
Ahmed Kaddouri`,
  },
  {
    from: 'Marie Dupont <m.dupont@avocat-conseil.fr>',
    subject: 'Transfert dossier - Demande d\'asile M. HASSAN',
    body: `Cher confrère,

Je vous transfère le dossier de M. Ibrahim HASSAN, demandeur d'asile soudanais.

Son entretien OFPRA est prévu le 15 juin 2026. Il a besoin d'une préparation approfondie.

Points clés :
- Persécution ethnique (Darfour)
- Traces de torture documentées (certificat médical joint)
- Arrivé en France en septembre 2025
- Hébergé en CADA à Strasbourg

Pouvez-vous le recevoir rapidement ?

Confraternellement,
Me. Marie Dupont`,
  },
  {
    from: 'Préfecture du Bas-Rhin <ne-pas-repondre@bas-rhin.gouv.fr>',
    subject: 'Notification - Décision relative au séjour - Dossier 2026/STR/04521',
    body: `Madame, Monsieur,

Nous vous informons qu'une décision a été prise concernant la demande de titre de séjour déposée par votre client(e) M./Mme DIALLO Aminata (dossier n° 2026/STR/04521).

Cette décision est disponible au guichet de la préfecture.

Délai de recours : 2 mois à compter de la notification.

Le service des étrangers
Préfecture du Bas-Rhin`,
  },
];

/**
 * POST /api/emails/simulate
 * Injecte un email démo réaliste dans le système
 */
export async function POST() {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenantId = (user as any).tenantId;
  const email = DEMO_EMAILS[Math.floor(Math.random() * DEMO_EMAILS.length)];

  // Call the webhook internally
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/email-inbound`;
  const secret = process.env.EMAIL_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: 'Service email indisponible' }, { status: 503 });
  const payload = JSON.stringify({
    ...email,
    tenantId,
    date: new Date().toISOString(),
    messageId: `demo-${Date.now()}@memolib.local`,
  });
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-id': randomUUID(),
      ...generateWebhookHeaders(payload, secret),
    },
    body: payload,
  });

  const result = await res.json();
  return NextResponse.json({
    success: true,
    message: `📧 Email simulé reçu de ${email.from.split('<')[0].trim()}`,
    subject: email.subject,
    ...result,
  });
}



