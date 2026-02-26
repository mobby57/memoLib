import { NextResponse } from 'next/server';

const startTime = Date.now();
const DEMO_MODE = process.env.DEMO_MODE === '1' || process.env.DEMO_MODE === 'true';
const AI_HEALTH_STRICT = process.env.AI_HEALTH_STRICT !== 'false';

/**
 * GET /api/dev/health - Health check systeme
 */
export async function GET() {
  try {
    const uptime = Date.now() - startTime;
    const uptimeFormatted = formatUptime(uptime);

    // Verifications systeme
    const checks = {
      database: await checkDatabase(),
      ollama: await checkOllama(),
      memory: checkMemory(),
    };

    const allHealthy = Object.values(checks).every(check => check.healthy);

    return NextResponse.json({
      status: allHealthy ? 'healthy' : 'degraded',
      uptime: uptimeFormatted,
      uptimeMs: uptime,
      timestamp: new Date().toISOString(),
      checks,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Erreur health check',
      },
      { status: 500 }
    );
  }
}

async function checkDatabase(): Promise<{ healthy: boolean; message: string }> {
  try {
    // Vérifier connexion Prisma avec une requête simple
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    return { healthy: true, message: 'Database OK' };
  } catch (error) {
    return { healthy: false, message: `Database connection failed: ${error}` };
  }
}

async function checkOllama(): Promise<{ healthy: boolean; message: string }> {
  if (DEMO_MODE || !AI_HEALTH_STRICT) {
    return { healthy: true, message: 'Ollama check skipped (demo)' };
  }

  try {
    const response = await fetch('http://localhost:11434/api/tags', {
      signal: AbortSignal.timeout(2000),
    });
    if (response.ok) {
      return { healthy: true, message: 'Ollama OK' };
    }
    return { healthy: false, message: 'Ollama not responding' };
  } catch (error) {
    return { healthy: false, message: 'Ollama unavailable' };
  }
}

function checkMemory(): { healthy: boolean; message: string; usage?: number } {
  if (DEMO_MODE) {
    return { healthy: true, message: 'Memory check skipped (demo)' };
  }

  try {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
      const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
      const percentage = (heapUsedMB / heapTotalMB) * 100;

      return {
        healthy: percentage < 90,
        message: `Memory: ${heapUsedMB}MB / ${heapTotalMB}MB (${percentage.toFixed(1)}%)`,
        usage: percentage,
      };
    }
    return { healthy: true, message: 'Memory check unavailable' };
  } catch (error) {
    return { healthy: true, message: 'Memory check unavailable' };
  }
}

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}j ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}
