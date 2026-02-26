import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface EngagementPoint {
    week: string;
    activeUsers: number;
    retention: number;
}

const SAMPLE_DATA: EngagementPoint[] = [
    { week: 'Week 1', activeUsers: 820, retention: 72 },
    { week: 'Week 2', activeUsers: 910, retention: 74 },
    { week: 'Week 3', activeUsers: 980, retention: 76 },
    { week: 'Week 4', activeUsers: 1050, retention: 78 },
];

export default function EngagementChart({ data = SAMPLE_DATA }: { data?: EngagementPoint[] }) {
    return (
        <div className="h-72 w-full">
            <ResponsiveContainer>
                <LineChart data={data} margin={{ left: 0, right: 0, top: 16, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="week" stroke="#94a3b8" />
                    <YAxis yAxisId="left" stroke="#94a3b8" tickFormatter={(value) => `${value}`} />
                    <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" tickFormatter={(value) => `${value}%`} />
                    <Tooltip formatter={(value, key) => key === 'retention' ? `${value}%` : value} />
                    <Line yAxisId="left" type="monotone" dataKey="activeUsers" stroke="#2563eb" strokeWidth={2} />
                    <Line yAxisId="right" type="monotone" dataKey="retention" stroke="#16a34a" strokeWidth={2} strokeDasharray="5 5" />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
