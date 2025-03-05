import { cva, type VariantProps } from 'class-variance-authority';

const tableVariants = cva(
  'w-full text-sm text-left text-gray-500',
  {
    variants: {
      variant: {
        default: '',
        striped: '[&_tbody_tr:nth-child(odd)]:bg-gray-50',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface TableProps extends VariantProps<typeof tableVariants> {
  className?: string;
  children: React.ReactNode;
}

export const Table = ({ variant, className, children }: TableProps) => {
  return (
    <div className="relative overflow-x-auto shadow-sm rounded-lg">
      <table className={tableVariants({ variant, className })}>
        {children}
      </table>
    </div>
  );
};

export const TableHeader = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <thead className={`text-xs text-gray-700 uppercase bg-gray-50 ${className}`}>
      {children}
    </thead>
  );
};

export const TableBody = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return <tbody className={className}>{children}</tbody>;
};

export const TableRow = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return <tr className={`bg-white border-b hover:bg-gray-50 ${className}`}>{children}</tr>;
};

export const TableCell = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return <td className={`px-6 py-4 ${className}`}>{children}</td>;
};

export const TableHeaderCell = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return <th className={`px-6 py-3 ${className}`}>{children}</th>;
};
