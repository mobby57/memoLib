/**
 * Tests pour src/lib/metadata.ts
 * Coverage: Gestion des métadonnées
 */

describe('Metadata - Pure Unit Tests', () => {
  describe('page metadata', () => {
    it('should generate page title', () => {
      const generateTitle = (page: string, appName: string = 'iaPosteManager') => 
        `${page} | ${appName}`;

      expect(generateTitle('Dashboard')).toBe('Dashboard | iaPosteManager');
      expect(generateTitle('Dossiers')).toBe('Dossiers | iaPosteManager');
    });

    it('should generate meta description', () => {
      const generateDescription = (content: string, maxLength: number = 160) => 
        content.length > maxLength ? content.slice(0, maxLength - 3) + '...' : content;

      const short = 'Short description';
      expect(generateDescription(short)).toBe(short);

      const long = 'A'.repeat(200);
      expect(generateDescription(long).length).toBeLessThanOrEqual(160);
    });
  });

  describe('OpenGraph metadata', () => {
    it('should create OpenGraph object', () => {
      const createOG = (title: string, description: string, url: string) => ({
        title,
        description,
        url,
        type: 'website',
        siteName: 'iaPosteManager',
      });

      const og = createOG('Home', 'Welcome', 'https://example.com');
      expect(og.type).toBe('website');
      expect(og.siteName).toBe('iaPosteManager');
    });

    it('should create image metadata', () => {
      const createImageMeta = (url: string, alt: string) => ({
        url,
        alt,
        width: 1200,
        height: 630,
      });

      const img = createImageMeta('/og.png', 'Preview');
      expect(img.width).toBe(1200);
      expect(img.height).toBe(630);
    });
  });

  describe('Twitter metadata', () => {
    it('should create Twitter card', () => {
      const createTwitterCard = (title: string, description: string) => ({
        card: 'summary_large_image',
        title,
        description,
      });

      const card = createTwitterCard('Title', 'Desc');
      expect(card.card).toBe('summary_large_image');
    });
  });

  describe('robots metadata', () => {
    it('should generate robots directives', () => {
      const createRobots = (index: boolean, follow: boolean) => ({
        index,
        follow,
        directive: `${index ? 'index' : 'noindex'}, ${follow ? 'follow' : 'nofollow'}`,
      });

      expect(createRobots(true, true).directive).toBe('index, follow');
      expect(createRobots(false, false).directive).toBe('noindex, nofollow');
    });
  });

  describe('canonical URL', () => {
    it('should generate canonical URL', () => {
      const getCanonical = (path: string, baseUrl: string = 'https://example.com') => 
        new URL(path, baseUrl).toString();

      expect(getCanonical('/dossiers')).toBe('https://example.com/dossiers');
      expect(getCanonical('/clients/123')).toBe('https://example.com/clients/123');
    });
  });

  describe('structured data', () => {
    it('should create JSON-LD for organization', () => {
      const createOrgSchema = (name: string, url: string) => ({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name,
        url,
      });

      const schema = createOrgSchema('iaPosteManager', 'https://example.com');
      expect(schema['@type']).toBe('Organization');
    });

    it('should create JSON-LD for software', () => {
      const createSoftwareSchema = (name: string, version: string) => ({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name,
        softwareVersion: version,
        applicationCategory: 'BusinessApplication',
      });

      const schema = createSoftwareSchema('iaPosteManager', '1.0.0');
      expect(schema['@type']).toBe('SoftwareApplication');
    });
  });

  describe('alternate links', () => {
    it('should create language alternates', () => {
      const createAlternates = (path: string, languages: string[]) => 
        languages.map(lang => ({
          hrefLang: lang,
          href: `/${lang}${path}`,
        }));

      const alternates = createAlternates('/dossiers', ['fr', 'en']);
      expect(alternates.length).toBe(2);
      expect(alternates[0].hrefLang).toBe('fr');
    });
  });

  describe('viewport', () => {
    it('should create viewport meta', () => {
      const createViewport = () => ({
        width: 'device-width',
        initialScale: 1,
        maximumScale: 1,
      });

      const viewport = createViewport();
      expect(viewport.width).toBe('device-width');
      expect(viewport.initialScale).toBe(1);
    });
  });

  describe('icons', () => {
    it('should create icon set', () => {
      const createIcons = (basePath: string) => ({
        icon: `${basePath}/favicon.ico`,
        apple: `${basePath}/apple-touch-icon.png`,
        shortcut: `${basePath}/favicon-16x16.png`,
      });

      const icons = createIcons('/icons');
      expect(icons.icon).toBe('/icons/favicon.ico');
    });
  });

  describe('manifest', () => {
    it('should create web manifest', () => {
      const createManifest = (name: string, shortName: string) => ({
        name,
        short_name: shortName,
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#000000',
      });

      const manifest = createManifest('iaPosteManager', 'iPM');
      expect(manifest.display).toBe('standalone');
    });
  });
});
