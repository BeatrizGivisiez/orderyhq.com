import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const variants = {
      primary: 'bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700 disabled:bg-orange-300 shadow-sm shadow-orange-100',
      secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 active:bg-slate-300 disabled:bg-slate-50',
      outline: 'border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700',
      danger: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 disabled:bg-red-300',
      ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 active:bg-slate-200',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 py-2 text-sm',
      lg: 'h-12 px-6 text-base',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
