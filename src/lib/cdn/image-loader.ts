/**
 * Custom Image Loader for CloudFlare CDN
 * 
 * Optimizes images using CloudFlare's Image Resizing service
 * https://developers.cloudflare.com/images/image-resizing/
 */

export default function cloudflareLoader({
    src,
    width,
    quality,
}: {
    src: string;
    width: number;
    quality?: number;
}) {
    // If development or src is already optimized, return as-is
    if (process.env.NODE_ENV !== 'production' || src.startsWith('data:')) {
        return src;
    }

    // CloudFlare CDN domain
    const cdnDomain = process.env.NEXT_PUBLIC_CDN_DOMAIN || 'https://cdn.memolib.app';

    // Build CloudFlare Image Resizing URL
    const params = [
        `width=${width}`,
        `quality=${quality || 80}`,
        'format=auto', // Auto-detect best format (WebP, AVIF)
        'fit=scale-down',
    ];

    // Handle absolute vs relative URLs
    const imageUrl = src.startsWith('http') ? src : `${cdnDomain}${src}`;

    return `${cdnDomain}/cdn-cgi/image/${params.join(',')}/${imageUrl}`;
}
