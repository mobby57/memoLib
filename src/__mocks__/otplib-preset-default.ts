export const authenticator = {
  generate: (_secret?: string) => '123456',
  verify: ({ token, secret }: { token: string; secret: string }) => {
    return typeof token === 'string' && token.length > 0 && typeof secret === 'string';
  },
  keyuri: (account: string, issuer: string, secret: string) => `${issuer}:${account}:${secret}`,
};
