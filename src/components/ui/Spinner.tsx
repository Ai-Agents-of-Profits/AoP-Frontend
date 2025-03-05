import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const spinnerVariants = cva('animate-spin', {
  variants: {
    size: {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    },
    color: {
      primary: 'text-white',
      secondary: 'text-gray-600',
    },
  },
  defaultVariants: {
    size: 'md',
    color: 'primary',
  },
});

export interface SpinnerProps
  extends Omit<React.SVGAttributes<SVGElement>, 'color' | 'size'>,
    VariantProps<typeof spinnerVariants> {}

export const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(
  ({ className, size, color, ...props }, ref) => {
    return (
      <svg
        className={cn(spinnerVariants({ size, color }), className)}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        ref={ref}
        {...props}
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );
  }
);
