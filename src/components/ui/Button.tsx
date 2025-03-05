import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Spinner } from './Spinner';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-500',
        outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-indigo-500',
        ghost: 'text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-500',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        disabled={props.disabled || loading}
        {...props}
      >
        {loading && (
          <Spinner
            className="mr-2"
            size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'}
          />
        )}
        {children}
      </button>
    );
  }
);
