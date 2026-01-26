/**
 * TierBadge component - Display user tier with icon and color
 */

interface TierBadgeProps {
  tier: 'free' | 'premium' | 'admin';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function TierBadge({ tier, size = 'md', showLabel = true }: TierBadgeProps) {
  const config = {
    free: {
      icon: '👤',
      label: 'Free',
      bgColor: 'bg-gray-100 dark:bg-gray-700',
      textColor: 'text-gray-700 dark:text-gray-300',
      borderColor: 'border-gray-300 dark:border-gray-600',
    },
    premium: {
      icon: '👑',
      label: 'Premium',
      bgColor: 'bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30',
      textColor: 'text-amber-700 dark:text-amber-400',
      borderColor: 'border-amber-300 dark:border-amber-600',
    },
    admin: {
      icon: '🛡️',
      label: 'Admin',
      bgColor: 'bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30',
      textColor: 'text-purple-700 dark:text-purple-400',
      borderColor: 'border-purple-300 dark:border-purple-600',
    },
  };

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const tierConfig = config[tier];

  return (
    <span
      className={`
        inline-flex items-center gap-1
        ${tierConfig.bgColor}
        ${tierConfig.textColor}
        ${sizeClasses[size]}
        rounded-full
        border
        ${tierConfig.borderColor}
        font-semibold
      `}
    >
      <span>{tierConfig.icon}</span>
      {showLabel && <span>{tierConfig.label}</span>}
    </span>
  );
}
