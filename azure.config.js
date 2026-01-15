// Configuration Azure pour IA Poste Manager
// Ce fichier contient les paramètres de déploiement Azure

module.exports = {
  // Environnements disponibles
  environments: {
    dev: {
      resourceGroup: 'rg-iapostemanager-dev',
      location: 'francecentral',
      appServicePlan: 'asp-iapostemanager-dev',
      webApp: 'app-iapostemanager-dev',
      database: 'psql-iapostemanager-dev',
      redis: 'redis-iapostemanager-dev',
      storage: 'stiapostedev',
      keyVault: 'kv-iaposte-dev',
      appInsights: 'appi-iapostemanager-dev',
      
      // SKUs pour dev
      skus: {
        appService: 'B1',
        database: 'Standard_B1ms',
        databaseTier: 'Burstable',
        redis: 'Basic',
        redisSize: 'C0'
      }
    },
    
    prod: {
      resourceGroup: 'rg-iapostemanager-prod',
      location: 'francecentral',
      appServicePlan: 'asp-iapostemanager-prod',
      webApp: 'app-iapostemanager-prod',
      database: 'psql-iapostemanager-prod',
      redis: 'redis-iapostemanager-prod',
      storage: 'stiaposteprod',
      keyVault: 'kv-iaposte-prod',
      appInsights: 'appi-iapostemanager-prod',
      
      // SKUs pour prod
      skus: {
        appService: 'P1V2',
        database: 'Standard_D2s_v3',
        databaseTier: 'GeneralPurpose',
        redis: 'Standard',
        redisSize: 'C1'
      }
    }
  },
  
  // Configuration commune
  common: {
    nodeVersion: '20.x',
    postgresVersion: '16',
    storageRedundancy: 'Standard_LRS',
    httpsOnly: true,
    enableManagedIdentity: true,
    enableApplicationInsights: true,
    
    // Backup
    backup: {
      enabled: true,
      retentionDays: 7
    },
    
    // Scaling
    scaling: {
      minInstances: 1,
      maxInstances: 5,
      cpuThreshold: 70
    },
    
    // Monitoring
    monitoring: {
      enableDetailedErrors: true,
      enableFailedRequestTracing: true,
      logLevel: 'Information'
    }
  },
  
  // Tags pour toutes les ressources
  tags: {
    Application: 'IA Poste Manager',
    ManagedBy: 'Terraform',
    CostCenter: 'IT',
    Environment: '${environment}'
  }
};
