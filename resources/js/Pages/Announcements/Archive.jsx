import DataTable, { DataTableSortHeader } from '@/Components/DataTable';
import FlashNoticeModal from '@/Components/FlashNoticeModal';
import Modal from '@/Components/Modal';
import Pagination from '@/Components/Pagination';
import SecondaryButton from '@/Components/SecondaryButton';
import TableSearchToolbar from '@/Components/TableSearchToolbar';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import { createColumnHelper } from '@tanstack/react-table';
import { Head, Link, router } from '@inertiajs/react';
import { useCallback, useMemo, useState } from 'react';

const columnHelper = createColumnHelper();

function filterQueryString(filters) {
    const p = new URLSearchParams();
    if (filters?.search) {
        p.set('search', filters.search);
    }
    if (filters?.per_page) {
        p.set('per_page', String(filters.per_page));
    }
    const s = p.toString();
    return s ? `?${s}` : '';
}

const restoreBtn =
    'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#676879] transition-colors hover:bg-[#e6e9ef] hover:text-[#0073ea] focus:outline-none focus:ring-2 focus:ring-[#0073ea] focus:ring-offset-1 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-sky-400 dark:focus:ring-offset-slate-900';

const FLASH_MESSAGES = {
    'announcement-restored': 'Announcement restored to the list.',
};

export default function Archive({
    announcements,
    filters = {},
    canManageAnnouncements = false,
}) {
    const rows = announcements?.data ?? [];
    const hasSearch = Boolean((filters.search ?? '').trim());
    const q = filterQueryString(filters);
    const [restoreTarget, setRestoreTarget] = useState(null);

    const confirmRestore = useCallback(() => {
        if (!restoreTarget) {
            return;
        }
        router.post(
            route('announcements.restore', restoreTarget.id) + q,
            {},
            { preserveScroll: true },
        );
        setRestoreTarget(null);
    }, [restoreTarget, q]);

    const columns = useMemo(() => {
        const baseColumns = [
            columnHelper.accessor('title', {
                header: ({ column }) => (
                    <DataTableSortHeader column={column}>
                        Title
                    </DataTableSortHeader>
                ),
                cell: ({ getValue }) => (
                    <span className="font-medium text-[#323338] dark:text-white">
                        {getValue()}
                    </span>
                ),
            }),
            columnHelper.accessor('posted_at', {
                header: ({ column }) => (
                    <DataTableSortHeader column={column}>
                        Posted
                    </DataTableSortHeader>
                ),
                cell: ({ getValue }) => (
                    <span className="text-[#676879] dark:text-slate-400">
                        {getValue()}
                    </span>
                ),
            }),
            columnHelper.accessor('author', {
                header: ({ column }) => (
                    <DataTableSortHeader column={column}>
                        Creator
                    </DataTableSortHeader>
                ),
                cell: ({ getValue }) => (
                    <span className="text-[#676879] dark:text-slate-400">
                        {getValue()}
                    </span>
                ),
            }),
            columnHelper.accessor('archived_at_label', {
                header: ({ column }) => (
                    <DataTableSortHeader column={column}>
                        Archived
                    </DataTableSortHeader>
                ),
                cell: ({ getValue }) => (
                    <span className="text-[#676879] dark:text-slate-400">
                        {getValue()}
                    </span>
                ),
            }),
        ];

        if (!canManageAnnouncements) {
            return baseColumns;
        }

        return [
            ...baseColumns,
            columnHelper.display({
                id: 'actions',
                enableSorting: false,
                header: () => (
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-[#676879] dark:text-slate-400">
                        Actions
                    </span>
                ),
                meta: { align: 'right' },
                cell: ({ row }) => (
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={() =>
                                setRestoreTarget({
                                    id: row.original.id,
                                    title: row.original.title,
                                })
                            }
                            className={restoreBtn}
                            title="Restore"
                            aria-label={`Restore ${row.original.title}`}
                        >
                            <ArrowUturnLeftIcon className="h-5 w-5" />
                        </button>
                    </div>
                ),
            }),
        ];
    }, [canManageAnnouncements]);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-slate-800 dark:text-slate-100">
                        Announcements — Archive
                    </h2>
                    <Link
                        href={route('announcements.index') + q}
                        className="text-sm font-medium text-sky-700 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300"
                    >
                        Back to list
                    </Link>
                </div>
            }
        >
            <Head title="Announcements — Archive" />
            <FlashNoticeModal messages={FLASH_MESSAGES} />

            <Modal
                show={restoreTarget != null}
                onClose={() => setRestoreTarget(null)}
                maxWidth="md"
            >
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-[#323338] dark:text-white">
                        Restore announcement?
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-[#676879] dark:text-slate-400">
                        <span className="font-medium text-[#323338] dark:text-white">
                            “{restoreTarget?.title}”
                        </span>{' '}
                        will return to the announcements list.
                    </p>
                    <div className="mt-6 flex flex-wrap justify-end gap-2">
                        <SecondaryButton
                            type="button"
                            onClick={() => setRestoreTarget(null)}
                            className="rounded-lg normal-case tracking-normal"
                        >
                            Cancel
                        </SecondaryButton>
                        <SecondaryButton
                            type="button"
                            onClick={confirmRestore}
                            className="rounded-lg normal-case tracking-normal"
                        >
                            Restore
                        </SecondaryButton>
                    </div>
                </div>
            </Modal>

            <div className="overflow-hidden rounded-xl border border-[#e6e9ef] bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
                <TableSearchToolbar
                    key={`${filters.search ?? ''}-${filters.per_page}`}
                    ziggyRouteName="announcements.archive"
                    filters={filters}
                />
                <DataTable
                    data={rows}
                    columns={columns}
                    emptyMessage={
                        hasSearch
                            ? 'No archived announcements match your search.'
                            : 'No archived announcements.'
                    }
                />
                <Pagination pagination={announcements} />
            </div>
        </AuthenticatedLayout>
    );
}
