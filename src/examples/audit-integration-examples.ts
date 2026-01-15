/**
 * EXEMPLE D'INTÉGRATION - Route API sécurisée avec audit
 * 
 * Ce fichier montre comment intégrer le système d'audit
 * dans une route API réelle de IA Poste Manager
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';
import { logAudit, AuditHelpers } from '@/lib/audit';
import { hashFile } from '@/lib/crypto';
import { prepareDossierForAI, secureAICall } from '@/lib/ai-isolation';
import { writeFile } from 'fs/promises';
import { join } from 'path';

const prisma = new PrismaClient();

// ============================================
// EXEMPLE 1 : Upload de document avec audit complet
// ============================================

export async function POST_UploadDocument(
  req: NextRequest,
  { params }: { params: { id: string; dossierId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const tenantId = params.id;
  const dossierId = params.dossierId;

  // 1. VÉRIFICATION AUTORISATION
  if (session.user.role !== 'SUPER_ADMIN' && session.user.tenantId !== tenantId) {
    // Log tentative d'accès non autorisé
    await AuditHelpers.logUnauthorizedAccess(
      session.user.id,
      tenantId,
      'Document',
      'upload',
      'Tentative accès cross-tenant',
      req.ip
    );
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 });
    }

    // 2. CONVERSION ET HASH
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const hash = await hashFile(buffer);

    // 3. SAUVEGARDE PHYSIQUE
    const uploadDir = join(process.cwd(), 'uploads', tenantId, dossierId);
    const filename = `${Date.now()}-${file.name}`;
    const filepath = join(uploadDir, filename);
    
    // Créer le répertoire si nécessaire
    await writeFile(filepath, buffer);

    // 4. CRÉATION DOCUMENT EN BASE
    const document = await prisma.Document.create({
      data: {
        dossierId,
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: buffer.length,
        path: filepath,
        hash,
        uploadedBy: session.user.id
      }
    });

    // 5. CRÉATION VERSION INITIALE
    await prisma.DocumentVersion.create({
      data: {
        documentId: document.id,
        version: 1,
        hash,
        filename,
        path: filepath,
        size: buffer.length,
        mimeType: file.type,
        uploadedBy: session.user.id,
        changeReason: 'Upload initial'
      }
    });

    // 6. AUDIT LOG
    await AuditHelpers.logDocumentCreate(
      tenantId,
      session.user.id,
      document.id,
      file.name,
      hash
    );

    return NextResponse.json({ 
      success: true, 
      document: {
        id: document.id,
        filename: file.name,
        size: buffer.length,
        hash
      }
    });

  } catch (error) {
    // Log erreur
    await logAudit({
      tenantId,
      userId: session.user.id,
      action: 'CREATE',
      objectType: 'Document',
      metadata: { error: (error as Error).message },
      success: false,
      errorMessage: (error as Error).message
    });

    return NextResponse.json(
      { error: 'Erreur lors de l\'upload' },
      { status: 500 }
    );
  }
}

// ============================================
// EXEMPLE 2 : Téléchargement de document avec audit
// ============================================

export async function GET_DownloadDocument(
  req: NextRequest,
  { params }: { params: { id: string; documentId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const tenantId = params.id;
  const documentId = params.documentId;

  try {
    // Récupérer le document
    const document = await prisma.Document.findFirst({
      where: {
        id: documentId,
        dossier: {
          tenantId
        }
      }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document non trouvé' }, { status: 404 });
    }

    // Vérification autorisation (le middleware devrait déjà avoir fait ça)
    // Mais double-check pour les actions critiques
    if (session.user.tenantId !== tenantId) {
      await AuditHelpers.logUnauthorizedAccess(
        session.user.id,
        tenantId,
        'Document',
        documentId,
        'Tentative téléchargement cross-tenant',
        req.ip
      );
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // LOG DU TÉLÉCHARGEMENT
    await AuditHelpers.logDocumentDownload(
      tenantId,
      session.user.id,
      documentId,
      req.ip
    );

    // Retourner le fichier
    // (Implémentation complète nécessite fs.readFile + stream)
    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        filename: document.originalName,
        downloadUrl: `/api/files/${documentId}`
      }
    });

  } catch (error) {
    await logAudit({
      tenantId,
      userId: session.user.id,
      action: 'DOWNLOAD',
      objectType: 'Document',
      objectId: documentId,
      success: false,
      errorMessage: (error as Error).message
    });

    return NextResponse.json({ error: 'Erreur téléchargement' }, { status: 500 });
  }
}

// ============================================
// EXEMPLE 3 : Analyse IA d'un dossier avec isolation
// ============================================

export async function POST_AnalyzeDossier(
  req: NextRequest,
  { params }: { params: { id: string; dossierId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const tenantId = params.id;
  const dossierId = params.dossierId;

  try {
    // Récupérer le dossier
    const dossier = await prisma.Dossier.findFirst({
      where: {
        id: dossierId,
        tenantId
      },
      include: {
        client: true,
        documents: true
      }
    });

    if (!dossier) {
      return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 });
    }

    // 1. PRÉPARATION SÉCURISÉE POUR IA
    const safeDossier = prepareDossierForAI(dossier);

    if (!safeDossier) {
      await logAudit({
        tenantId,
        userId: session.user.id,
        action: 'CREATE',
        objectType: 'Dossier',
        objectId: dossierId,
        metadata: { aiAnalysis: 'failed', reason: 'Impossible d\'anonymiser' },
        success: false,
        errorMessage: 'Données sensibles détectées'
      });

      return NextResponse.json({
        error: 'Impossible d\'analyser ce dossier (données sensibles)'
      }, { status: 400 });
    }

    // 2. APPEL IA SÉCURISÉ
    const analysis = await secureAICall(
      async (input) => {
        // Appel à Ollama
        const response = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama3.2',
            prompt: `Analyse ce dossier juridique CESEDA: ${JSON.stringify(input)}`,
            stream: false
          })
        });

        const result = await response.json();
        return result.response;
      },
      safeDossier
    );

    // 3. SAUVEGARDE ANALYSE
    if (analysis) {
      await prisma.Dossier.update({
        where: { id: dossierId },
        data: {
          aiAnalysis: JSON.stringify(analysis)
          // analysis contient déjà __aiGenerated, __requiresHumanValidation
        }
      });

      // 4. AUDIT
      await logAudit({
        tenantId,
        userId: session.user.id,
        action: 'CREATE',
        objectType: 'Dossier',
        objectId: dossierId,
        metadata: {
          aiAnalysisGenerated: true,
          model: 'llama3.2',
          anonymized: true
        },
        success: true
      });

      return NextResponse.json({ 
        success: true, 
        analysis,
        warning: 'Cette analyse IA nécessite une validation humaine'
      });
    }

    return NextResponse.json({ error: 'Échec analyse IA' }, { status: 500 });

  } catch (error) {
    await logAudit({
      tenantId,
      userId: session.user.id,
      action: 'CREATE',
      objectType: 'Dossier',
      objectId: dossierId,
      metadata: { aiAnalysis: 'error' },
      success: false,
      errorMessage: (error as Error).message
    });

    return NextResponse.json({ error: 'Erreur analyse' }, { status: 500 });
  }
}

// ============================================
// EXEMPLE 4 : Login avec audit
// ============================================

export async function POST_Login(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // Tentative de connexion
    // (NextAuth gère déjà l'authentification, ceci est un exemple)
    
    const user = await prisma.User.findUnique({
      where: { email }
    });

    if (!user) {
      // Log échec connexion
      await AuditHelpers.logLoginFailed(
        email,
        req.ip,
        req.headers.get('user-agent') || undefined
      );

      return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 });
    }

    // Vérification password (bcrypt)
    const bcrypt = require('bcryptjs');
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      await AuditHelpers.logLoginFailed(
        email,
        req.ip,
        req.headers.get('user-agent') || undefined
      );

      return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 });
    }

    // Succès - Log connexion
    await AuditHelpers.logLogin(
      user.id,
      user.tenantId,
      req.ip,
      req.headers.get('user-agent') || undefined
    );

    // Mettre à jour lastLogin
    await prisma.User.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    return NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// ============================================
// EXEMPLE 5 : Suppression de dossier avec audit
// ============================================

export async function DELETE_Dossier(
  req: NextRequest,
  { params }: { params: { id: string; dossierId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const tenantId = params.id;
  const dossierId = params.dossierId;

  // Vérification autorisation
  if (session.user.role !== 'ADMIN' || session.user.tenantId !== tenantId) {
    await AuditHelpers.logUnauthorizedAccess(
      session.user.id,
      tenantId,
      'Dossier',
      dossierId,
      'Tentative suppression non autorisée',
      req.ip
    );
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  try {
    // Récupérer infos avant suppression (pour audit)
    const dossier = await prisma.Dossier.findUnique({
      where: { id: dossierId },
      include: { client: true }
    });

    if (!dossier) {
      return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 });
    }

    // Suppression
    await prisma.Dossier.delete({
      where: { id: dossierId }
    });

    // AUDIT CRITIQUE (suppression = action irréversible)
    await logAudit({
      tenantId,
      userId: session.user.id,
      userRole: session.user.role,
      action: 'DELETE',
      objectType: 'Dossier',
      objectId: dossierId,
      metadata: {
        numero: dossier.numero,
        clientId: dossier.clientId,
        typeDossier: dossier.typeDossier,
        deletedBy: session.user.email
      },
      ipAddress: req.ip,
      userAgent: req.headers.get('user-agent') || undefined,
      success: true
    });

    return NextResponse.json({ 
      success: true,
      message: 'Dossier supprimé'
    });

  } catch (error) {
    await logAudit({
      tenantId,
      userId: session.user.id,
      action: 'DELETE',
      objectType: 'Dossier',
      objectId: dossierId,
      success: false,
      errorMessage: (error as Error).message
    });

    return NextResponse.json({ error: 'Erreur suppression' }, { status: 500 });
  }
}
