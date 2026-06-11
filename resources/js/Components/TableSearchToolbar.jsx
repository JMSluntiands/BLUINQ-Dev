import TextInput from '@/Components/TextInput';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { router, useForm } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

function stripEphemeralSearchFromUrl(perPage) {
    const url = new URL(window.location.href);
    url.searchParams.delete('search');
    url.searchParams.delete('page');
    if (String(perPage) === '10') {
        url.searchParams.delete('per_page');
    }
    const query = url.searchParams.toString();
    window.history.replaceState(
        {},
        '',
        query ? `${url.pathname}?${query}` : url.pathname,
    );
}

/**
 * @param {{
 *   ziggyRouteName: string;
 *   filters?: { search?: string; per_page?: number };
 *   queryParams?: Record<string, string>;
 *   liveSearch?: boolean;
 *   searchDebounceMs?: number;
 *   onLiveSearchChange?: (search: string) => void;
 * }} props
 */
export default function TableSearchToolbar({
    ziggyRouteName,
    filters = {},
    queryParams = {},
    liveSearch = false,
    searchDebounceMs = 300,
    onLiveSearchChange,
}) {
    const [liveSearchValue, setLiveSearchValue] = useState('');
    const form = useForm({
        search: filters.search ?? '',
        per_page: String(filters.per_page ?? 10),
    });
    const debounceRef = useRef(null);

    const searchValue = liveSearch ? liveSearchValue : form.data.search;

    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (liveSearch) {
            return;
        }

        const nextSearch = filters.search ?? '';
        if (nextSearch !== form.data.search) {
            form.setData('search', nextSearch);
        }
    }, [filters.search, liveSearch, form.data.search, form.setData]);

    const go = (overrides = {}) => {
        const search = (
            overrides.search ?? (liveSearch ? liveSearchValue : form.data.search)
        ).trim();
        const perPage = String(overrides.per_page ?? form.data.per_page);
        router.get(
            route(ziggyRouteName),
            {
                ...queryParams,
                ...(search ? { search } : {}),
                per_page: perPage,
                page: overrides.page ?? 1,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                ...(liveSearch
                    ? {
                          onFinish: () =>
                              stripEphemeralSearchFromUrl(perPage),
                      }
                    : {}),
            },
        );
    };

    const submit = (e) => {
        e.preventDefault();
        go({ page: 1 });
    };

    const clear = () => {
        form.setData({ search: '', per_page: '10' });
        go({ search: '', per_page: '10', page: 1 });
    };

    const handleSearchChange = (e) => {
        const value = e.target.value;

        if (liveSearch) {
            setLiveSearchValue(value);
            onLiveSearchChange?.(value);

            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }

            debounceRef.current = setTimeout(() => {
                go({ search: value, page: 1 });
            }, searchDebounceMs);
            return;
        }

        form.setData('search', value);
    };

    return (
        <form
            onSubmit={liveSearch ? (e) => e.preventDefault() : submit}
            autoComplete="off"
            className="flex flex-col gap-4 border-b border-[#e6e9ef] bg-[#fafbfc] px-4 py-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6 dark:border-[#2a3544] dark:bg-[#1a222e]"
        >
            <div className="min-w-0 max-w-full">
                <label
                    htmlFor="table-search"
                    className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#676879] dark:text-[#94a3b8]"
                >
                    Search
                </label>
                <div className="flex max-w-full flex-col gap-2 sm:inline-flex sm:w-auto sm:flex-row sm:items-end sm:gap-2">
                    <div className="relative w-full min-w-0 sm:w-80 md:w-96">
                        <MagnifyingGlassIcon
                            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#676879] dark:text-[#94a3b8]"
                            aria-hidden
                        />
                        <TextInput
                            id="table-search"
                            name={liveSearch ? 'job-board-q' : 'search'}
                            value={searchValue}
                            onChange={handleSearchChange}
                            placeholder="Name or status…"
                            autoComplete={liveSearch ? 'one-time-code' : 'off'}
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck={false}
                            data-lpignore="true"
                            data-form-type="other"
                            className="w-full !rounded-lg !border-[#c5c7d0] bg-white py-2.5 pl-10 pr-3 text-sm text-[#323338] shadow-sm placeholder:text-[#676879] !focus:border-[#0073ea] !focus:ring-[#0073ea] dark:!border-[#3d4f63] dark:bg-[#0f1419] dark:text-white dark:placeholder:text-[#64748b] dark:!focus:border-[#1890ff] dark:!focus:ring-[#1890ff]"
                        />
                    </div>
                    {!liveSearch && (
                        <div className="flex gap-2 sm:shrink-0">
                            <button
                                type="submit"
                                className="inline-flex flex-1 items-center justify-center rounded-lg bg-[#0073ea] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-[#0060c4] focus:outline-none focus:ring-2 focus:ring-[#0073ea] focus:ring-offset-1 dark:bg-[#1890ff] dark:hover:bg-[#1478e0] dark:focus:ring-[#1890ff] dark:focus:ring-offset-[#1a222e] sm:flex-none"
                            >
                                Search
                            </button>
                            <button
                                type="button"
                                onClick={clear}
                                className="inline-flex flex-1 items-center justify-center rounded-lg border border-[#c5c7d0] bg-white px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-[#323338] shadow-sm transition hover:bg-[#f6f7fb] dark:border-[#3d4f63] dark:bg-transparent dark:text-white dark:hover:bg-[#243044] sm:flex-none"
                            >
                                Clear
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Show — pinned to end via justify-between on form */}
            <div className="flex w-full shrink-0 justify-end sm:w-auto">
                <div>
                    <label
                        htmlFor="table-per-page"
                        className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#676879] dark:text-[#94a3b8]"
                    >
                        Show
                    </label>
                    <select
                        id="table-per-page"
                        className="block w-full min-w-[10rem] rounded-lg border border-[#c5c7d0] bg-white py-2.5 ps-3 pe-8 text-sm text-[#323338] shadow-sm focus:border-[#0073ea] focus:ring-[#0073ea] sm:w-40 dark:border-[#3d4f63] dark:bg-[#0f1419] dark:text-white dark:focus:border-[#1890ff] dark:focus:ring-[#1890ff]"
                        value={form.data.per_page}
                        onChange={(e) => {
                            const v = e.target.value;
                            form.setData('per_page', v);
                            go({ per_page: v, page: 1 });
                        }}
                    >
                        {[5, 10, 15, 25, 50].map((n) => (
                            <option key={n} value={String(n)}>
                                {n} entries
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </form>
    );
}
