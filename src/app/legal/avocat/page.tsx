import Button from '@/components/ui/Button';
import SectionHeader from '@/components/ui/SectionHeader';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

export default function AvocatPage() {
  return (
    <main className="min-h-screen">
      <SectionHeader
        title="Espace Avocat"
        subtitle="Outils de conformité, audit et documentation pour vos clients et dossiers."
        actions={<Button variant="primary">Contacter le support</Button>}
      />

      <section className="container py-10 space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Card title="Conformité RGPD" subtitle="Politiques, registres et DPIA">
            <p className="text-gray-700">Téléchargez les modèles et accédez aux registres de traitement, aux politiques de conservation et aux évaluations d'impact (DPIA).</p>
            <div className="mt-4 flex gap-3">
              <Link href="/privacy" className="btn-secondary">Voir la politique</Link>
              <Button variant="ghost">Télécharger les modèles</Button>
            </div>
          </Card>

          <Card title="Audit des accès" subtitle="Traçabilité et preuve">
            <p className="text-gray-700">Consultez les journaux d'accès, exportez des preuves de traçabilité et générez des rapports horodatés pour les procédures.</p>
            <div className="mt-4 flex gap-3">
              <Button variant="primary">Exporter le rapport</Button>
              <Button variant="ghost">Voir les journaux</Button>
            </div>
          </Card>
        </div>

        <Card title="Modèles de contrats">
          <p className="text-gray-700">Bénéficiez de modèles de contrats de traitement, clauses types, et avenants de confidentialité prêts à l’emploi.</p>
          <div className="mt-4">
            <Button variant="secondary">Télécharger le pack</Button>
          </div>
        </Card>
      </section>
    </main>
  );
}
