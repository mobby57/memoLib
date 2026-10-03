import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/clerk-auth';
import { requireApiPermission, resolveGroupsFromRole, RBAC_PERMISSIONS } from '@/lib/auth/rbac';
import { addIntakeUploadedFile, listIntakeUploadedFiles } from '@/lib/services/intake.service';
import { scanDocumentAsync } from '@/lib/security/antivirus';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * POST /api/intake/[id]/documents  → dépose une pièce (chiffrée) pour une demande.
 * GET  /api/intake/[id]/documents  → liste les pièces déposées (métadonnées).
 *
 * Sécurité : contenu chiffré avant stockage (service), scan antivirus async,
 * validations taille/type/extension, RBAC dossiers:manage (POST) / read (GET),
 * scope tenant.
 */

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]);
const DANGEROUS_EXTENSIONS = new Set([
  'exe', 'dll', 'bat', 'cmd', 'com', 'scr', 'msi', 'js', 'jse', 'vbs', 'vbe',
  'ps1', 'psm1', 'jar', 'sh', 'php', 'py', 'rb', 'pl',
]);

function toSession(user: { role: string; groups?: string[] } | null) {
  if (!user) return null;
  const groups = user.groups && user.groups.length > 0 ? user.groups : resolveGroupsFromRole(user.role);
  return { user: { role: user.role, groups } };
}

function sanitizeFileName(name: string): string {
  return name.replace(/[\\/]/g, '_').replace(/[^a-zA-Z0-9._()\- ]/g, '_').replace(/\s+/g, ' ').trim();
}

function extensionOf(name: string): string {
  const i = name.lastIndexOf('.');
  return i < 0 || i === name.length - 1 ? '' : name.slice(i + 1).toLowerCase();
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { user } = await auth();
  const check = requireApiPermission(toSession(user), RBAC_PERMISSIONS.DOSSIERS_MANAGE);
  if (!check.ok) return check.response;
  if (!user?.tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 400 });

  const form = await req.formData();
  const fileEntry = form.get('file');
  const documentLabel = String(form.get('documentLabel') || '').trim();

  if (!documentLabel) {
    return NextResponse.json({ error: 'documentLabel requis' }, { status: 400 });
  }
  if (!(fileEntry instanceof File)) {
    return NextResponse.json({ error: 'Fichier requis' }, { status: 400 });
  }

  const safeName = sanitizeFileName(fileEntry.name);
  if (!safeName || safeName.length > 255) {
    return NextResponse.json({ error: 'Nom de fichier invalide' }, { status: 400 });
  }
  if (fileEntry.size === 0 || fileEntry.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: `Fichier invalide (max ${MAX_FILE_SIZE / 1024 / 1024}MB)` }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(fileEntry.type)) {
    return NextResponse.json({ error: 'Type de fichier non autorisé' }, { status: 400 });
  }
  const ext = extensionOf(safeName);
  if (ext && DANGEROUS_EXTENSIONS.has(ext)) {
    return NextResponse.json({ error: 'Extension interdite' }, { status: 400 });
  }

  const buffer = Buffer.from(await fileEntry.arrayBuffer());

  try {
    const { file, completeness } = await addIntakeUploadedFile(
      user.tenantId,
      id,
      { documentLabel, fileName: safeName, mimeType: fileEntry.type, buffer },
      user.id
    );

    // Scan antivirus asynchrone (non bloquant).
    void scanDocumentAsync({
      documentId: file.id,
      fileName: safeName,
      mimeType: fileEntry.type,
      buffer,
    });

    return NextResponse.json({ file, completeness }, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === 'Intake request not found') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    throw e;
  }
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { user } = await auth();
  const check = requireApiPermission(toSession(user), RBAC_PERMISSIONS.DOSSIERS_READ);
  if (!check.ok) return check.response;
  if (!user?.tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 400 });

  const files = await listIntakeUploadedFiles(user.tenantId, id);
  return NextResponse.json({ files, count: files.length });
}
