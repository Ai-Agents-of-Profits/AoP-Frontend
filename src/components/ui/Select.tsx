import { cva, type VariantProps } from 'class-variance-authority';

const selectVariants = cva(
  'block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500',
  {
    variants: {
      size: {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'>,
    VariantProps<typeof selectVariants> {
  options: Array<{
    value: string;
    label: string;
  }>;
}

export const Select = ({
  className,
  size,
  options,
  ...props
}: SelectProps) => {
  return (
    <select className={selectVariants({ size, className })} {...props}>
      {options.map(({ value, label }) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
};
