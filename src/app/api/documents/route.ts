import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST - Upload et traitement OCR d'un document
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const tenantId = formData.get('tenantId') as string;
    const dossierId = formData.get('dossierId') as string | null;
    const clientId = formData.get('clientId') as string | null;
    const category = formData.get('category') as string | null;
    const uploadedBy = formData.get('uploadedBy') as string;

    if (!file || !tenantId || !uploadedBy) {
      return NextResponse.json(
        { error: 'file, tenantId et uploadedBy requis' },
        { status: 400 }
      );
    }

    // Lire le contenu du fichier
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Générer une clé de stockage unique
    const timestamp = Date.now();
    const storageKey = `documents/${tenantId}/${timestamp}-${file.name}`;

    // Créer l'enregistrement du document
    const document = await prisma.document.create({
      data: {
        tenantId,
        dossierId,
        clientId,
        filename: `${timestamp}-${file.name}`,
        originalName: file.name,
        mimeType: file.type,
        size: buffer.length,
        storageKey,
        category,
        uploadedBy,
        ocrProcessed: false,
        aiAnalyzed: false,
      },
    });

    // Lancer le traitement OCR en arrière-plan
    processOCR(document.id, buffer, file.type).catch(console.error);

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        filename: document.originalName,
        status: 'processing',
      },
    });
  } catch (error) {
    console.error('Erreur upload document:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// GET - Récupérer les documents
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const dossierId = searchParams.get('dossierId');
    const clientId = searchParams.get('clientId');
    const documentId = searchParams.get('id');

    if (documentId) {
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        include: {
          dossier: { select: { numero: true } },
          client: { select: { firstName: true, lastName: true } },
          uploader: { select: { name: true, email: true } },
        },
      });
      return NextResponse.json({ document });
    }

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });
    }

    const documents = await prisma.document.findMany({
      where: {
        tenantId,
        ...(dossierId ? { dossierId } : {}),
        ...(clientId ? { clientId } : {}),
      },
      include: {
        dossier: { select: { numero: true } },
        client: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Erreur GET documents:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// Fonction de traitement OCR
async function processOCR(documentId: string, buffer: Buffer, mimeType: string) {
  try {
    console.log(`🔍 Démarrage OCR pour document ${documentId}`);

    let extractedText = '';
    let confidence = 0;
    let extractedData: Record<string, unknown> = {};

    // Déterminer le type de document et extraire le texte
    if (mimeType === 'application/pdf') {
      // Pour PDF: utiliser pdf-parse ou appeler un service externe
      const result = await extractTextFromPDF(buffer);
      extractedText = result.text;
      confidence = result.confidence;
    } else if (mimeType.startsWith('image/')) {
      // Pour images: utiliser Tesseract.js ou un service OCR
      const result = await extractTextFromImage(buffer);
      extractedText = result.text;
      confidence = result.confidence;
    } else {
      // Autres types: essayer d'extraire le texte brut
      extractedText = buffer.toString('utf-8');
      confidence = 1.0;
    }

    // Analyser le contenu avec l'IA pour extraire des données structurées
    if (extractedText.length > 0) {
      extractedData = await analyzeDocumentContent(extractedText);
    }

    // Mettre à jour le document avec les résultats OCR
    await prisma.document.update({
      where: { id: documentId },
      data: {
        ocrProcessed: true,
        ocrText: extractedText.substring(0, 50000), // Limiter la taille
        ocrConfidence: confidence,
        extractedData: JSON.stringify(extractedData),
      },
    });

    console.log(`✅ OCR terminé pour document ${documentId}`);
  } catch (error) {
    console.error(`❌ Erreur OCR pour document ${documentId}:`, error);
    
    await prisma.document.update({
      where: { id: documentId },
      data: {
        ocrProcessed: true,
        ocrConfidence: 0,
        extractedData: JSON.stringify({ error: 'Échec du traitement OCR' }),
      },
    });
  }
}

// Extraction de texte depuis PDF (simulation)
async function extractTextFromPDF(buffer: Buffer): Promise<{ text: string; confidence: number }> {
  // En production: utiliser pdf-parse ou pdf.js
  // npm install pdf-parse
  try {
    // Simulation - en prod, utiliser:
    // const pdfParse = require('pdf-parse');
    // const data = await pdfParse(buffer);
    // return { text: data.text, confidence: 0.95 };
    
    return {
      text: `[Contenu PDF extrait - ${buffer.length} bytes]`,
      confidence: 0.9,
    };
  } catch {
    return { text: '', confidence: 0 };
  }
}

// Extraction de texte depuis image (simulation)
async function extractTextFromImage(buffer: Buffer): Promise<{ text: string; confidence: number }> {
  // En production: utiliser Tesseract.js ou Google Vision API
  // npm install tesseract.js
  try {
    // Simulation - en prod, utiliser:
    // const Tesseract = require('tesseract.js');
    // const { data: { text, confidence } } = await Tesseract.recognize(buffer, 'fra');
    // return { text, confidence: confidence / 100 };
    
    return {
      text: `[Texte OCR extrait - ${buffer.length} bytes]`,
      confidence: 0.85,
    };
  } catch {
    return { text: '', confidence: 0 };
  }
}

// Analyse IA du contenu du document
async function analyzeDocumentContent(text: string): Promise<Record<string, unknown>> {
  try {
    // Appeler Ollama pour analyser le document
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2:latest',
        prompt: `Analyse ce document et extrait les informations clés au format JSON:
- type de document (facture, contrat, identité, courrier, etc.)
- dates mentionnées
- montants/sommes
- noms/personnes
- numéros de référence
- résumé en 2 phrases

Document:
${text.substring(0, 3000)}

Réponds uniquement en JSON valide.`,
        stream: false,
      }),
    });

    if (!response.ok) {
      return { analyzed: false };
    }

    const data = await response.json();
    const responseText = data.response || '';

    // Essayer d'extraire le JSON de la réponse
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return { summary: responseText.substring(0, 500), analyzed: true };
  } catch (error) {
    console.error('Erreur analyse IA:', error);
    return { analyzed: false, error: 'Analyse IA non disponible' };
  }
}
