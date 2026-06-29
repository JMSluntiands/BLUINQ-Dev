import DataTable, { DataTableSortHeader } from '@/Components/DataTable';
import DangerButton from '@/Components/DangerButton';
import DraftingStatusBadge from '@/Components/DraftingStatusBadge';
import FlashNoticeModal from '@/Components/FlashNoticeModal';
import Modal from '@/Components/Modal';
import Pagination from '@/Components/Pagination';
import SecondaryButton from '@/Components/SecondaryButton';
import TableSearchToolbar from '@/Components/TableSearchToolbar';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    PlusIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';
import { createColumnHelper } from '@tanstack/react-table';
import { Head, Link, router } from '@inertiajs/react';
import { useCallback, useMemo, useState } from 'react';

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

const iconBtn =
    'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#676879] transition-colors hover:bg-[#e6e9ef] hover:text-[#0073ea] focus:outline-none focus:ring-2 focus:ring-[#0073ea] focus:ring-offset-1 dark:text-[#94a3b8] dark:hover:bg-[#243044] dark:hover:text-white dark:focus:ring-[#1890ff] dark:focus:ring-offset-[#1a222e]';

const FLASH_MESSAGES = {
    'drf-submitted':
        'Your drafting request was submitted successfully.',
    'drf-archived': 'Drafting request moved to archive.',
};

function ApplicantCell({ row }) {
    return (
        <div className="min-w-0">
            <p className="font-medium text-[#323338] dark:text-white">
                {row.your_name}
            </p>
            <p className="truncate text-xs text-[#676879] dark:text-[#94a3b8]">
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
    const [archiveTarget, setArchiveTarget] = useState(null);

    const confirmArchive = useCallback(() => {
        if (!archiveTarget) {
            return;
        }
        router.delete(
            route('job.drafting.destroy', archiveTarget.id) + listQs,
            { preserveScroll: true },
        );
        setArchiveTarget(null);
    }, [archiveTarget, listQs]);

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
                        Job No.
                    </DataTableSortHeader>
                ),
                cell: ({ row, getValue }) => (
                    <Link
                        href={
                            route('job.drafting.show', row.original.id) +
                            listQs
                        }
                        className="font-semibold text-[#0073ea] hover:underline dark:text-[#1890ff]"
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
                    <span className="whitespace-nowrap text-[#323338] dark:text-white">
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
                        className="line-clamp-2 max-w-xs text-[#323338] dark:text-white"
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
                    <span className="text-[#323338] dark:text-white">{getValue() ?? '—'}</span>
                ),
            }),
            columnHelper.accessor('services', {
                header: () => (
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-[#676879] dark:text-[#94a3b8]">
                        Services
                    </span>
                ),
                enableSorting: false,
                cell: ({ getValue }) => (
                    <span
                        className="line-clamp-2 max-w-[14rem] text-sm text-[#676879] dark:text-[#94a3b8]"
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
                    <span className="tabular-nums text-[#323338] dark:text-white">
                        {getValue()}
                    </span>
                ),
            }),
            columnHelper.accessor('status_label', {
                header: () => (
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-[#676879] dark:text-[#94a3b8]">
                        Status
                    </span>
                ),
                enableSorting: false,
                cell: ({ row, getValue }) => (
                    <DraftingStatusBadge
                        status={row.original.status}
                        label={getValue()}
                    />
                ),
            }),
            columnHelper.display({
                id: 'actions',
                enableSorting: false,
                header: () => (
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-[#676879] dark:text-[#94a3b8]">
                        Actions
                    </span>
                ),
                meta: { align: 'right' },
                cell: ({ row }) => {
                    const r = row.original;
                    return (
                        <div className="flex flex-wrap items-center justify-end gap-0.5">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setArchiveTarget({
                                        id: r.id,
                                        reference: r.reference,
                                    });
                                }}
                                className={
                                    iconBtn +
                                    ' hover:text-[#e44258] focus:ring-[#e44258] dark:hover:text-[#f87171]'
                                }
                                title="Archive"
                                aria-label={`Archive ${r.reference}`}
                            >
                                <TrashIcon className="h-5 w-5" />
                            </button>
                        </div>
                    );
                },
            }),
        ],
        [listQs],
    );

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <h2 className="text-xl font-semibold leading-tight text-[#323338] dark:text-white">
                            Archi Team — Drafting requests
                        </h2>
                        <p className="mt-1 text-sm text-[#676879] dark:text-[#94a3b8]">
                            {canViewAllRequests
                                ? 'All submitted DRF entries for the Archi team.'
                                : 'Your submitted drafting request forms.'}
                        </p>
                    </div>
                    <Link
                        href={route('job.drafting-request-form')}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#0073ea] px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0060c4] dark:bg-[#1890ff] dark:hover:bg-[#1478e0]"
                    >
                        <PlusIcon className="h-4 w-4" aria-hidden />
                        New request
                    </Link>
                </div>
            }
        >
            <Head title="Archi Team — Drafting requests" />

            <FlashNoticeModal messages={FLASH_MESSAGES} />

            <Modal
                show={archiveTarget != null}
                onClose={() => setArchiveTarget(null)}
                maxWidth="md"
            >
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-[#323338]">
                        Archive drafting request?
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-[#676879]">
                        <span className="font-medium text-[#323338]">
                            {archiveTarget?.reference}
                        </span>{' '}
                        will move to the archive and can be restored later.
                    </p>
                    <div className="mt-6 flex flex-wrap justify-end gap-2">
                        <SecondaryButton
                            type="button"
                            onClick={() => setArchiveTarget(null)}
                            className="rounded-lg normal-case tracking-normal"
                        >
                            Cancel
                        </SecondaryButton>
                        <DangerButton
                            type="button"
                            onClick={confirmArchive}
                            className="rounded-lg normal-case tracking-normal"
                        >
                            Archive
                        </DangerButton>
                    </div>
                </div>
            </Modal>

            <div className="overflow-hidden rounded-2xl border border-[#e6e9ef] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] dark:border-[#2a3544] dark:bg-[#1a222e] dark:shadow-none">
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
