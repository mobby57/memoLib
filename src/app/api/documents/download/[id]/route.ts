import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { readFile, stat } from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

export const dynamic = 'force-dynamic';

/**
 * GET /api/documents/download/[id]
 * Télécharge un document par son ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const user = session.user as any;
    const tenantId = user.tenantId;
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'ID document requis' }, { status: 400 });
    }

    // Chercher le fichier dans le répertoire du tenant
    // Note: En production, chercher en base de données d'abord
    const fs = await import('fs');
    const glob = await import('path');
    
    // Recherche récursive dans le dossier du tenant
    const tenantDir = path.join(UPLOAD_DIR, tenantId);
    
    const findFile = async (dir: string, fileId: string): Promise<string | null> => {
      try {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            const found = await findFile(fullPath, fileId);
            if (found) return found;
          } else if (entry.name.startsWith(fileId)) {
            return fullPath;
          }
        }
      } catch {
        return null;
      }
      return null;
    };

    const filePath = await findFile(tenantDir, id);

    if (!filePath) {
      return NextResponse.json({ error: 'Document non trouvé' }, { status: 404 });
    }

    // Lire le fichier
    const fileBuffer = await readFile(filePath);
    const fileStat = await stat(filePath);
    
    // Déterminer le type MIME
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.txt': 'text/plain',
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';
    const fileName = path.basename(filePath);

    // Retourner le fichier
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileStat.size.toString(),
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });

  } catch (error) {
    console.error('[DOWNLOAD] Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur lors du téléchargement' },
      { status: 500 }
    );
  }
}
