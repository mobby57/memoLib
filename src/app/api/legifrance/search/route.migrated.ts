import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/withAuth';
import { legifranceApi } from '@/lib/legifrance/api-client';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const LegifranceSearchSchema = z.object({
  action: z.enum([
    'search-ceseda',
    'get-ceseda-article',
    'search-ceseda-keywords',
    'search-jurisprudence-admin',
    'search-jurisprudence-judiciaire',
    'get-ceseda-recent-caselaw',
    'get-article',
  ]),
  params: z.any(),
});

async function handler(request: NextRequest, context: any) {
  const { userId, tenantId } = context;

  try {
    const body = await request.json();
    const validated = LegifranceSearchSchema.parse(body);

    const { action, params } = validated;

    logger.info(`Requete Legifrance: ${action}`, { userId, tenantId, action });

    let result;

    switch (action) {
      case 'search-ceseda':
        result = await legifranceApi.searchCeseda(params);
        break;

      case 'get-ceseda-article':
        const { numeroArticle, date } = params;
        result = await legifranceApi.getCesedaArticle(numeroArticle, date);
        break;

      case 'search-ceseda-keywords':
        const { keywords, options } = params;
        result = await legifranceApi.searchCesedaByKeywords(keywords, options);
        break;

      case 'search-jurisprudence-admin':
        result = await legifranceApi.searchJurisprudenceAdministrative(params);
        break;

      case 'search-jurisprudence-judiciaire':
        result = await legifranceApi.searchJurisprudenceJudiciaire(params);
        break;

      case 'get-ceseda-recent-caselaw':
        result = await legifranceApi.getCesedaRecentCaseLaw(params);
        break;

      case 'get-article':
        result = await legifranceApi.getArticle(params.articleId);
        break;

      default:
        return NextResponse.json({ error: 'Action non supportee' }, { status: 400 });
    }

    logger.info(`Legifrance ${action} - ${result?.results?.length || 0} resultats`, {
      userId,
      tenantId,
      action,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Parametres invalides', details: error.errors }, { status: 400 });
    }

    logger.error('Erreur Legifrance API', error, { userId, tenantId });
    return NextResponse.json({ error: 'Erreur lors de la recherche Legifrance' }, { status: 500 });
  }
}

export const POST = withAuth(handler, ['ADMIN', 'SUPER_ADMIN']);
