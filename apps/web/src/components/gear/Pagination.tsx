import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { buildSearch, pageWindow, type SearchParams } from '@/lib/gearFilters';

type Props = {
  page: number;
  total: number;
  limit: number;
  basePath: string;
  searchParams: SearchParams;
};

export function Pagination({ page, total, limit, basePath, searchParams }: Props) {
  const t = useTranslations('pagination');
  const totalPages = Math.max(1, Math.ceil(total / limit));
  if (totalPages <= 1) return null;
  const href = (p: number) =>
    `${basePath}${buildSearch(searchParams, { page: p === 1 ? undefined : String(p) })}`;

  return (
    <nav className="pagination" aria-label={t('label')}>
      {page > 1 ? <Link href={href(page - 1)}>{t('previous')}</Link> : <span>{t('previous')}</span>}
      {pageWindow(page, totalPages).map((p) => (
        <Link key={p} href={href(p)} aria-current={p === page ? 'page' : undefined}>
          {p}
        </Link>
      ))}
      {page < totalPages ? (
        <Link href={href(page + 1)}>{t('next')}</Link>
      ) : (
        <span>{t('next')}</span>
      )}
    </nav>
  );
}
