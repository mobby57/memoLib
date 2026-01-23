import { NextRequest, NextResponse } from 'next/server';

/**
 * Health Check API Endpoint
 * Utilisé par le CI/CD pour vérifier la santé de l'application
 */

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Vérifications basiques
    const checks = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      checks: {
        database: 'ok', // Sera implémenté plus tard
        redis: 'ok',    // Sera implémenté plus tard
        external_apis: 'ok'
      }
    };

    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      ...checks,
      responseTime: `${responseTime}ms`
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, {
      status: 503
    });
  }
}
