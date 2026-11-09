import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { rechercherArticleCESEDA } from '@/lib/piste-client';

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const article = searchParams.get('article');
    
    if (!article) {
      return NextResponse.json({ error: "Paramètre 'article' manquant" }, { status: 400 });
    }

    const data = await rechercherArticleCESEDA(article);
    return NextResponse.json(data);

  } catch (error) {
    console.error("[LEGAL_API] Erreur:", error);
    return NextResponse.json({ error: "Erreur lors de la recherche juridique" }, { status: 500 });
  }
}
