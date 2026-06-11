import { Link } from '@inertiajs/react';

/**
 * Laravel LengthAwarePaginator JSON (flat keys: data, links, last_page, from, …).
 *
 * @param {{
 *   data?: unknown[];
 *   links?: Array<{ url: string | null; label: string; active: boolean }>;
 *   last_page?: number;
 *   from?: number | null;
 *   to?: number | null;
 *   total?: number;
 * }} pagination
 */
export default function Pagination({ pagination }) {
    if (!pagination) {
        return null;
    }

    const { from, to, total, links = [] } = pagination;
    const lastPage = pagination.last_page ?? 1;
    const showPageLinks = lastPage > 1;
    const hasTotal = total != null && total > 0;

    if (!hasTotal && !showPageLinks) {
        return null;
    }

    return (
        <nav
            className="flex flex-col gap-3 border-t border-[#e6e9ef] bg-[#fafbfc] px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-[#2a3544] dark:bg-[#1a222e]"
            aria-label="Pagination"
        >
            {hasTotal && (
                <p className="text-sm text-[#676879] dark:text-[#94a3b8]">
                    {from != null && to != null ? (
                        <>
                            Showing{' '}
                            <span className="font-semibold text-[#323338] dark:text-white">
                                {from}
                            </span>
                            {' to '}
                            <span className="font-semibold text-[#323338] dark:text-white">
                                {to}
                            </span>
                            {' of '}
                            <span className="font-semibold text-[#323338] dark:text-white">
                                {total}
                            </span>
                            {' entries'}
                        </>
                    ) : (
                        <>
                            <span className="font-semibold text-[#323338] dark:text-white">
                                {total}
                            </span>{' '}
                            {total === 1 ? 'entry' : 'entries'}
                        </>
                    )}
                </p>
            )}
            {showPageLinks && (
                <div className="flex flex-wrap items-center justify-end gap-1">
                    {links.map((link, i) => {
                        const pageLabel = (
                            <span
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                className="px-0.5"
                            />
                        );
                        if (link.url === null) {
                            return (
                                <span
                                    key={i}
                                    className="inline-flex min-h-[2.25rem] min-w-[2.25rem] items-center justify-center rounded-lg border border-transparent bg-[#e6e9ef]/80 px-2 py-1 text-sm text-[#676879] dark:bg-[#243044] dark:text-[#64748b]"
                                >
                                    {pageLabel}
                                </span>
                            );
                        }
                        return (
                            <Link
                                key={i}
                                href={link.url}
                                preserveScroll
                                className={
                                    'inline-flex min-h-[2.25rem] min-w-[2.25rem] items-center justify-center rounded-lg border px-2 py-1 text-sm font-medium transition ' +
                                    (link.active
                                        ? 'border-[#0073ea] bg-[#0073ea] text-white shadow-sm dark:border-[#1890ff] dark:bg-[#1890ff]'
                                        : 'border-[#e6e9ef] bg-white text-[#323338] hover:border-[#c5c7d0] hover:bg-[#f6f7fb] dark:border-[#3d4f63] dark:bg-[#0f1419] dark:text-white dark:hover:border-[#4a5568] dark:hover:bg-[#243044]')
                                }
                            >
                                {pageLabel}
                            </Link>
                        );
                    })}
                </div>
            )}
        </nav>
    );
}
