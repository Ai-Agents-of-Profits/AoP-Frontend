import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const cardVariants = cva('bg-white shadow-sm rounded-lg', {
  variants: {
    variant: {
      default: 'border border-gray-200',
      highlighted: 'border-2 border-indigo-500',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant }), className)}
        {...props}
      />
    );
  }
);

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    />
  )
);

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'normal';
}

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, padding = 'normal', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        padding === 'normal' ? 'p-6 pt-0' : '',
        className
      )}
      {...props}
    />
  )
);
