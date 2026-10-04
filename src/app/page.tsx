import { redirect } from 'next/navigation';

// Force dynamic : évite le prerender statique du redirect (erreur Next 16/React 19).
export const dynamic = 'force-dynamic';

export default function RootPage() {
  redirect('/fr');
}
