
import React from 'react';
import { cn } from "@/lib/utils";

interface AnimatedLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ 
  className, 
  size = 'md',
  showText = true
}) => {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };
  
  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl'
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn(
        'relative rounded-lg bg-primary text-primary-foreground flex items-center justify-center animate-logo-pulse', 
        sizes[size]
      )}>
        <span className="absolute inset-0 bg-primary/20 blur-md rounded-lg"></span>
        <span className="relative text-white font-semibold">R</span>
      </div>
      
      {showText && (
        <span className={cn(
          'font-semibold tracking-tight text-foreground transition-opacity duration-300',
          textSizes[size]
        )}>
          Roomly
        </span>
      )}
    </div>
  );
};

export default AnimatedLogo;
