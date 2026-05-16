import React from 'react';
import { motion } from 'motion/react';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
  as?: keyof JSX.IntrinsicElements;
}

const shadows: Record<string, string> = {
  none: '',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl'
};

const paddings: Record<string, string> = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6'
};

export const Card = ({
  children,
  className,
  hover = false,
  shadow = 'sm',
  padding = 'md',
  onClick,
  as: Component = 'div'
}: CardProps) => {
  const cardContent = (
    <Component
      className={clsx(
        'bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700',
        shadows[shadow],
        paddings[padding],
        'transition-all duration-200',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </Component>
  );

  if (hover) {
    return (
      <motion.div
        whileHover={{ y: -4, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
        whileTap={onClick ? { scale: 0.98 } : {}}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {cardContent}
      </motion.div>
    );
  }

  return cardContent;
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export const CardHeader = ({ children, className, action }: CardHeaderProps) => (
  <div className={clsx('flex items-center justify-between mb-4', className)}>
    <div>
      {children}
    </div>
    {action && <div>{action}</div>}
  </div>
);

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const CardTitle = ({ children, className }: CardTitleProps) => (
  <h3 className={clsx('text-lg font-semibold text-gray-900 dark:text-white', className)}>
    {children}
  </h3>
);

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export const CardDescription = ({ children, className }: CardDescriptionProps) => (
  <p className={clsx('text-sm text-gray-500 dark:text-gray-400 mt-1', className)}>
    {children}
  </p>
);

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent = ({ children, className }: CardContentProps) => (
  <div className={clsx('', className)}>
    {children}
  </div>
);

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter = ({ children, className }: CardFooterProps) => (
  <div className={clsx('flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-700', className)}>
    {children}
  </div>
);
