/**
 * Code Splitting & Lazy Loading Configuration
 *
 * Optimizes bundle size and loading performance
 * Implements dynamic imports and lazy components
 */

import dynamic from 'next/dynamic';

// Admin components (heavy, rarely used)
export const AdminDashboard = dynamic(
    () => import('@/components/admin/AdminDashboard'),
    {
        loading: () => <LoadingSpinner />,
        ssr: false, // Client-side only
    }
);

export const AnalyticsDashboard = dynamic(
    () => import('@/components/admin/AnalyticsDashboard'),
    {
        loading: () => <LoadingSpinner />,
        ssr: false,
    }
);

export const IntegrationsDashboard = dynamic(
    () => import('@/components/admin/IntegrationsDashboard'),
    {
        loading: () => <LoadingSpinner />,
        ssr: false,
    }
);

// Charts (heavy libraries - recharts)
export const RevenueChart = dynamic(
    () => import('@/components/charts/RevenueChart'),
    {
        loading: () => <ChartSkeleton />,
        ssr: false,
    }
);

export const EngagementChart = dynamic(
    () => import('@/components/charts/EngagementChart'),
    {
        loading: () => <ChartSkeleton />,
        ssr: false,
    }
);

// Modals (only load when opened)
export const ConsentModal = dynamic(
    () => import('@/components/integrations/ConsentModal'),
    {
        loading: () => null,
        ssr: false,
    }
);

export const SettingsModal = dynamic(
    () => import('@/components/modals/SettingsModal'),
    {
        loading: () => null,
        ssr: false,
    }
);

// Rich text editor (heavy)
export const RichTextEditor = dynamic(
    () => import('@/components/editor/RichTextEditor'),
    {
        loading: () => <EditorSkeleton />,
        ssr: false,
    }
);

// PDF viewer (heavy)
export const PDFViewer = dynamic(
    () => import('@/components/viewers/PDFViewer'),
    {
        loading: () => <ViewerSkeleton />,
        ssr: false,
    }
);

function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
    );
}

function ChartSkeleton() {
    return (
        <div className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded" />
        </div>
    );
}

function EditorSkeleton() {
    return (
        <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-64 bg-gray-200 rounded" />
        </div>
    );
}

function ViewerSkeleton() {
    return (
        <div className="animate-pulse">
            <div className="h-96 bg-gray-200 rounded" />
        </div>
    );
}

/**
 * Route-based code splitting
 * Next.js automatically splits by route
 */
export const routes = {
    public: ['/', '/login', '/register', '/pricing'],
    user: ['/dashboard', '/emails', '/settings'],
    admin: ['/admin/dashboard', '/admin/analytics', '/admin/integrations', '/admin/users'],
};

/**
 * Prefetch strategy
 * Prefetch links on hover for instant navigation
 */
export const prefetchConfig = {
    onHover: true,
    onVisible: true,
    priority: ['/dashboard', '/emails'],
};

/**
 * Bundle analysis
 * Run: npm run build && npm run analyze
 */
export const bundleConfig = {
    budgets: {
        initial: 200,
        total: 500,
        css: 50,
        images: 100,
    },
    chunks: {
        vendor: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            reuseExistingChunk: true,
        },
        common: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
        },
    },
};

/**
 * Tree shaking configuration
 * Remove unused exports
 */
export const treeShakingConfig = {
    sideEffects: false,
    removeConsole: process.env.NODE_ENV === 'production',
    purgeCss: true,
    optimizeImports: ['lodash', 'date-fns', 'lucide-react'],
};
