import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  glowColor?: 'orange' | 'purple' | 'blue' | 'green';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ 
    variant = 'default', 
    padding = 'md', 
    hoverable = false, 
    glowColor,
    children, 
    className, 
    ...props 
  }, ref) => {
    const paddingClasses = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    const variantClasses = {
      default: cn(
        'bg-gray-900/50 backdrop-blur-xl',
        'border border-gray-800',
        'shadow-xl shadow-black/20'
      ),
      elevated: cn(
        'bg-gradient-to-b from-gray-800/50 to-gray-900/50',
        'border border-gray-700',
        'shadow-2xl shadow-black/30',
        'backdrop-blur-xl'
      ),
      outlined: cn(
        'bg-transparent',
        'border border-gray-700',
        'hover:border-gray-600'
      ),
      ghost: cn(
        'bg-transparent',
        'border border-transparent',
        'hover:bg-gray-800/30'
      ),
      glass: cn(
        'bg-white/5 backdrop-blur-2xl',
        'border border-white/10',
        'shadow-2xl shadow-black/40'
      ),
    };

    const glowClasses = {
      orange: 'shadow-orange-500/20 hover:shadow-orange-500/30',
      purple: 'shadow-purple-500/20 hover:shadow-purple-500/30',
      blue: 'shadow-blue-500/20 hover:shadow-blue-500/30',
      green: 'shadow-green-500/20 hover:shadow-green-500/30',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl relative',
          'transition-all duration-300',
          paddingClasses[padding],
          variantClasses[variant],
          hoverable && 'hover:scale-[1.02] hover:-translate-y-1 cursor-pointer',
          glowColor && glowClasses[glowColor],
          className
        )}
        {...props}
      >
        {/* Gradient overlay for glass effect */}
        {variant === 'glass' && (
          <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-orange-500/10 via-transparent to-purple-500/10 pointer-events-none" />
        )}
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// CardHeader component
export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div className={cn('mb-4 pb-4 border-b border-gray-800', className)} {...props}>
    {children}
  </div>
);

// CardBody component
export const CardBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div className={cn('', className)} {...props}>
    {children}
  </div>
);

// CardFooter component
export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div className={cn('mt-4 pt-4 border-t border-gray-800', className)} {...props}>
    {children}
  </div>
);