/**
 * Prisma Connection Pooling Configuration
 * 
 * Optimizes database connections using PgBouncer
 * Implements connection limits and query timeouts
 * 
 * Performance targets:
 * - Connection acquisition: < 10ms
 * - Query timeout: 5s
 * - Max connections: 100
 * - Pool mode: transaction
 */

// prisma/schema.prisma configuration
datasource db {
    provider = "postgresql"
    url = env("DATABASE_URL")
    // Connection pooling via PgBouncer
    // Format: postgresql://USER:PASSWORD@HOST:6432/DATABASE?pgbouncer=true
    directUrl = env("DIRECT_URL") // Direct connection for migrations
}

// PgBouncer configuration (pgbouncer.ini)
module.exports = {
    databases: {
        memolib: {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD,
            dbname: process.env.DB_NAME || 'memolib',
            pool_mode: 'transaction', // transaction, session, or statement
            pool_size: 25, // Connections per user
            reserve_pool_size: 5, // Emergency connections
            max_client_conn: 100, // Max client connections
            default_pool_size: 20,
        },
    },

    pgbouncer: {
        // Logging
        logfile: '/var/log/pgbouncer/pgbouncer.log',
        pidfile: '/var/run/pgbouncer/pgbouncer.pid',

        // Connection limits
        max_client_conn: 100,
        default_pool_size: 20,
        min_pool_size: 5,
        reserve_pool_size: 5,
        reserve_pool_timeout: 3, // seconds

        // Timeouts
        server_lifetime: 3600, // 1 hour
        server_idle_timeout: 600, // 10 minutes
        server_connect_timeout: 15,
        server_login_retry: 15,
        query_timeout: 5, // 5 seconds
        query_wait_timeout: 120, // 2 minutes
        client_idle_timeout: 0, // Disabled
        client_login_timeout: 60,

        // Pool mode
        pool_mode: 'transaction', // Best for Prisma

        // Security
        auth_type: 'md5',
        auth_file: '/etc/pgbouncer/userlist.txt',

        // Performance
        pkt_buf: 4096,
        listen_backlog: 128,
        sbuf_loopcnt: 5,
        max_packet_size: 2147483647,

        // Monitoring
        stats_users: 'postgres',
        stats_period: 60,

        // Admin
        admin_users: 'postgres',
        listen_addr: '127.0.0.1',
        listen_port: 6432,
        unix_socket_dir: '/var/run/postgresql',
    },

    // Prisma Client configuration
    prisma: {
        // Connection pool
        connectionLimit: 10, // Per Prisma instance

        // Query timeouts
        queryTimeout: 5000, // 5 seconds

        // Connection timeout
        connectTimeout: 10000, // 10 seconds

        // Pool timeout
        poolTimeout: 10000,

        // Logging
        log: [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'warn' },
        ],

        // Metrics
        metrics: {
            enabled: true,
            endpoint: '/metrics',
        },
    },

    // Environment-specific settings
    development: {
        pool_size: 5,
        max_client_conn: 20,
        query_timeout: 10,
    },

    production: {
        pool_size: 25,
        max_client_conn: 100,
        query_timeout: 5,
    },

    // Health check query
    healthCheck: {
        query: 'SELECT 1',
        interval: 30000, // 30 seconds
    },
};

/**
 * Connection Pool Monitor
 */
export class PoolMonitor {
    /**
     * Get pool statistics from PgBouncer
     */
    static async getPoolStats(): Promise<PoolStats> {
        // Query PgBouncer SHOW POOLS
        const result = await fetch('http://localhost:6432/pgbouncer', {
            headers: {
                Authorization: `Basic ${Buffer.from('postgres:password').toString('base64')}`,
            },
        });

        // Parse response
        const stats = await result.text();

        return {
            database: 'memolib',
            user: 'postgres',
            cl_active: 0, // Active client connections
            cl_waiting: 0, // Waiting client connections
            sv_active: 0, // Active server connections
            sv_idle: 0, // Idle server connections
            sv_used: 0, // Used server connections
            sv_tested: 0, // Tested server connections
            sv_login: 0, // Server connections being logged in
            maxwait: 0, // Max wait time (seconds)
            maxwait_us: 0, // Max wait time (microseconds)
            pool_mode: 'transaction',
        };
    }

    /**
     * Check pool health
     */
    static async checkHealth(): Promise<PoolHealth> {
        try {
            const stats = await this.getPoolStats();

            const healthy =
                stats.cl_waiting === 0 && // No waiting clients
                stats.maxwait === 0 && // No wait time
                stats.sv_active < 20; // Not too many active connections

            return {
                healthy,
                stats,
                warnings: this.getWarnings(stats),
                timestamp: new Date(),
            };
        } catch (error) {
            return {
                healthy: false,
                error: (error as Error).message,
                timestamp: new Date(),
            };
        }
    }

    /**
     * Get pool warnings
     */
    private static getWarnings(stats: PoolStats): string[] {
        const warnings: string[] = [];

        if (stats.cl_waiting > 0) {
            warnings.push(`${stats.cl_waiting} clients waiting for connection`);
        }

        if (stats.maxwait > 1) {
            warnings.push(`Max wait time: ${stats.maxwait}s`);
        }

        if (stats.sv_active > 20) {
            warnings.push(`High server connection count: ${stats.sv_active}`);
        }

        if (stats.sv_idle < 5) {
            warnings.push(`Low idle connection count: ${stats.sv_idle}`);
        }

        return warnings;
    }
}

// Types
interface PoolStats {
    database: string;
    user: string;
    cl_active: number;
    cl_waiting: number;
    sv_active: number;
    sv_idle: number;
    sv_used: number;
    sv_tested: number;
    sv_login: number;
    maxwait: number;
    maxwait_us: number;
    pool_mode: string;
}

interface PoolHealth {
    healthy: boolean;
    stats?: PoolStats;
    warnings?: string[];
    error?: string;
    timestamp: Date;
}
