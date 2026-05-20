import TextInput from '@/Components/TextInput';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { router, useForm } from '@inertiajs/react';

/**
 * @param {{ ziggyRouteName: string; filters?: { search?: string; per_page?: number }; queryParams?: Record<string, string> }} props
 */
export default function TableSearchToolbar({
    ziggyRouteName,
    filters = {},
    queryParams = {},
}) {
    const form = useForm({
        search: filters.search ?? '',
        per_page: String(filters.per_page ?? 10),
    });

    const go = (overrides = {}) => {
        const search = (overrides.search ?? form.data.search).trim();
        const perPage = String(overrides.per_page ?? form.data.per_page);
        router.get(
            route(ziggyRouteName),
            {
                ...queryParams,
                ...(search ? { search } : {}),
                per_page: perPage,
                page: overrides.page ?? 1,
            },
            { preserveState: true, preserveScroll: true, replace: true },
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

    return (
        <form
            onSubmit={submit}
            className="flex flex-col gap-4 border-b border-[#e6e9ef] bg-[#fafbfc] px-4 py-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6"
        >
            {/* Left: tight group — input + Search + Clear (no flex-grow on input) */}
            <div className="min-w-0 max-w-full">
                <label
                    htmlFor="table-search"
                    className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#676879]"
                >
                    Search
                </label>
                <div className="flex max-w-full flex-col gap-2 sm:inline-flex sm:w-auto sm:flex-row sm:items-end sm:gap-2">
                    <div className="relative w-full min-w-0 sm:w-80 md:w-96">
                        <MagnifyingGlassIcon
                            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#676879]"
                            aria-hidden
                        />
                        <TextInput
                            id="table-search"
                            value={form.data.search}
                            onChange={(e) =>
                                form.setData('search', e.target.value)
                            }
                            placeholder="Name or status…"
                            className="w-full !rounded-lg !border-[#c5c7d0] bg-white py-2.5 pl-10 pr-3 text-sm text-[#323338] shadow-sm placeholder:text-[#676879] !focus:border-[#0073ea] !focus:ring-[#0073ea]"
                        />
                    </div>
                    <div className="flex gap-2 sm:shrink-0">
                        <button
                            type="submit"
                            className="inline-flex flex-1 items-center justify-center rounded-lg bg-[#0073ea] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-[#0060c4] focus:outline-none focus:ring-2 focus:ring-[#0073ea] focus:ring-offset-1 sm:flex-none"
                        >
                            Search
                        </button>
                        <button
                            type="button"
                            onClick={clear}
                            className="inline-flex flex-1 items-center justify-center rounded-lg border border-[#c5c7d0] bg-white px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-[#323338] shadow-sm transition hover:bg-[#f6f7fb] sm:flex-none"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            </div>

            {/* Right: Show — pinned to end via justify-between on form */}
            <div className="flex w-full shrink-0 justify-end sm:w-auto">
                <div>
                    <label
                        htmlFor="table-per-page"
                        className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#676879]"
                    >
                        Show
                    </label>
                    <select
                        id="table-per-page"
                        className="block w-full min-w-[10rem] rounded-lg border border-[#c5c7d0] bg-white py-2.5 ps-3 pe-8 text-sm text-[#323338] shadow-sm focus:border-[#0073ea] focus:ring-[#0073ea] sm:w-40"
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
