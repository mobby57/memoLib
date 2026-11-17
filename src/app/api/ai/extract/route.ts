import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'OQTF', 'TITRE_SEJOUR', etc.

    if (!file) return new NextResponse('No file provided', { status: 400 });

    // Conversion du fichier en Base64 pour l'API Vision
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const mimeType = file.type || 'application/pdf';

    // ⚠️ Appel à Mistral AI (ou fallback si pas de clé)
    const apiKey = process.env.MISTRAL_API_KEY;
    
    let extractedData;

    if (apiKey) {
      // APPEL RÉEL À L'IA (Mistral Pixtral)
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'pixtral-12b-2409', // Modèle Vision de Mistral
          messages: [
            {
              role: 'system',
              content: `Tu es un assistant juridique expert. Extrais les informations de ce document de type ${type}. 
              Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour.
              Format attendu : {"nom": "", "prenom": "", "dateNaissance": "", "nationalite": "", "numeroDocument": "", "dateNotification": ""}`
            },
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Voici le document, extrait les données :' },
                { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } }
              ]
            }
          ],
          response_format: { type: 'json_object' }
        }),
      });

      const data = await response.json();
      extractedData = JSON.parse(data.choices[0].message.content);
    } else {
      // FALLBACK POUR LA DÉMO (Si pas de clé Mistral)
      console.log('⚠️ Pas de MISTRAL_API_KEY, utilisation du mock');
      await new Promise(r => setTimeout(r, 1500)); // Simule le temps de l'IA
      extractedData = {
        nom: 'Dupont',
        prenom: 'Marie',
        dateNaissance: '1990-05-15',
        nationalite: 'Française',
        numeroDocument: '12AB34567',
        dateNotification: new Date().toISOString().split('T')[0]
      };
    }

    return NextResponse.json({ success: true, data: extractedData });

  } catch (error: any) {
    console.error('AI Extraction Error:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'analyse du document' }, { status: 500 });
  }
}
