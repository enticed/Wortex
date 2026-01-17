'use client';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  subtitle?: string;
}

export default function StatsCard({ label, value, icon, trend, subtitle }: StatsCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {label}
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div className="text-3xl ml-4">
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className={`mt-3 flex items-center text-sm ${
          trend.isPositive
            ? 'text-green-600 dark:text-green-400'
            : 'text-red-600 dark:text-red-400'
        }`}>
          <span className="mr-1">
            {trend.isPositive ? '↑' : '↓'}
          </span>
          <span>{trend.value}</span>
        </div>
      )}
    </div>
  );
}
