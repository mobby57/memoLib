import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role?: string;
      tenantId?: string;
    tenantName?: string;
    tenantPlan?: string;
      clientId?: string | null;
      groups?: string[];
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    role?: string;
    tenantId?: string;
    clientId?: string | null;
    groups?: string[];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: string;
    tenantId?: string;
    clientId?: string | null;
    groups?: string[];
  }
}
