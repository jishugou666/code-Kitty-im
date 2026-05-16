import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';

interface AnimatedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  getKey: (item: T) => string | number;
  className?: string;
  animationType?: 'fade' | 'slide' | 'scale';
  staggerDelay?: number;
  enableLayout?: boolean;
}

export function AnimatedList<T>({
  items,
  renderItem,
  getKey,
  className,
  animationType = 'fade',
  staggerDelay = 0.05,
  enableLayout = true
}: AnimatedListProps<T>) {
  const getAnimationProps = (index: number) => {
    const baseProps = {
      initial: {} as any,
      animate: {} as any,
      exit: {} as any,
      transition: {
        duration: 0.3,
        delay: index * staggerDelay,
        ease: 'easeOut' as const
      }
    };

    switch (animationType) {
      case 'slide':
        return {
          ...baseProps,
          initial: { opacity: 0, x: -20 },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: 20 }
        };
      case 'scale':
        return {
          ...baseProps,
          initial: { opacity: 0, scale: 0.9 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.9 }
        };
      default:
        return {
          ...baseProps,
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -10 }
        };
    }
  };

  return (
    <div className={clsx('space-y-1', className)}>
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => (
          <motion.div
            key={getKey(item)}
            layout={enableLayout}
            {...getAnimationProps(index)}
          >
            {renderItem(item, index)}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export function LoadingDots({ size = 'md', color = 'bg-gray-400', className }: LoadingDotsProps) {
  const dotSizes: Record<string, string> = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5'
  };

  return (
    <div className={clsx('flex items-center gap-1', className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={clsx('rounded-full', dotSizes[size], color)}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeInOut'
          }}
        />
      ))}
    </div>
  );
}

interface ProgressBarProps {
  progress: number;
  className?: string;
  showLabel?: boolean;
  color?: string;
  height?: 'sm' | 'md' | 'lg';
}

export function ProgressBar({
  progress,
  className,
  showLabel = false,
  color = 'bg-blue-500',
  height = 'md'
}: ProgressBarProps) {
  const heights: Record<string, string> = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  return (
    <div className={clsx('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">进度</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">{Math.round(progress)}%</span>
        </div>
      )}
      <div className={clsx('w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden', heights[height])}>
        <motion.div
          className={clsx('h-full rounded-full', color)}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
