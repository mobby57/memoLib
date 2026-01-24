'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, FileText, AlertCircle, Euro, User } from 'lucide-react';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [client, setClient] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/clients/${params.id}`)
      .then(res => res.json())
      .then(data => {
        setClient(data.client);
        setStats(data.stats);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="p-8">Chargement...</div>;
  if (!client) return <div className="p-8">Client non trouvé</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informations Client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-2xl font-bold">{client.firstName} {client.lastName}</h3>
                <Badge variant={client.user?.status === 'active' ? 'default' : 'secondary'}>
                  {client.user?.status || 'Inactif'}
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>{client.email}</span>
                </div>
                {client.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{client.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>Créé le {new Date(client.createdAt).toLocaleDateString('fr-FR')}</span>
                </div>
                {client.user?.lastLogin && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>Dernière connexion: {new Date(client.user.lastLogin).toLocaleDateString('fr-FR')}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Statistiques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold">{stats.totalDossiers}</div>
                  <div className="text-sm text-gray-600">Dossiers</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold">{stats.dossiersActifs}</div>
                  <div className="text-sm text-gray-600">En cours</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                  <div className="text-2xl font-bold">{stats.echeancesProches}</div>
                  <div className="text-sm text-gray-600">Échéances</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Euro className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <div className="text-2xl font-bold">{stats.montantTotal}€</div>
                  <div className="text-sm text-gray-600">Total factures</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="dossiers" className="w-full">
          <TabsList>
            <TabsTrigger value="dossiers">Dossiers ({stats.totalDossiers})</TabsTrigger>
            <TabsTrigger value="documents">Documents ({stats.totalDocuments})</TabsTrigger>
            <TabsTrigger value="factures">Factures ({stats.totalFactures})</TabsTrigger>
          </TabsList>

          <TabsContent value="dossiers" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {client.dossiers.map((dossier: any) => (
                    <div key={dossier.id} className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                         onClick={() => router.push(`/admin/dossiers/${dossier.id}`)}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{dossier.numero}</h4>
                          <p className="text-sm text-gray-600">{dossier.typeDossier}</p>
                          <p className="text-sm mt-1">{dossier.objet}</p>
                        </div>
                        <Badge variant={
                          dossier.statut === 'termine' ? 'default' :
                          dossier.statut === 'en_cours' ? 'secondary' : 'outline'
                        }>
                          {dossier.statut}
                        </Badge>
                      </div>
                      <div className="flex gap-4 mt-3 text-xs text-gray-500">
                        <span>{dossier.documents.length} documents</span>
                        <span>{dossier.echeances.length} échéances</span>
                        <span>Créé le {new Date(dossier.createdAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  ))}
                  {client.dossiers.length === 0 && (
                    <p className="text-center text-gray-500 py-8">Aucun dossier</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-2">
                  {client.dossiers.flatMap((d: any) => d.documents).map((doc: any) => (
                    <div key={doc.id} className="flex justify-between items-center p-3 border rounded hover:bg-gray-50">
                      <div>
                        <p className="font-medium">{doc.originalName}</p>
                        <p className="text-xs text-gray-500">{(doc.size / 1024).toFixed(2)} KB</p>
                      </div>
                      <Button size="sm" variant="outline">Télécharger</Button>
                    </div>
                  ))}
                  {stats.totalDocuments === 0 && (
                    <p className="text-center text-gray-500 py-8">Aucun document</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="factures" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-2">
                  {client.dossiers.flatMap((d: any) => d.factures).map((facture: any) => (
                    <div key={facture.id} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <p className="font-medium">{facture.numero}</p>
                        <p className="text-sm text-gray-600">
                          Échéance: {new Date(facture.dateEcheance).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{facture.montant}€</p>
                        <Badge variant={facture.statut === 'payee' ? 'default' : 'secondary'}>
                          {facture.statut}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {stats.totalFactures === 0 && (
                    <p className="text-center text-gray-500 py-8">Aucune facture</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
