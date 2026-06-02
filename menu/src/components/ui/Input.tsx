import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-bold text-muted mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            "flex h-11 w-full rounded-xl border border-line-2 bg-surface-2 hover:bg-elevated transition-colors px-4 py-2 text-sm text-content placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-accent focus:bg-elevated disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-warn focus:ring-warn",
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm font-medium text-warn">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
