import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export type SubscriptionFeatures = {
  hasAIFeatures: boolean;
  hasAdvancedReports: boolean;
  hasAPIAccess: boolean;
  hasPrioritySupport: boolean;
  maxClients: number;
  maxDossiers: number;
  maxStorage: number;
};

export async function getUserSubscription(userId: string) {
  const subscription = await prisma.billingSubscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    // Return FREE plan defaults
    return {
      plan: "FREE",
      status: "ACTIVE",
      features: {
        hasAIFeatures: false,
        hasAdvancedReports: false,
        hasAPIAccess: false,
        hasPrioritySupport: false,
        maxClients: 5,
        maxDossiers: 10,
        maxStorage: 1024,
      },
    };
  }

  return {
    plan: subscription.plan,
    status: subscription.status,
    features: {
      hasAIFeatures: subscription.hasAIFeatures,
      hasAdvancedReports: subscription.hasAdvancedReports,
      hasAPIAccess: subscription.hasAPIAccess,
      hasPrioritySupport: subscription.hasPrioritySupport,
      maxClients: subscription.maxClients,
      maxDossiers: subscription.maxDossiers,
      maxStorage: subscription.maxStorage,
    },
  };
}

export async function checkFeatureAccess(
  userId: string,
  feature: keyof SubscriptionFeatures
): Promise<boolean> {
  const subscription = await getUserSubscription(userId);
  return subscription.features[feature] as boolean;
}

export async function checkUsageLimits(userId: string) {
  const subscription = await getUserSubscription(userId);

  // Count current usage
  const clientsCount = await prisma.client.count({
    where: {
      user: {
        id: userId
      }
    },
  });

  const dossiersCount = await prisma.dossier.count({
    where: {
      client: {
        user: {
          id: userId
        }
      }
    },
  });

  return {
    clients: {
      current: clientsCount,
      max: subscription.features.maxClients,
      available: subscription.features.maxClients - clientsCount,
      percentage: (clientsCount / subscription.features.maxClients) * 100,
    },
    dossiers: {
      current: dossiersCount,
      max: subscription.features.maxDossiers,
      available: subscription.features.maxDossiers - dossiersCount,
       percentage: (dossiersCount / subscription.features.maxDossiers) * 100,
    },
    storage: {
      current: 0, // TODO: Calculate actual storage usage
      max: subscription.features.maxStorage,
      available: subscription.features.maxStorage,
      percentage: 0,
    },
  };
}

export async function canCreateClient(userId: string): Promise<boolean> {
  const limits = await checkUsageLimits(userId);
  return limits.clients.available > 0;
}

export async function canCreateDossier(userId: string): Promise<boolean> {
  const limits = await checkUsageLimits(userId);
  return limits.dossiers.available > 0;
}
