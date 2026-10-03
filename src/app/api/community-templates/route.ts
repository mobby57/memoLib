import { auth } from '@/lib/clerk-auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/community-templates
 * Liste les templates communautaires publics, triés par upvotes.
 */
export async function GET(req: NextRequest) {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const typeDossier = req.nextUrl.searchParams.get('typeDossier');
  const typeRecours = req.nextUrl.searchParams.get('typeRecours');
  const category = req.nextUrl.searchParams.get('category');
  const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '20'), 50);

  const where: any = { isPublic: true };
  if (typeDossier) where.typeDossier = typeDossier;
  if (typeRecours) where.typeRecours = typeRecours;
  if (category) where.category = category;

  const [templates, total] = await Promise.all([
    prisma.communityTemplate.findMany({
      where,
      orderBy: { upvotes: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        typeDossier: true,
        typeRecours: true,
        juridiction: true,
        variables: true,
        authorName: true,
        upvotes: true,
        downvotes: true,
        usageCount: true,
        createdAt: true,
      },
    }),
    prisma.communityTemplate.count({ where }),
  ]);

  return NextResponse.json({
    templates,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

/**
 * POST /api/community-templates
 * Publie un nouveau template communautaire.
 */
export async function POST(req: NextRequest) {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const body = await req.json();
  const { title, description, category, typeDossier, typeRecours, juridiction, content, variables } = body;

  if (!title || !category || !typeDossier || !content) {
    return NextResponse.json({ error: 'Champs requis : title, category, typeDossier, content' }, { status: 400 });
  }

  const template = await prisma.communityTemplate.create({
    data: {
      title,
      description,
      category,
      typeDossier,
      typeRecours,
      juridiction,
      content,
      variables: variables || [],
      authorId: user.id,
      authorName: user.name || 'Anonyme',
      tenantId: user.tenantId,
      isPublic: true,
    },
  });

  return NextResponse.json({ success: true, template }, { status: 201 });
}




