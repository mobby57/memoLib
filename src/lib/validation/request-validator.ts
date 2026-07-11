import { NextResponse } from 'next/server';
import { ZodSchema, ZodError } from 'zod';

/**
 * Validate request body against a Zod schema
 * Returns { valid: true, data } on success
 * Returns { valid: false, response } on validation error
 */
export function validateRequest<T>(
  body: unknown,
  schema: ZodSchema
): { valid: true; data: T } | { valid: false; response: NextResponse } {
  try {
    const validated = schema.parse(body);
    return { valid: true, data: validated as T };
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors = error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      return {
        valid: false,
        response: NextResponse.json(
          {
            error: 'Validation error',
            issues: formattedErrors,
            details: formattedErrors.map((e) => `${e.field}: ${e.message}`).join('; '),
          },
          { status: 400 }
        ),
      };
    }

    return {
      valid: false,
      response: NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      ),
    };
  }
}

/**
 * Validate query parameters against a Zod schema
 */
export function validateQuery<T>(
  params: Record<string, string | string[] | undefined>,
  schema: ZodSchema
): { valid: true; data: T } | { valid: false; response: NextResponse } {
  // Convert URLSearchParams to object for validation
  const paramObject = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined)
  );

  return validateRequest(paramObject, schema);
}

/**
 * Parse and validate JSON body in one step
 */
export async function parseAndValidate<T>(
  request: Request,
  schema: ZodSchema
): Promise<{ valid: true; data: T } | { valid: false; response: NextResponse }> {
  try {
    const body = await request.json();
    return validateRequest(body, schema);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        valid: false,
        response: NextResponse.json(
          { error: 'Invalid JSON in request body' },
          { status: 400 }
        ),
      };
    }

    return {
      valid: false,
      response: NextResponse.json(
        { error: 'Failed to parse request' },
        { status: 400 }
      ),
    };
  }
}
