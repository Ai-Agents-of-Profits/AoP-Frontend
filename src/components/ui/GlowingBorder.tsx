import { cn } from '../../lib/utils';

interface GlowingBorderProps {
  children: React.ReactNode;
  className?: string;
}

export function GlowingBorder({ children, className }: GlowingBorderProps) {
  return (
    <div className={cn(
      'relative rounded-2xl p-px overflow-hidden',
      'before:absolute before:inset-0',
      'before:bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))]',
      'before:from-indigo-500 before:via-purple-500 before:to-pink-500',
      'before:animate-border-glow',
      className
    )}>
      {children}
    </div>
  );
}
