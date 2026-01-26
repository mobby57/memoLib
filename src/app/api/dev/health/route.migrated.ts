import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/withAuth';
import { prisma } from '@/lib/prisma';

const startTime = Date.now();

async function handler() {
  try {
    const uptime = Date.now() - startTime;
    const uptimeFormatted = formatUptime(uptime);

    // Verifications systeme
    const checks = {
      database: await checkDatabase(),
      ollama: await checkOllama(),
      memory: checkMemory(),
    };

    const allHealthy = Object.values(checks).every((check) => check.healthy);

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
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

async function checkDatabase(): Promise<{ healthy: boolean; message: string; latency?: number }> {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;
    return { healthy: true, message: 'Database OK', latency };
  } catch (error) {
    return { healthy: false, message: 'Database connection failed' };
  }
}

async function checkOllama(): Promise<{ healthy: boolean; message: string }> {
  try {
    const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const response = await fetch(`${ollamaUrl}/api/tags`, {
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
  try {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
      const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
      const percentage = (heapUsedMB / heapTotalMB) * 100;

      return {
        healthy: percentage < 90,
        message: `Memory: ${heapUsedMB}MB / ${heapTotalMB}MB (${percentage.toFixed(1)}%)`,
        usage: Math.round(percentage * 100) / 100,
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

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

export const GET = withAuth(handler, ['SUPER_ADMIN']);
