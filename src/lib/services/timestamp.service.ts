/**
 * Service d'horodatage certifié RFC 3161 (Timestamp Authority)
 * 
 * Fournit une preuve tierce de la date d'un événement.
 * Utilise FreeTSA.org (gratuit) ou Universign (payant, qualifié eIDAS).
 * 
 * Fonctionnement :
 * 1. On hash le contenu à horodater (SHA-256)
 * 2. On envoie le hash à un serveur TSA (RFC 3161)
 * 3. Le serveur signe le hash + date avec son certificat
 * 4. On stocke le token TSA comme preuve
 * 
 * Valeur légale :
 * - FreeTSA : preuve tierce gratuite, non qualifiée mais recevable
 * - Universign : qualifié eIDAS, valeur légale maximale en UE
 */

import { createHash } from 'crypto';

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface TimestampResult {
  success: boolean;
  provider: 'freetsa' | 'universign' | 'local';
  hash: string;          // SHA-256 du contenu horodaté
  timestamp: string;     // Date ISO du serveur TSA
  token?: string;        // Token TSA base64 (preuve)
  tokenHex?: string;     // Token en hex (court, pour stockage)
  error?: string;
}

export interface TimestampVerification {
  valid: boolean;
  hash: string;
  timestampDate: string;
  provider: string;
  details?: string;
}

// ─── Configuration ──────────────────────────────────────────────────────────────

const TSA_CONFIG = {
  freetsa: {
    url: 'https://freetsa.org/tsr',
    enabled: true,
  },
  // Universign (payant, eIDAS qualifié) - à activer si besoin
  universign: {
    url: 'https://timestamp.universign.eu/tsp',
    enabled: false,
    apiKey: process.env.UNIVERSIGN_API_KEY || '',
  },
};

// ─── Service principal ──────────────────────────────────────────────────────────

export class TimestampService {
  /**
   * Horodater un contenu (texte, JSON, ou hash déjà calculé).
   * Retourne un token prouvant que ce contenu existait à cette date.
   */
  async timestamp(content: string | Buffer): Promise<TimestampResult> {
    const hash = this.computeHash(content);
    
    // Essayer FreeTSA d'abord
    if (TSA_CONFIG.freetsa.enabled) {
      try {
        const result = await this.requestFreeTSA(hash);
        if (result.success) return result;
      } catch (err: any) {
        console.warn('[TSA] FreeTSA failed, falling back to local:', err.message);
      }
    }

    // Fallback : horodatage local signé (moins de valeur mais tracé)
    return this.localTimestamp(hash);
  }

  /**
   * Horodater un événement critique (audit log, preuve, signature).
   * Shortcut pour les cas d'usage fréquents.
   */
  async timestampEvent(eventData: {
    action: string;
    entityId: string;
    entityType: string;
    userId: string;
    data?: Record<string, any>;
  }): Promise<TimestampResult> {
    const payload = JSON.stringify({
      ...eventData,
      serverTime: new Date().toISOString(),
      nonce: Math.random().toString(36).slice(2),
    });
    return this.timestamp(payload);
  }

  /**
   * Horodater un document (par son hash SHA-256).
   */
  async timestampDocument(documentHash: string): Promise<TimestampResult> {
    // Le hash est déjà calculé, on l'envoie directement au TSA
    if (TSA_CONFIG.freetsa.enabled) {
      try {
        return await this.requestFreeTSA(documentHash);
      } catch {
        return this.localTimestamp(documentHash);
      }
    }
    return this.localTimestamp(documentHash);
  }

  // ─── FreeTSA (RFC 3161) ─────────────────────────────────────────────────────

  private async requestFreeTSA(hash: string): Promise<TimestampResult> {
    // Construire la requête TSA (RFC 3161 TimeStampReq)
    // Format simplifié : on envoie le hash en POST
    const tsaUrl = TSA_CONFIG.freetsa.url;
    
    // Créer le corps de la requête RFC 3161 (ASN.1 DER)
    const tsRequest = this.buildTSRequest(hash);

    const response = await fetch(tsaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/timestamp-query',
      },
      body: tsRequest,
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!response.ok) {
      throw new Error(`TSA responded with ${response.status}`);
    }

    const responseBuffer = await response.arrayBuffer();
    const tokenBase64 = Buffer.from(responseBuffer).toString('base64');
    const tokenHex = Buffer.from(responseBuffer).toString('hex').slice(0, 64);

    return {
      success: true,
      provider: 'freetsa',
      hash,
      timestamp: new Date().toISOString(),
      token: tokenBase64,
      tokenHex,
    };
  }

  /**
   * Construit une requête TimeStampReq RFC 3161 minimale.
   * Structure ASN.1 DER :
   *   SEQUENCE {
   *     INTEGER 1 (version)
   *     SEQUENCE {
   *       SEQUENCE {
   *         OID 2.16.840.1.101.3.4.2.1 (SHA-256)
   *         NULL
   *       }
   *       OCTET STRING (hash 32 bytes)
   *     }
   *     BOOLEAN TRUE (certReq)
   *   }
   */
  private buildTSRequest(hexHash: string): Buffer {
    const hashBytes = Buffer.from(hexHash, 'hex');
    
    // Si le hash n'est pas exactement 32 bytes (SHA-256), recalculer
    const hash32 = hashBytes.length === 32 
      ? hashBytes 
      : createHash('sha256').update(hexHash).digest();

    // OID SHA-256: 2.16.840.1.101.3.4.2.1
    const sha256OID = Buffer.from([
      0x30, 0x0d, // SEQUENCE (AlgorithmIdentifier)
      0x06, 0x09, // OID
      0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x02, 0x01, // SHA-256 OID
      0x05, 0x00, // NULL
    ]);

    // MessageImprint: SEQUENCE { AlgorithmIdentifier, OCTET STRING hash }
    const messageImprint = Buffer.concat([
      Buffer.from([0x30, sha256OID.length + 2 + hash32.length]), // SEQUENCE
      sha256OID,
      Buffer.from([0x04, hash32.length]), // OCTET STRING
      hash32,
    ]);

    // Version: INTEGER 1
    const version = Buffer.from([0x02, 0x01, 0x01]);

    // CertReq: BOOLEAN TRUE
    const certReq = Buffer.from([0x01, 0x01, 0xff]);

    // TimeStampReq: SEQUENCE { version, messageImprint, certReq }
    const innerLength = version.length + messageImprint.length + certReq.length;
    const tsReq = Buffer.concat([
      Buffer.from([0x30, innerLength]),
      version,
      messageImprint,
      certReq,
    ]);

    return tsReq;
  }

  // ─── Fallback local ─────────────────────────────────────────────────────────

  private localTimestamp(hash: string): TimestampResult {
    const now = new Date().toISOString();
    // Créer un "token" local signé = hash(contenu + date + secret)
    const localSecret = process.env.NEXTAUTH_SECRET || 'memolib-tsa-local';
    const localToken = createHash('sha256')
      .update(`${hash}|${now}|${localSecret}`)
      .digest('hex');

    return {
      success: true,
      provider: 'local',
      hash,
      timestamp: now,
      token: localToken,
      tokenHex: localToken.slice(0, 64),
    };
  }

  // ─── Utilitaires ────────────────────────────────────────────────────────────

  private computeHash(content: string | Buffer): string {
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * Vérifier si un token TSA est valide (basique).
   * Pour une vérification complète, il faudrait parser l'ASN.1.
   */
  verifyLocal(hash: string, timestamp: string, token: string): boolean {
    const localSecret = process.env.NEXTAUTH_SECRET || 'memolib-tsa-local';
    const expected = createHash('sha256')
      .update(`${hash}|${timestamp}|${localSecret}`)
      .digest('hex');
    return expected === token;
  }
}

// ─── Singleton ──────────────────────────────────────────────────────────────────

export const timestampService = new TimestampService();
