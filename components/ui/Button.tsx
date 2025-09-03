import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses = cn(
      'inline-flex items-center justify-center',
      'font-medium rounded-lg',
      'transition-all duration-200',
      'transform-gpu',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50 focus-visible:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
      'relative isolate overflow-hidden',
      'group',
      fullWidth && 'w-full'
    );

    const variantClasses = {
      primary: cn(
        'bg-gradient-to-r from-orange-500 to-orange-600 text-white',
        'hover:from-orange-600 hover:to-orange-700',
        'shadow-lg shadow-orange-500/25',
        'hover:shadow-xl hover:shadow-orange-500/30',
        'active:shadow-md'
      ),
      secondary: cn(
        'bg-gray-800 text-white',
        'hover:bg-gray-700',
        'border border-gray-700',
        'hover:border-gray-600'
      ),
      ghost: cn(
        'bg-transparent text-gray-300',
        'hover:bg-gray-800/50',
        'hover:text-white'
      ),
      danger: cn(
        'bg-red-500 text-white',
        'hover:bg-red-600',
        'shadow-lg shadow-red-500/25'
      ),
      success: cn(
        'bg-green-500 text-white',
        'hover:bg-green-600',
        'shadow-lg shadow-green-500/25'
      ),
    };

    const sizeClasses = {
      xs: 'px-2 py-1 text-xs',
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>처리 중...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="mr-2">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="ml-2">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';