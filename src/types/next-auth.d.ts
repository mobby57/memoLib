import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface User {
    id?: string;
    tenantId?: string;
    tenantName?: string;
    tenantPlan?: string;
    role?: string;
    groups?: string[];
    rbacPermissions?: string[];
  }

  interface Session {
    user: DefaultSession['user'] & {
      id?: string;
      tenantId?: string;
      tenantName?: string;
      tenantPlan?: string;
      role?: string;
      groups?: string[];
      rbacPermissions?: string[];
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    tenantId?: string;
    tenantName?: string;
    tenantPlan?: string;
    role?: string;
    groups?: string[];
    rbacPermissions?: string[];
  }
}
