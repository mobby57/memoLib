/**
 * DossierMatcherService — rattachement automatique d'une information entrante
 * au bon dossier (vision "Email licenciement Dupont -> bon dossier").
 *
 * Principe (déterministe d'abord, jamais d'action à l'aveugle) :
 *   1. Identifier le client via l'email de l'expéditeur (principal/secondaire),
 *      sinon via le nom détecté.
 *   2. Récupérer ses dossiers OUVERTS (statut 'en_cours').
 *   3. Décider :
 *        - 0 client / 0 dossier ouvert / plusieurs candidats non départageables
 *          => needsHumanReview = true, PAS de rattachement automatique.
 *        - exactement 1 dossier ouvert => match haute confiance.
 *        - plusieurs dossiers => tenter de départager par typeDossier détecté ;
 *          si un seul correspond => match ; sinon => revue humaine.
 *
 * Ne réalise AUCUNE écriture : renvoie une décision. Le rattachement effectif
 * (et la validation humaine si requise) est du ressort de l'appelant.
 */
import { prisma } from '@/lib/prisma';

export interface DossierMatchInput {
  tenantId: string;
  senderEmail?: string | null;
  detectedClientName?: string | null;
  detectedTypeDossier?: string | null;
}

export interface DossierMatchResult {
  matched: boolean;
  dossierId: string | null;
  clientId: string | null;
  confidence: number; // 0-1
  needsHumanReview: boolean;
  reason: string;
  candidates: Array<{ dossierId: string; numero: string; typeDossier: string }>;
}

const OPEN_STATUS = 'en_cours';

export class DossierMatcherService {
  async match(input: DossierMatchInput): Promise<DossierMatchResult> {
    const { tenantId } = input;

    // 1. Identifier le client
    const client = await this.findClient(input);
    if (!client) {
      return this.review('Aucun client identifié (email/nom non reconnus)', {
        clientId: null,
      });
    }

    // 2. Dossiers ouverts de ce client
    const openDossiers = await prisma.dossier.findMany({
      where: { tenantId, clientId: client.id, statut: OPEN_STATUS },
      select: { id: true, numero: true, typeDossier: true },
      orderBy: { updatedAt: 'desc' },
    });

    const candidates = openDossiers.map((d) => ({
      dossierId: d.id,
      numero: d.numero,
      typeDossier: d.typeDossier,
    }));

    if (openDossiers.length === 0) {
      return this.review('Client identifié mais aucun dossier ouvert', {
        clientId: client.id,
        candidates,
      });
    }

    // 3a. Un seul dossier ouvert => match haute confiance
    if (openDossiers.length === 1) {
      return {
        matched: true,
        dossierId: openDossiers[0].id,
        clientId: client.id,
        confidence: 0.9,
        needsHumanReview: false,
        reason: 'Client identifié avec un unique dossier ouvert',
        candidates,
      };
    }

    // 3b. Plusieurs dossiers => tenter de départager par typeDossier détecté
    if (input.detectedTypeDossier) {
      const typed = openDossiers.filter(
        (d) => d.typeDossier?.toUpperCase() === input.detectedTypeDossier!.toUpperCase()
      );
      if (typed.length === 1) {
        return {
          matched: true,
          dossierId: typed[0].id,
          clientId: client.id,
          confidence: 0.75,
          needsHumanReview: false,
          reason: `Plusieurs dossiers ouverts, départagés par type (${input.detectedTypeDossier})`,
          candidates,
        };
      }
    }

    // 3c. Ambigu => revue humaine (jamais de rattachement auto à l'aveugle)
    return this.review(
      `Plusieurs dossiers ouverts non départageables (${openDossiers.length})`,
      { clientId: client.id, candidates }
    );
  }

  /** Identifie le client par email (principal/secondaire) puis par nom. */
  private async findClient(input: DossierMatchInput) {
    const { tenantId, senderEmail, detectedClientName } = input;

    if (senderEmail) {
      const email = senderEmail.trim().toLowerCase();
      const byEmail = await prisma.client.findFirst({
        where: {
          tenantId,
          OR: [
            { email: { equals: email, mode: 'insensitive' } },
            { emailSecondaire: { equals: email, mode: 'insensitive' } },
          ],
        },
        select: { id: true },
      });
      if (byEmail) return byEmail;
    }

    if (detectedClientName) {
      const name = detectedClientName.trim();
      const byName = await prisma.client.findFirst({
        where: {
          tenantId,
          OR: [
            { lastName: { contains: name, mode: 'insensitive' } },
            { firstName: { contains: name, mode: 'insensitive' } },
          ],
        },
        select: { id: true },
      });
      if (byName) return byName;
    }

    return null;
  }

  private review(
    reason: string,
    extra: { clientId?: string | null; candidates?: DossierMatchResult['candidates'] }
  ): DossierMatchResult {
    return {
      matched: false,
      dossierId: null,
      clientId: extra.clientId ?? null,
      confidence: 0,
      needsHumanReview: true,
      reason,
      candidates: extra.candidates ?? [],
    };
  }
}

export const dossierMatcher = new DossierMatcherService();
