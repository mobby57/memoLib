'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { intakeKeys } from '@/hooks/useIntakeNeedsHelp';

/**
 * useIntakeRequest — détail d'une demande d'intake (déchiffré côté serveur) +
 * mutation de mise à jour des réponses/documents.
 */

export interface IntakeFieldDef {
  id: string;
  label: string;
  type: string;
  required: boolean;
}

export interface IntakeRequestDetail {
  id: string;
  tenantId: string;
  clientId: string | null;
  type: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETE' | 'NEEDS_HELP';
  origin: string;
  sourceRef: string | null;
  clientEmail: string | null;
  data: Record<string, unknown>;
  requiredFields: IntakeFieldDef[];
  requiredDocuments: string[];
  providedDocuments: string[];
  completeness: number;
  createdAt: string;
  updatedAt: string;
}

export interface IntakeUpdateInput {
  data: Record<string, unknown>;
  providedDocuments: string[];
  needsHelp?: boolean;
}

async function fetchIntake(id: string): Promise<IntakeRequestDetail> {
  const res = await fetch(`/api/intake/${id}`, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}

async function patchIntake(id: string, input: IntakeUpdateInput): Promise<IntakeRequestDetail> {
  const res = await fetch(`/api/intake/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}

export function useIntakeRequest(id: string) {
  return useQuery({
    queryKey: intakeKeys.detail(id),
    queryFn: () => fetchIntake(id),
    enabled: Boolean(id),
  });
}

export function useUpdateIntakeRequest(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: IntakeUpdateInput) => patchIntake(id, input),
    onSuccess: (data) => {
      queryClient.setQueryData(intakeKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: intakeKeys.needsHelp() });
    },
  });
}

/** Dépose une pièce (multipart) pour un document requis de la demande. */
export function useUploadIntakeDocument(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ documentLabel, file }: { documentLabel: string; file: File }) => {
      const fd = new FormData();
      fd.append('documentLabel', documentLabel);
      fd.append('file', file);
      const res = await fetch(`/api/intake/${id}/documents`, { method: 'POST', body: fd });
      if (!res.ok) {
        let msg = `Échec de l'upload (${res.status})`;
        try {
          const data = await res.json();
          msg = data?.error || msg;
        } catch {
          /* noop */
        }
        throw new Error(msg);
      }
      return res.json() as Promise<{ file: { id: string; documentLabel: string; fileName: string }; completeness: number }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: intakeKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: intakeKeys.uploadedFiles(id) });
      queryClient.invalidateQueries({ queryKey: intakeKeys.needsHelp() });
    },
  });
}

export interface UploadedFileMeta {
  id: string;
  documentLabel: string;
  fileName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

/** Liste les pièces déjà déposées (métadonnées). */
export function useIntakeUploadedFiles(id: string) {
  return useQuery({
    queryKey: intakeKeys.uploadedFiles(id),
    queryFn: async () => {
      const res = await fetch(`/api/intake/${id}/documents`, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      return res.json() as Promise<{ files: UploadedFileMeta[]; count: number }>;
    },
    enabled: Boolean(id),
  });
}

/** URL de téléchargement (déchiffré à la volée) d'une pièce. */
export function intakeFileDownloadUrl(id: string, fileId: string): string {
  return `/api/intake/${id}/documents/${fileId}`;
}

/** Supprime une pièce déposée. */
export function useDeleteIntakeDocument(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (fileId: string) => {
      const res = await fetch(`/api/intake/${id}/documents/${fileId}`, { method: 'DELETE' });
      if (!res.ok) {
        let msg = `Échec de la suppression (${res.status})`;
        try {
          const data = await res.json();
          msg = data?.error || msg;
        } catch {
          /* noop */
        }
        throw new Error(msg);
      }
      return res.json() as Promise<{ deleted: boolean; completeness: number }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: intakeKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: intakeKeys.uploadedFiles(id) });
      queryClient.invalidateQueries({ queryKey: intakeKeys.needsHelp() });
    },
  });
}
