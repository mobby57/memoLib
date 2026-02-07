import { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';

interface RevenuePoint {
    month: string;
    revenue: number;
}

const SAMPLE_DATA: RevenuePoint[] = [
    { month: 'Jan', revenue: 12000 },
    { month: 'Feb', revenue: 14500 },
    { month: 'Mar', revenue: 15800 },
    { month: 'Apr', revenue: 17250 },
    { month: 'May', revenue: 18800 },
    { month: 'Jun', revenue: 21000 },
];

export default function RevenueChart({ data = SAMPLE_DATA }: { data?: RevenuePoint[] }) {
    const chartData = useMemo(() => data, [data]);

    return (
        <div className="h-72 w-full">
            <ResponsiveContainer>
                <AreaChart data={chartData} margin={{ left: 0, right: 0, top: 16, bottom: 8 }}>
                    <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number | undefined) => value ? `$${value.toLocaleString()}` : '$0'} />
                    <Area type="monotone" dataKey="revenue" stroke="#2563eb" fillOpacity={1} fill="url(#revenueGradient)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
