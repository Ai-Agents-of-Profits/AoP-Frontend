import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface AnimatedTextProps {
  text: string;
  className?: string;
  delay?: number;
}

export function AnimatedText({ text, className, delay = 0 }: AnimatedTextProps) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className={cn(className)}
    >
      {text}
    </motion.span>
  );
}
