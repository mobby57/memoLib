export function handlePrismaError(error: any, ctx?: any) {
  return {
    code: error.code || 'PRISMA_ERROR',
    message: error.message || 'Database error',
    status: 500
  };
}

export function getUserFriendlyErrorMessage(code: string) {
  return 'Une erreur est survenue';
}
