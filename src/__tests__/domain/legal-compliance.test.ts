import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import fs from 'fs';
import path from 'path';

describe('Legal Compliance', () => {
  const docsLegalDir = path.join(process.cwd(), 'docs', 'legal');

  describe('Documents juridiques requis', () => {
    it('devrait avoir un DPA template', () => {
      const filePath = path.join(docsLegalDir, 'DPA_TEMPLATE.md');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('article 28 du RGPD');
      expect(content).toContain('sous-traitant');
      expect(content).toContain('chiffrement');
    });

    it('devrait avoir des CGU/CGV', () => {
      const filePath = path.join(docsLegalDir, 'CGU_CGV.md');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('Limitation de responsabilit');
      expect(content).toContain('conseil juridique');
      expect(content).toContain('secret professionnel');
    });

    it('devrait avoir une stratégie HDS', () => {
      const filePath = path.join(docsLegalDir, 'HDS_STRATEGY.md');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('HDS');
      expect(content).toContain('OVHcloud');
      expect(content).toContain('données de santé');
    });

    it('devrait avoir un guide eIDAS', () => {
      const filePath = path.join(docsLegalDir, 'EIDAS_TIMESTAMP_GUIDE.md');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('qualifié');
      expect(content).toContain('Universign');
      expect(content).toContain('RFC 3161');
    });
  });

  describe('DPA — contenu obligatoire RGPD art.28', () => {
    let dpaContent: string;

    beforeAll(() => {
      dpaContent = fs.readFileSync(path.join(docsLegalDir, 'DPA_TEMPLATE.md'), 'utf-8');
    });

    it('devrait définir l\'objet et la durée du traitement', () => {
      expect(dpaContent).toContain('Objet');
      expect(dpaContent).toContain('Durée');
    });

    it('devrait définir les catégories de données', () => {
      expect(dpaContent).toContain('Catégories de données');
      expect(dpaContent).toContain('Catégories de personnes');
    });

    it('devrait mentionner les obligations de sécurité', () => {
      expect(dpaContent).toContain('Article 32 RGPD');
      expect(dpaContent).toContain('AES-256-GCM');
    });

    it('devrait prévoir la notification de violation', () => {
      expect(dpaContent).toContain('24 heures');
      expect(dpaContent).toContain('CNIL');
    });

    it('devrait lister les sous-traitants ultérieurs', () => {
      expect(dpaContent).toContain('Vercel');
      expect(dpaContent).toContain('Stripe');
    });

    it('devrait prévoir le sort des données en fin de contrat', () => {
      expect(dpaContent).toContain('suppression définitive');
      expect(dpaContent).toContain('export complet');
    });

    it('devrait mentionner le droit d\'audit', () => {
      expect(dpaContent).toContain('audit');
    });
  });

  describe('CGU/CGV — clauses obligatoires', () => {
    let cguContent: string;

    beforeAll(() => {
      cguContent = fs.readFileSync(path.join(docsLegalDir, 'CGU_CGV.md'), 'utf-8');
    });

    it('devrait contenir le disclaimer IA', () => {
      expect(cguContent).toContain('outil technique');
      expect(cguContent).toContain('ne remplacent');
      expect(cguContent).toContain('jugement professionnel');
    });

    it('devrait mentionner la loi de 1971', () => {
      expect(cguContent).toContain('31 décembre 1971');
    });

    it('devrait limiter la responsabilité', () => {
      expect(cguContent).toContain('12 derniers mois');
      expect(cguContent).toContain('indicatif');
    });

    it('devrait mentionner l\'hébergement UE', () => {
      expect(cguContent).toContain('Union Européenne');
      expect(cguContent).toContain('Paris');
    });

    it('devrait mentionner le chiffrement E2E', () => {
      expect(cguContent).toContain('chiffrement');
      expect(cguContent).toContain('E2E');
      expect(cguContent).toContain('zero-knowledge');
    });
  });

  describe('Vercel config — région EU', () => {
    it('devrait forcer la région Paris (cdg1)', () => {
      const vercelConfig = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), 'vercel.json'), 'utf-8')
      );
      expect(vercelConfig.regions).toContain('cdg1');
    });
  });

  describe('Composants UI légaux', () => {
    it('devrait avoir le composant AIDisclaimer', () => {
      const filePath = path.join(process.cwd(), 'src', 'components', 'legal', 'AIDisclaimer.tsx');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('conseil juridique');
      expect(content).toContain('outil');
    });

    it('devrait avoir le composant LegalFooter', () => {
      const filePath = path.join(process.cwd(), 'src', 'components', 'legal', 'LegalFooter.tsx');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('CGU/CGV');
      expect(content).toContain('conseil juridique');
    });

    it('devrait avoir la page CGU', () => {
      const filePath = path.join(
        process.cwd(), 'src', 'app', '[locale]', 'legal', 'cgu', 'page.tsx'
      );
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });
});
