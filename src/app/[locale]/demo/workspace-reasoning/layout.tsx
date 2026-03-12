import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/metadata';

export function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Metadata {
  return createPageMetadata({
    title: 'Demo Raisonnement Dossier - MemoLib',
    description:
      'Visualisez le raisonnement IA de MemoLib pour classifier l urgence, identifier le client et structurer un dossier juridique.',
    path: '/demo/workspace-reasoning',
    locale: params.locale,
    keywords: ['raisonnement ia juridique', 'classification urgence oqtf', 'demo cabinet avocat'],
  });
}

export default function DemoWorkspaceReasoningLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
