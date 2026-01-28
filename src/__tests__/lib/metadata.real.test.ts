/**
 * Tests pour metadata.ts - Métadonnées SEO
 * Tests des constantes et fonctions de métadonnées
 */

import {
  defaultMetadata,
  createPageMetadata,
  sectionMetadata,
} from '@/lib/metadata';

describe('metadata - Métadonnées SEO', () => {
  
  // ============================================
  // defaultMetadata
  // ============================================
  describe('defaultMetadata', () => {
    test('contient un titre par défaut', () => {
      expect(defaultMetadata.title).toBeDefined();
      expect((defaultMetadata.title as any).default).toContain('IA Poste Manager');
    });

    test('contient un template de titre', () => {
      expect((defaultMetadata.title as any).template).toContain('IA Poste Manager');
    });

    test('contient une description', () => {
      expect(defaultMetadata.description).toBeDefined();
      expect(defaultMetadata.description).toContain('gestion');
    });

    test('contient des mots-clés SEO', () => {
      expect(defaultMetadata.keywords).toBeDefined();
      expect(Array.isArray(defaultMetadata.keywords)).toBe(true);
      expect(defaultMetadata.keywords!.length).toBeGreaterThan(0);
    });

    test('inclut des mots-clés juridiques', () => {
      const keywords = defaultMetadata.keywords as string[];
      const hasJuridique = keywords.some(k => 
        k.toLowerCase().includes('juridique') || 
        k.toLowerCase().includes('avocat')
      );
      expect(hasJuridique).toBe(true);
    });

    test('inclut des mots-clés IA', () => {
      const keywords = defaultMetadata.keywords as string[];
      const hasIA = keywords.some(k => 
        k.toLowerCase().includes('ia') || 
        k.toLowerCase().includes('intelligence artificielle')
      );
      expect(hasIA).toBe(true);
    });

    test('contient les informations auteur', () => {
      expect(defaultMetadata.authors).toBeDefined();
      expect(Array.isArray(defaultMetadata.authors)).toBe(true);
    });

    test('contient creator et publisher', () => {
      expect(defaultMetadata.creator).toBe('IA Poste Manager');
      expect(defaultMetadata.publisher).toBe('IA Poste Manager');
    });

    test('configure les robots correctement', () => {
      expect(defaultMetadata.robots).toBeDefined();
      expect((defaultMetadata.robots as any).index).toBe(true);
      expect((defaultMetadata.robots as any).follow).toBe(true);
    });

    test('configure googleBot', () => {
      const googleBot = (defaultMetadata.robots as any).googleBot;
      expect(googleBot).toBeDefined();
      expect(googleBot.index).toBe(true);
      expect(googleBot.follow).toBe(true);
    });

    test('contient la configuration OpenGraph', () => {
      expect(defaultMetadata.openGraph).toBeDefined();
      expect((defaultMetadata.openGraph as any).type).toBe('website');
      expect((defaultMetadata.openGraph as any).locale).toBe('fr_FR');
    });

    test('contient siteName dans OpenGraph', () => {
      expect((defaultMetadata.openGraph as any).siteName).toBe('IA Poste Manager');
    });

    test('contient des images OpenGraph', () => {
      expect((defaultMetadata.openGraph as any).images).toBeDefined();
      expect(Array.isArray((defaultMetadata.openGraph as any).images)).toBe(true);
    });

    test('configure les images OG avec dimensions', () => {
      const images = (defaultMetadata.openGraph as any).images;
      expect(images[0].width).toBe(1200);
      expect(images[0].height).toBe(630);
    });

    test('contient la configuration Twitter', () => {
      expect(defaultMetadata.twitter).toBeDefined();
      expect((defaultMetadata.twitter as any).card).toBe('summary_large_image');
    });

    test('contient le creator Twitter', () => {
      expect((defaultMetadata.twitter as any).creator).toBe('@memoLib');
    });

    test('contient les icônes', () => {
      expect(defaultMetadata.icons).toBeDefined();
      expect((defaultMetadata.icons as any).icon).toBeDefined();
      expect((defaultMetadata.icons as any).apple).toBeDefined();
    });

    test('contient le manifest', () => {
      expect(defaultMetadata.manifest).toBe('/manifest.json');
    });

    test('contient les alternates avec canonical', () => {
      expect(defaultMetadata.alternates).toBeDefined();
      expect((defaultMetadata.alternates as any).canonical).toBeDefined();
    });
  });

  // ============================================
  // createPageMetadata
  // ============================================
  describe('createPageMetadata', () => {
    test('crée des métadonnées avec titre', () => {
      const meta = createPageMetadata('Ma Page');
      expect(meta.title).toBe('Ma Page');
    });

    test('utilise la description par défaut si non fournie', () => {
      const meta = createPageMetadata('Page Test');
      expect(meta.description).toBe(defaultMetadata.description);
    });

    test('utilise une description personnalisée', () => {
      const customDesc = 'Description personnalisée pour la page';
      const meta = createPageMetadata('Page Test', customDesc);
      expect(meta.description).toBe(customDesc);
    });

    test('génère l\'URL canonique avec path', () => {
      const meta = createPageMetadata('Dossiers', 'Description', '/dossiers');
      expect(meta.alternates).toBeDefined();
      expect((meta.alternates as any).canonical).toContain('/dossiers');
    });

    test('ne génère pas d\'alternates sans path', () => {
      const meta = createPageMetadata('Sans Path', 'Description');
      expect(meta.alternates).toBeUndefined();
    });

    test('configure OpenGraph avec le titre', () => {
      const meta = createPageMetadata('Page OG');
      expect((meta.openGraph as any).title).toBe('Page OG');
    });

    test('configure OpenGraph avec description personnalisée', () => {
      const meta = createPageMetadata('Page', 'Desc custom');
      expect((meta.openGraph as any).description).toBe('Desc custom');
    });

    test('configure OpenGraph URL avec path', () => {
      const meta = createPageMetadata('Page', 'Desc', '/custom-path');
      expect((meta.openGraph as any).url).toContain('/custom-path');
    });

    test('OpenGraph URL est undefined sans path', () => {
      const meta = createPageMetadata('Page', 'Desc');
      expect((meta.openGraph as any).url).toBeUndefined();
    });
  });

  // ============================================
  // sectionMetadata
  // ============================================
  describe('sectionMetadata', () => {
    test('contient les métadonnées dashboard', () => {
      expect(sectionMetadata.dashboard).toBeDefined();
      expect(sectionMetadata.dashboard.title).toBe('Tableau de bord');
    });

    test('contient les métadonnées dossiers', () => {
      expect(sectionMetadata.dossiers).toBeDefined();
      expect(sectionMetadata.dossiers.title).toBe('Dossiers');
    });

    test('contient les métadonnées clients', () => {
      expect(sectionMetadata.clients).toBeDefined();
      expect(sectionMetadata.clients.title).toBe('Clients');
    });

    test('contient les métadonnées factures', () => {
      expect(sectionMetadata.factures).toBeDefined();
      expect(sectionMetadata.factures.title).toBe('Facturation');
    });

    test('contient les métadonnées documents', () => {
      expect(sectionMetadata.documents).toBeDefined();
      expect(sectionMetadata.documents.title).toBe('Documents');
    });

    test('contient les métadonnées settings', () => {
      expect(sectionMetadata.settings).toBeDefined();
      expect(sectionMetadata.settings.title).toBe('Paramètres');
    });

    test('chaque section a une description', () => {
      Object.values(sectionMetadata).forEach(section => {
        expect(section.description).toBeDefined();
        expect(typeof section.description).toBe('string');
      });
    });

    test('chaque section a les alternates configurés', () => {
      Object.values(sectionMetadata).forEach(section => {
        expect(section.alternates).toBeDefined();
      });
    });

    test('dashboard pointe vers /dashboard', () => {
      expect((sectionMetadata.dashboard.alternates as any).canonical).toContain('/dashboard');
    });

    test('dossiers pointe vers /dossiers', () => {
      expect((sectionMetadata.dossiers.alternates as any).canonical).toContain('/dossiers');
    });

    test('factures pointe vers /factures', () => {
      expect((sectionMetadata.factures.alternates as any).canonical).toContain('/factures');
    });
  });

  // ============================================
  // Cohérence des métadonnées
  // ============================================
  describe('Cohérence des métadonnées', () => {
    test('toutes les sections utilisent createPageMetadata', () => {
      // Vérifie que les sections ont la même structure
      Object.values(sectionMetadata).forEach(section => {
        expect(section.title).toBeDefined();
        expect(section.description).toBeDefined();
        expect(section.openGraph).toBeDefined();
      });
    });

    test('les URLs sont cohérentes', () => {
      expect((sectionMetadata.dashboard.alternates as any).canonical).toContain('/dashboard');
      expect((sectionMetadata.clients.alternates as any).canonical).toContain('/clients');
      expect((sectionMetadata.settings.alternates as any).canonical).toContain('/settings');
    });
  });
});
