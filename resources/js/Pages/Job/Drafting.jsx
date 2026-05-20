import DataTable, { DataTableSortHeader } from '@/Components/DataTable';
import FlashNoticeModal from '@/Components/FlashNoticeModal';
import Pagination from '@/Components/Pagination';
import TableSearchToolbar from '@/Components/TableSearchToolbar';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PlusIcon } from '@heroicons/react/24/outline';
import { createColumnHelper } from '@tanstack/react-table';
import { Head, Link, router } from '@inertiajs/react';
import { useCallback, useMemo } from 'react';

function listQueryString(filters = {}) {
    const p = new URLSearchParams();
    if (filters.search) {
        p.set('search', filters.search);
    }
    if (filters.per_page) {
        p.set('per_page', String(filters.per_page));
    }
    const s = p.toString();
    return s ? `?${s}` : '';
}

const columnHelper = createColumnHelper();

const FLASH_MESSAGES = {
    'drf-submitted':
        'Your drafting request was submitted successfully.',
};

function ApplicantCell({ row }) {
    return (
        <div className="min-w-0">
            <p className="font-medium text-[#323338]">{row.your_name}</p>
            <p className="truncate text-xs text-[#676879]">
                {row.company_name}
            </p>
        </div>
    );
}

export default function JobDrafting({
    draftingRequests,
    filters = {},
    canViewAllRequests = false,
}) {
    const rows = draftingRequests?.data ?? [];
    const hasSearch = Boolean((filters.search ?? '').trim());
    const listQs = listQueryString(filters);

    const openRequest = useCallback(
        (row) => {
            router.visit(
                route('job.drafting.show', row.id) + listQs,
            );
        },
        [listQs],
    );

    const draftingColumns = useMemo(
        () => [
            columnHelper.accessor('reference', {
                header: ({ column }) => (
                    <DataTableSortHeader column={column}>
                        Reference
                    </DataTableSortHeader>
                ),
                cell: ({ row, getValue }) => (
                    <Link
                        href={
                            route('job.drafting.show', row.original.id) +
                            listQs
                        }
                        className="font-semibold text-[#0073ea] hover:underline"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {getValue()}
                    </Link>
                ),
            }),
            columnHelper.accessor('requested_at', {
                header: ({ column }) => (
                    <DataTableSortHeader column={column}>
                        Requested
                    </DataTableSortHeader>
                ),
                cell: ({ getValue }) => (
                    <span className="whitespace-nowrap text-[#323338]">
                        {getValue()}
                    </span>
                ),
            }),
            columnHelper.accessor('your_name', {
                header: ({ column }) => (
                    <DataTableSortHeader column={column}>
                        Applicant
                    </DataTableSortHeader>
                ),
                cell: ({ row }) => <ApplicantCell row={row.original} />,
            }),
            columnHelper.accessor('site_address', {
                header: ({ column }) => (
                    <DataTableSortHeader column={column}>
                        Site address
                    </DataTableSortHeader>
                ),
                cell: ({ getValue }) => (
                    <span
                        className="line-clamp-2 max-w-xs text-[#323338]"
                        title={getValue()}
                    >
                        {getValue()}
                    </span>
                ),
            }),
            columnHelper.accessor('building_type', {
                header: ({ column }) => (
                    <DataTableSortHeader column={column}>
                        Building type
                    </DataTableSortHeader>
                ),
                cell: ({ getValue }) => (
                    <span className="text-[#323338]">{getValue() ?? '—'}</span>
                ),
            }),
            columnHelper.accessor('services', {
                header: () => (
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-[#676879]">
                        Services
                    </span>
                ),
                enableSorting: false,
                cell: ({ getValue }) => (
                    <span
                        className="line-clamp-2 max-w-[14rem] text-sm text-[#676879]"
                        title={getValue()}
                    >
                        {getValue() || '—'}
                    </span>
                ),
            }),
            columnHelper.accessor('files_count', {
                header: ({ column }) => (
                    <DataTableSortHeader column={column}>
                        Files
                    </DataTableSortHeader>
                ),
                cell: ({ getValue }) => (
                    <span className="tabular-nums text-[#323338]">
                        {getValue()}
                    </span>
                ),
            }),
            columnHelper.accessor('status_label', {
                header: () => (
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-[#676879]">
                        Status
                    </span>
                ),
                enableSorting: false,
                cell: ({ getValue }) => (
                    <span className="inline-flex rounded-md bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200/80">
                        {getValue()}
                    </span>
                ),
            }),
        ],
        [listQs],
    );

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <h2 className="text-xl font-semibold leading-tight text-[#323338]">
                            Archi Team — Drafting requests
                        </h2>
                        <p className="mt-1 text-sm text-[#676879]">
                            {canViewAllRequests
                                ? 'All submitted DRF entries for the Archi team.'
                                : 'Your submitted drafting request forms.'}
                        </p>
                    </div>
                    <Link
                        href={route('job.drafting-request-form')}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#0073ea] px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0060c4]"
                    >
                        <PlusIcon className="h-4 w-4" aria-hidden />
                        New request
                    </Link>
                </div>
            }
        >
            <Head title="Archi Team — Drafting requests" />

            <FlashNoticeModal messages={FLASH_MESSAGES} />

            <div className="overflow-hidden rounded-2xl border border-[#e6e9ef] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
                <TableSearchToolbar
                    key={`${filters.search ?? ''}-${filters.per_page}`}
                    ziggyRouteName="job.drafting"
                    filters={filters}
                />
                <DataTable
                    data={rows}
                    columns={draftingColumns}
                    onRowClick={openRequest}
                    emptyMessage={
                        hasSearch
                            ? 'No drafting requests match your search.'
                            : 'No drafting requests yet. Submit a new request to start processing.'
                    }
                />
                <Pagination pagination={draftingRequests} />
            </div>
        </AuthenticatedLayout>
    );
}
