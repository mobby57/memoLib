export default function cloudflareLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  if (process.env.NODE_ENV !== 'production' || src.startsWith('data:')) {
    return src;
  }

  const cdnDomain = process.env.NEXT_PUBLIC_CDN_DOMAIN || 'https://cdn.memolib.app';
  const params = [
    `width=${width}`,
    `quality=${quality || 80}`,
    'format=auto',
    'fit=scale-down',
  ];

  const imageUrl = src.startsWith('http') ? src : `${cdnDomain}${src}`;
  return `${cdnDomain}/cdn-cgi/image/${params.join(',')}/${imageUrl}`;
}
