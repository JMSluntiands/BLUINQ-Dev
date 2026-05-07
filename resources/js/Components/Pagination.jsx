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
            className="flex flex-col gap-3 border-t border-[#e6e9ef] bg-[#fafbfc] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            aria-label="Pagination"
        >
            {hasTotal && (
                <p className="text-sm text-[#676879]">
                    {from != null && to != null ? (
                        <>
                            Showing{' '}
                            <span className="font-semibold text-[#323338]">
                                {from}
                            </span>
                            {' to '}
                            <span className="font-semibold text-[#323338]">
                                {to}
                            </span>
                            {' of '}
                            <span className="font-semibold text-[#323338]">
                                {total}
                            </span>
                            {' entries'}
                        </>
                    ) : (
                        <>
                            <span className="font-semibold text-[#323338]">
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
                                    className="inline-flex min-h-[2.25rem] min-w-[2.25rem] items-center justify-center rounded-lg border border-transparent bg-[#e6e9ef]/80 px-2 py-1 text-sm text-[#676879]"
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
                                        ? 'border-[#0073ea] bg-[#0073ea] text-white shadow-sm'
                                        : 'border-[#e6e9ef] bg-white text-[#323338] hover:border-[#c5c7d0] hover:bg-[#f6f7fb]')
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
