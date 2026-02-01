import 'next-auth';

declare module 'next-auth' {
  interface User {
    id?: string;
    tenantId?: string;
    tenantName?: string;
    tenantPlan?: string;
    role?: string;
  }

  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      tenantId?: string;
      tenantName?: string;
      tenantPlan?: string;
      role?: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    tenantId?: string;
    tenantName?: string;
    tenantPlan?: string;
    role?: string;
  }
}
