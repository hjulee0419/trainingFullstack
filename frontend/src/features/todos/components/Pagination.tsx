import { useTranslation } from '@/lib/i18n/useTranslation';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  const { t } = useTranslation();

  if (totalPages <= 1) {
    return null;
  }

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav className="pagination" aria-label={t('todo.pagination.ariaLabel')}>
      <button
        type="button"
        className="pagination__nav"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        {t('todo.pagination.prev')}
      </button>
      <div className="pagination__pages">
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            className={`pagination__page${p === page ? ' is-active' : ''}`}
            onClick={() => onPageChange(p)}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="pagination__nav"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        {t('todo.pagination.next')}
      </button>
    </nav>
  );
}
