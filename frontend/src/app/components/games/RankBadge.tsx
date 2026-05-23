import { Crown, Trophy } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'motion/react';

interface RankBadgeProps {
  tier: string;
  rating?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const TIER_CONFIG = [
  { key: 'iron', name: '铁器', color: '#8B4513', threshold: 0 },
  { key: 'bronze', name: '青铜', color: '#CD7F32', threshold: 400 },
  { key: 'silver', name: '白银', color: '#C0C0C0', threshold: 1000 },
  { key: 'gold', name: '黄金', color: '#FFD700', threshold: 1800 },
  { key: 'platinum', name: '铂金', color: '#E5E4E2', threshold: 2700 },
  { key: 'emerald', name: '翡翠', color: '#50C878', threshold: 3700 },
  { key: 'diamond', name: '钻石', color: '#B9F2FF', threshold: 4700 },
  { key: 'master', name: '大师', color: '#FF6B6B', threshold: 6000 }
];

const SIZE_CONFIG = {
  sm: { container: 'w-[28px] h-[28px]', text: 'text-[10px]' },
  md: { container: 'w-[36px] h-[36px]', text: 'text-xs' },
  lg: { container: 'w-[48px] h-[48px]', text: 'text-base' }
};

function getTierConfig(tier: string) {
  const normalized = tier.toLowerCase();
  return TIER_CONFIG.find(t => t.key === normalized) || TIER_CONFIG[0];
}

export function RankBadge({ tier, rating, size = 'md', showLabel = true }: RankBadgeProps) {
  const config = getTierConfig(tier);
  const sizeCfg = SIZE_CONFIG[size];
  const isMaster = tier.toLowerCase() === 'master';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex items-center gap-2"
    >
      <div
        className={clsx(
          'relative rounded-full flex items-center justify-center',
          sizeCfg.container
        )}
        style={{
          background: `radial-gradient(circle at 30% 30%, ${config.color}dd, ${config.color})`
        }}
      >
        <div className="absolute inset-0.5 rounded-full bg-white/10 backdrop-blur-[1px]" />
        {isMaster ? (
          <Crown
            size={size === 'sm' ? 12 : size === 'md' ? 16 : 22}
            className="relative z-10 text-white drop-shadow-md"
          />
        ) : (
          <Trophy
            size={size === 'sm' ? 12 : size === 'md' ? 16 : 22}
            className="relative z-10 text-white drop-shadow-md"
          />
        )}
      </div>

      {showLabel && (
        <div className="flex flex-col">
          <span className={clsx('font-semibold text-gray-800 dark:text-gray-200', sizeCfg.text)}>
            {config.name}
          </span>
          {rating !== undefined && (
            <span className={clsx('text-gray-500 dark:text-gray-400', size === 'sm' ? 'text-[8px]' : 'text-[10px]')}>
              {rating.toLocaleString()}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}
