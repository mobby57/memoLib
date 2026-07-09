'use client';

import { useParams } from 'next/navigation';

/**
 * Hook pour obtenir la locale courante et générer des liens localisés.
 * Utilise le paramètre [locale] de l'App Router.
 * 
 * @example
 * const { locale, href } = useLocale();
 * <Link href={href('/dossiers')}>Dossiers</Link>
 * // → /fr/dossiers
 */
export function useLocale() {
  const params = useParams();
  const locale = (params?.locale as string) || 'fr';

  const href = (path: string) => {
    if (path.startsWith(`/${locale}/`) || path.startsWith(`/${locale}`)) {
      return path;
    }
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `/${locale}${cleanPath}`;
  };

  return { locale, href };
}
