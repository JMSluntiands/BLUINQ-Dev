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
    ArchiveBoxArrowDownIcon,
    PlusIcon,
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
    'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#676879] transition-colors hover:bg-[#e6e9ef] hover:text-[#0073ea] focus:outline-none focus:ring-2 focus:ring-[#0073ea] focus:ring-offset-1';

const FLASH_MESSAGES = {
    'crm-quote-submitted': 'Your quote was submitted successfully.',
    'crm-quote-archived': 'Quote moved to archive.',
};

export default function QuoteList({
    quotes,
    filters = {},
    canViewAllQuotes = false,
}) {
    const rows = quotes?.data ?? [];
    const hasSearch = Boolean((filters.search ?? '').trim());
    const listQs = listQueryString(filters);
    const [archiveTarget, setArchiveTarget] = useState(null);

    const openQuote = useCallback(
        (row) => {
            router.visit(
                route('crm.quotes.show', row.id) + listQs,
            );
        },
        [listQs],
    );

    const confirmArchive = useCallback(() => {
        if (!archiveTarget) {
            return;
        }
        router.delete(
            route('crm.quotes.destroy', archiveTarget.id) + listQs,
            { preserveScroll: true },
        );
        setArchiveTarget(null);
    }, [archiveTarget, listQs]);

    const columns = useMemo(
        () => [
            columnHelper.accessor('id', {
                header: ({ column }) => (
                    <DataTableSortHeader column={column}>
                        #
                    </DataTableSortHeader>
                ),
                cell: ({ row, getValue }) => (
                    <Link
                        href={
                            route('crm.quotes.show', row.original.id) +
                            listQs
                        }
                        className="tabular-nums font-semibold text-[#0073ea] hover:underline"
                        onClick={(e) => e.stopPropagation()}
                    >
                        QDF-{String(getValue()).padStart(5, '0')}
                    </Link>
                ),
            }),
            columnHelper.accessor('requested_at', {
                header: ({ column }) => (
                    <DataTableSortHeader column={column}>
                        Date
                    </DataTableSortHeader>
                ),
                cell: ({ getValue }) => (
                    <span className="whitespace-nowrap text-[#323338]">
                        {getValue()}
                    </span>
                ),
            }),
            columnHelper.accessor('client_company_name', {
                header: ({ column }) => (
                    <DataTableSortHeader column={column}>
                        Client / Company
                    </DataTableSortHeader>
                ),
                cell: ({ getValue }) => (
                    <span className="font-medium text-[#323338]">
                        {getValue()}
                    </span>
                ),
            }),
            columnHelper.accessor('project_job_number', {
                header: ({ column }) => (
                    <DataTableSortHeader column={column}>
                        Project/Job No.
                    </DataTableSortHeader>
                ),
                cell: ({ getValue }) => (
                    <span className="text-[#323338]">
                        {getValue() || '—'}
                    </span>
                ),
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
            columnHelper.accessor('status_label', {
                header: () => (
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-[#676879]">
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
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-[#676879]">
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
                                        name: r.client_company_name,
                                    });
                                }}
                                className={
                                    iconBtn +
                                    ' hover:text-[#e44258] focus:ring-[#e44258]'
                                }
                                title="Archive"
                                aria-label={`Archive quote for ${r.client_company_name}`}
                            >
                                <ArchiveBoxArrowDownIcon className="h-5 w-5" />
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
                        <h2 className="text-xl font-semibold leading-tight text-[#323338]">
                            CRM — Quote List
                        </h2>
                        <p className="mt-1 text-sm text-[#676879]">
                            {canViewAllQuotes
                                ? 'All submitted quote details entries.'
                                : 'Your submitted quotes.'}
                        </p>
                    </div>
                    <Link
                        href={route('crm.quote-form')}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#0073ea] px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0060c4]"
                    >
                        <PlusIcon className="h-4 w-4" aria-hidden />
                        New quote
                    </Link>
                </div>
            }
        >
            <Head title="CRM — Quote List" />

            <FlashNoticeModal messages={FLASH_MESSAGES} />

            <Modal
                show={archiveTarget != null}
                onClose={() => setArchiveTarget(null)}
                maxWidth="md"
            >
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-[#323338]">
                        Archive quote?
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-[#676879]">
                        Quote for{' '}
                        <span className="font-medium text-[#323338]">
                            {archiveTarget?.name}
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

            <div className="overflow-hidden rounded-2xl border border-[#e6e9ef] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
                <TableSearchToolbar
                    key={`${filters.search ?? ''}-${filters.per_page}`}
                    ziggyRouteName="crm.quotes"
                    filters={filters}
                />
                <DataTable
                    data={rows}
                    columns={columns}
                    onRowClick={openQuote}
                    emptyMessage={
                        hasSearch
                            ? 'No quotes match your search.'
                            : 'No quotes yet. Submit a new quote to get started.'
                    }
                />
                <Pagination pagination={quotes} />
            </div>
        </AuthenticatedLayout>
    );
}
