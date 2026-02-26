'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PaiementVirementPage() {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Paiement Virement</CardTitle>
          <CardDescription>
            Priorité: 🟢 Basse
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Cette page est en cours de développement.
            </p>
            <div className="rounded-lg border p-4 bg-muted/50">
              <h3 className="font-semibold mb-2">Fonctionnalités prévues:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Interface utilisateur complète</li>
                <li>Intégration avec l'API backend</li>
                <li>Validation des données</li>
                <li>Gestion des erreurs</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
