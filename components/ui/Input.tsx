import React, { forwardRef, useState } from 'react';
import { cn } from '../../utils/cn';
import { Eye, EyeOff } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outlined';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      variant = 'default',
      className,
      type,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    
    const inputType = isPassword && showPassword ? 'text' : type;

    const variantClasses = {
      default: cn(
        'bg-gray-900/50 border-gray-700',
        'focus:border-orange-500 focus:bg-gray-900/70'
      ),
      filled: cn(
        'bg-gray-800 border-transparent',
        'focus:bg-gray-700 focus:border-orange-500'
      ),
      outlined: cn(
        'bg-transparent border-gray-600',
        'focus:border-orange-500 focus:bg-gray-900/30'
      ),
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            type={inputType}
            className={cn(
              'w-full px-4 py-2.5 rounded-lg',
              'text-white placeholder-gray-500',
              'border backdrop-blur-xl',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-orange-500/20',
              variantClasses[variant],
              leftIcon && 'pl-10',
              (rightIcon || isPassword) && 'pr-10',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
              className
            )}
            {...props}
          />
          
          {(rightIcon || isPassword) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {isPassword ? (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="focus:outline-none hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              ) : (
                rightIcon
              )}
            </div>
          )}
        </div>
        
        {(error || hint) && (
          <div className={cn('mt-1 text-sm', error ? 'text-red-400' : 'text-gray-500')}>
            {error || hint}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Textarea component
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  variant?: 'default' | 'filled' | 'outlined';
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      hint,
      variant = 'default',
      className,
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      default: cn(
        'bg-gray-900/50 border-gray-700',
        'focus:border-orange-500 focus:bg-gray-900/70'
      ),
      filled: cn(
        'bg-gray-800 border-transparent',
        'focus:bg-gray-700 focus:border-orange-500'
      ),
      outlined: cn(
        'bg-transparent border-gray-600',
        'focus:border-orange-500 focus:bg-gray-900/30'
      ),
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {label}
          </label>
        )}
        
        <textarea
          ref={ref}
          className={cn(
            'w-full px-4 py-2.5 rounded-lg',
            'text-white placeholder-gray-500',
            'border backdrop-blur-xl',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-orange-500/20',
            'resize-none',
            variantClasses[variant],
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
          {...props}
        />
        
        {(error || hint) && (
          <div className={cn('mt-1 text-sm', error ? 'text-red-400' : 'text-gray-500')}>
            {error || hint}
          </div>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';