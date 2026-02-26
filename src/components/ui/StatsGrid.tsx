import React from 'react';
import clsx from 'clsx';

type StatItem = {
  label: string;
  value: string | number;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: string;
  trendUp?: boolean;
};

export default function StatsGrid({ items, className }: { items: StatItem[]; className?: string }) {
  return (
    <div className={clsx('grid gap-4 md:grid-cols-2 xl:grid-cols-4', className)}>
      {items.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">{stat.label}</p>
                <p className="text-2xl font-bold mt-2">{stat.value}</p>
                {stat.trend && (
                  <p className={clsx('text-sm mt-2', stat.trendUp ? 'text-green-600' : 'text-red-600')}>
                    {stat.trendUp ? '▲' : '▼'} {stat.trend}
                  </p>
                )}
              </div>
              {Icon && <Icon className="w-12 h-12 text-brand-600/40" />}
            </div>
          </div>
        );
      })}
    </div>
  );
}
