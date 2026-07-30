import JobBoardGrid from '@/Components/JobBoard/JobBoardGrid';
import FlashNoticeModal from '@/Components/FlashNoticeModal';
import Pagination from '@/Components/Pagination';
import TableSearchToolbar from '@/Components/TableSearchToolbar';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    DocumentDuplicateIcon,
    PencilSquareIcon,
    PlusIcon,
} from '@heroicons/react/24/outline';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

function filterQueryString(filters) {
    const p = new URLSearchParams();
    if (filters?.search) {
        p.set('search', filters.search);
    }
    if (filters?.per_page) {
        p.set('per_page', String(filters.per_page));
    }
    if (filters?.sort) {
        p.set('sort', filters.sort);
    }
    if (filters?.direction) {
        p.set('direction', filters.direction);
    }
    const s = p.toString();
    return s ? `?${s}` : '';
}

const MASTERLIST_SORT_OPTIONS = [
    { value: 'lead_number', label: 'Lead number' },
    { value: 'requested_at', label: 'Date' },
    { value: 'company_name', label: 'Client' },
    { value: 'site_address', label: 'Site address' },
    { value: 'status', label: 'Status' },
];

const iconBtn =
    'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#676879] transition-colors hover:bg-[#e6e9ef] hover:text-[#0073ea] focus:outline-none focus:ring-2 focus:ring-[#0073ea] focus:ring-offset-1 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-sky-400 dark:focus:ring-offset-slate-900';

const FLASH_MESSAGES = {
    'masterlist-created': 'Project info encoded and saved to the masterlist.',
    'masterlist-updated': 'Masterlist entry updated.',
    'masterlist-forwarded':
        'Project forwarded to Archi Project Management (Drafting Requests).',
    'drf-accepted': 'Drafting request accepted and added to the masterlist.',
};

export default function Index({ draftingRequests, filters = {} }) {
    const rows = draftingRequests?.data ?? [];
    const [liveSearch, setLiveSearch] = useState('');
    const hasSearch = Boolean(
        liveSearch.trim() || (filters.search ?? '').trim(),
    );
    const q = filterQueryString({
        ...filters,
        search: liveSearch.trim() || filters.search,
    });

    const reloadList = () => {
        const search = liveSearch.trim();
        router.get(
            route('job.masterlist'),
            {
                ...(search ? { search } : {}),
                per_page: filters.per_page ?? 25,
                ...(filters.sort
                    ? { sort: filters.sort, direction: filters.direction }
                    : {}),
            },
            {
                only: ['draftingRequests', 'filters'],
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <h2 className="text-xl font-semibold leading-tight text-slate-800 dark:text-slate-100">
                            Masterlist
                        </h2>
                        <p className="mt-1 text-sm text-[#676879] dark:text-[#94a3b8]">
                            Encode project info here, then forward into Drafting
                            Requests.
                        </p>
                    </div>
                    <Link
                        href={route('job.masterlist.create')}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600"
                    >
                        <PlusIcon className="h-4 w-4" aria-hidden />
                        Encode project
                    </Link>
                </div>
            }
        >
            <Head title="Masterlist" />
            <FlashNoticeModal messages={FLASH_MESSAGES} />

            <div className="overflow-hidden rounded-xl border border-[#e6e9ef] bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
                <TableSearchToolbar
                    key={`${filters.per_page ?? 25}-${filters.sort ?? ''}-${filters.direction ?? ''}`}
                    ziggyRouteName="job.masterlist"
                    filters={filters}
                    liveSearch
                    liveSearchOnly={['draftingRequests', 'filters']}
                    onLiveSearchChange={setLiveSearch}
                    defaultPerPage={25}
                    sortOptions={MASTERLIST_SORT_OPTIONS}
                    defaultSort="requested_at"
                    defaultDirection="desc"
                />

                <JobBoardGrid
                    jobs={rows}
                    variant="masterlist"
                    emptyMessage={
                        hasSearch
                            ? 'No masterlist entries match your search.'
                            : 'No projects encoded yet. Encode project info to get started.'
                    }
                    getJobHref={(row) =>
                        route('job.masterlist.show', row.id) + q
                    }
                    onCommentsUpdated={reloadList}
                    onPriorityUpdated={reloadList}
                    renderActions={(job) => (
                        <div className="inline-flex items-center gap-0.5">
                            <Link
                                href={
                                    route('job.masterlist.duplicate', job.id) + q
                                }
                                className={iconBtn}
                                title="Duplicate"
                                aria-label={`Duplicate ${job.job_no}`}
                            >
                                <DocumentDuplicateIcon className="h-4 w-4" />
                            </Link>
                            {job.can_edit_masterlist ? (
                                <Link
                                    href={
                                        route('job.masterlist.edit', job.id) + q
                                    }
                                    className={iconBtn}
                                    title="Edit"
                                    aria-label={`Edit ${job.job_no}`}
                                >
                                    <PencilSquareIcon className="h-4 w-4" />
                                </Link>
                            ) : (
                                <span className="px-1 text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                                    Forwarded
                                </span>
                            )}
                        </div>
                    )}
                />

                <Pagination pagination={draftingRequests} />
            </div>
        </AuthenticatedLayout>
    );
}
