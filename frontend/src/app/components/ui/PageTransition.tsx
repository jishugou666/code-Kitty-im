import React from 'react';
import { motion } from 'motion/react';
import { clsx } from 'clsx';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  animation?: 'fade' | 'slide' | 'zoom';
  direction?: 'left' | 'right' | 'up' | 'down';
  duration?: number;
}

export function PageTransition({
  children,
  className,
  animation = 'fade',
  direction = 'up',
  duration = 0.3
}: PageTransitionProps) {
  const getAnimationProps = () => {
    const base = {
      initial: {} as any,
      animate: {} as any,
      exit: {} as any,
      transition: { duration, ease: 'easeOut' as const }
    };

    switch (animation) {
      case 'slide':
        const directions: Record<string, any> = {
          left: { initial: { x: 50 }, animate: { x: 0 }, exit: { x: -50 } },
          right: { initial: { x: -50 }, animate: { x: 0 }, exit: { x: 50 } },
          up: { initial: { y: 50 }, animate: { y: 0 }, exit: { y: -50 } },
          down: { initial: { y: -50 }, animate: { y: 0 }, exit: { y: 50 } }
        };
        return {
          ...base,
          initial: { ...directions[direction].initial, opacity: 0 },
          animate: { ...directions[direction].animate, opacity: 1 },
          exit: { ...directions[direction].exit, opacity: 0 }
        };
      case 'zoom':
        return {
          ...base,
          initial: { opacity: 0, scale: 0.95 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.95 }
        };
      default:
        return {
          ...base,
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 }
        };
    }
  };

  return (
    <motion.div
      className={clsx('w-full h-full', className)}
      {...getAnimationProps()}
    >
      {children}
    </motion.div>
  );
}

interface StaggerChildrenProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  staggerDelay?: number;
}

export function StaggerChildren({
  children,
  className,
  delay = 0.1,
  staggerDelay = 0.05
}: StaggerChildrenProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: delay
          }
        }
      }}
    >
      {React.Children.map(children, (child) => (
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

interface NumberTickerProps {
  value: number;
  className?: string;
  duration?: number;
  prefix?: string;
  suffix?: string;
}

export function NumberTicker({
  value,
  className,
  duration = 1,
  prefix = '',
  suffix = ''
}: NumberTickerProps) {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    let start = 0;
    const end = value;
    const incrementTime = (duration / end) * 1000;

    const timer = setInterval(() => {
      start += 1;
      setDisplayValue(start);
      if (start >= end) {
        clearInterval(timer);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  return (
    <span className={clsx('tabular-nums', className)}>
      {prefix}{displayValue}{suffix}
    </span>
  );
}
