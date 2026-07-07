import { NextRequest, NextResponse } from 'next/server';

export type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; response: NextResponse };

/**
 * Parse et valide le body JSON d'une requête.
 * Vérifie le Content-Type et gère les erreurs de parsing.
 *
 * @example
 * const parsed = await parseJsonBody<CreateDossierRequest>(request);
 * if (!parsed.success) return parsed.response;
 * const data = parsed.data;
 */
export async function parseJsonBody<T = Record<string, unknown>>(
  request: NextRequest
): Promise<ParseResult<T>> {
  const contentType = request.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Content-Type application/json requis.' },
        { status: 415 }
      ),
    };
  }

  try {
    const data = await request.json() as T;
    return { success: true, data };
  } catch {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Corps de requête invalide. JSON attendu.' },
        { status: 400 }
      ),
    };
  }
}
