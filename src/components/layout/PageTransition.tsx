
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type PageTransitionProps = {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
  delay?: number;
};

const pageVariants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className,
  animate = true,
  delay = 0,
}) => {
  if (!animate) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={{ delay }}
      className={cn('w-full', className)}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
