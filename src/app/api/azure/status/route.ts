import { NextRequest, NextResponse } from 'next/server';
import { checkAzureServicesHealth, getAzureConfig } from '@/lib/azure/azure-services';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const config = getAzureConfig();
    const health = await checkAzureServicesHealth();

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: health.database.configured ? 'connected' : 'not_configured',
          type: health.database.type,
          isAzure: health.database.type === 'azure-postgresql'
        },
        blobStorage: {
          status: health.blob.configured ? 'available' : 'not_configured',
          container: config.blob.containerName
        },
        keyVault: {
          status: health.keyVault.configured ? 'available' : 'not_configured'
        },
        azureAd: {
          status: health.azureAd.configured ? 'configured' : 'not_configured',
          enabled: health.azureAd.enabled,
          tenantId: config.ad.tenantId ? `${config.ad.tenantId.substring(0, 8)}...` : null
        }
      },
      recommendations: generateRecommendations(health)
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

function generateRecommendations(health: Awaited<ReturnType<typeof checkAzureServicesHealth>>): string[] {
  const recommendations: string[] = [];

  if (health.database.type === 'sqlite') {
    recommendations.push('Consider migrating to Azure PostgreSQL for production');
  }

  if (!health.blob.configured) {
    recommendations.push('Configure Azure Blob Storage for file uploads');
  }

  if (!health.keyVault.configured) {
    recommendations.push('Consider using Azure Key Vault for secret management');
  }

  if (!health.azureAd.enabled && health.azureAd.configured) {
    recommendations.push('Azure AD is configured but not enabled. Set NEXT_PUBLIC_AZURE_AD_ENABLED=true');
  }

  if (recommendations.length === 0) {
    recommendations.push('All Azure services are properly configured!');
  }

  return recommendations;
}
