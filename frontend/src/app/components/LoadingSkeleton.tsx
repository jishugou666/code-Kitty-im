import { clsx } from 'clsx';

interface MessageSkeletonProps {
  count?: number;
  className?: string;
}

export function MessageSkeleton({ count = 5, className }: MessageSkeletonProps) {
  return (
    <div className={clsx('space-y-4 px-4 py-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={clsx(
            'flex gap-3',
            i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'
          )}
        >
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse flex-shrink-0" />
          <div className="space-y-2">
            <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            <div className="w-48 h-4 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface ConversationSkeletonProps {
  count?: number;
  className?: string;
}

export function ConversationSkeleton({ count = 8, className }: ConversationSkeletonProps) {
  return (
    <div className={clsx('space-y-1 px-3 py-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-xl"
        >
          <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="w-10 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
