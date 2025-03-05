import { Button } from './Button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  
  // Show at most 5 page numbers, centered around current page
  const getVisiblePages = () => {
    if (totalPages <= 5) return pages;
    
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + 4);
    
    return pages.slice(start - 1, end);
  };

  return (
    <nav className="flex items-center justify-between px-4 py-3 sm:px-6">
      <div className="flex flex-1 justify-between sm:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing page{' '}
            <span className="font-medium">{currentPage}</span>{' '}
            of{' '}
            <span className="font-medium">{totalPages}</span>
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="rounded-l-md"
            >
              Previous
            </Button>
            {getVisiblePages().map((page) => (
              <Button
                key={page}
                variant={page === currentPage ? 'primary' : 'outline'}
                size="sm"
                onClick={() => onPageChange(page)}
                className="rounded-none"
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="rounded-r-md"
            >
              Next
            </Button>
          </nav>
        </div>
      </div>
    </nav>
  );
};
