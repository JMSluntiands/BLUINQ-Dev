import DataTable, { DataTableSortHeader } from '@/Components/DataTable';
import DangerButton from '@/Components/DangerButton';
import FlashNoticeModal from '@/Components/FlashNoticeModal';
import Modal from '@/Components/Modal';
import Pagination from '@/Components/Pagination';
import SecondaryButton from '@/Components/SecondaryButton';
import TableSearchToolbar from '@/Components/TableSearchToolbar';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    ArchiveBoxArrowDownIcon,
    PencilSquareIcon,
    PlusIcon,
} from '@heroicons/react/24/outline';
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

const iconBtn =
    'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#676879] transition-colors hover:bg-[#e6e9ef] hover:text-[#0073ea] focus:outline-none focus:ring-2 focus:ring-[#0073ea] focus:ring-offset-1 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-sky-400 dark:focus:ring-offset-slate-900';

const FLASH_MESSAGES = {
    'announcement-created': 'Announcement posted successfully.',
    'announcement-updated': 'Announcement updated.',
    'announcement-archived': 'Announcement moved to archive.',
};

export default function Index({
    announcements,
    filters = {},
    canManageAnnouncements = false,
}) {
    const rows = announcements?.data ?? [];
    const hasSearch = Boolean((filters.search ?? '').trim());
    const [archiveTarget, setArchiveTarget] = useState(null);
    const q = filterQueryString(filters);

    const confirmArchive = useCallback(() => {
        if (!archiveTarget) {
            return;
        }
        router.delete(
            route('announcements.destroy', archiveTarget.id) + q,
            { preserveScroll: true },
        );
        setArchiveTarget(null);
    }, [archiveTarget, q]);

    const requestArchive = useCallback((id, title) => {
        setArchiveTarget({ id, title });
    }, []);

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
            columnHelper.accessor('excerpt', {
                header: () => (
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-[#676879] dark:text-slate-400">
                        Description
                    </span>
                ),
                enableSorting: false,
                cell: ({ getValue }) => (
                    <span className="line-clamp-2 text-[#676879] dark:text-slate-400">
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
                cell: ({ row }) => {
                    const r = row.original;
                    return (
                        <div className="flex flex-wrap items-center justify-end gap-0.5">
                            <Link
                                href={route('announcements.edit', r.id) + q}
                                className={iconBtn}
                                title="Edit"
                                aria-label={`Edit ${r.title}`}
                            >
                                <PencilSquareIcon className="h-5 w-5" />
                            </Link>
                            <button
                                type="button"
                                onClick={() => requestArchive(r.id, r.title)}
                                className={
                                    iconBtn +
                                    ' hover:text-[#e44258] focus:ring-[#e44258] dark:hover:text-rose-400'
                                }
                                title="Archive"
                                aria-label={`Archive ${r.title}`}
                            >
                                <ArchiveBoxArrowDownIcon className="h-5 w-5" />
                            </button>
                        </div>
                    );
                },
            }),
        ];
    }, [canManageAnnouncements, q, requestArchive]);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-slate-800 dark:text-slate-100">
                        Announcements
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {canManageAnnouncements && (
                            <>
                                <Link
                                    href={route('announcements.create')}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600"
                                >
                                    <PlusIcon className="h-4 w-4" aria-hidden />
                                    New announcement
                                </Link>
                                <Link
                                    href={
                                        route('announcements.archive') + q
                                    }
                                    className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                                >
                                    Archive
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            }
        >
            <Head title="Announcements" />
            <FlashNoticeModal messages={FLASH_MESSAGES} />

            <Modal
                show={archiveTarget != null}
                onClose={() => setArchiveTarget(null)}
                maxWidth="md"
            >
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-[#323338] dark:text-white">
                        Archive announcement?
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-[#676879] dark:text-slate-400">
                        <span className="font-medium text-[#323338] dark:text-white">
                            “{archiveTarget?.title}”
                        </span>{' '}
                        will move to archive and can be restored later.
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

            <div className="overflow-hidden rounded-xl border border-[#e6e9ef] bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
                <TableSearchToolbar
                    key={`${filters.search ?? ''}-${filters.per_page}`}
                    ziggyRouteName="announcements.index"
                    filters={filters}
                />
                <DataTable
                    data={rows}
                    columns={columns}
                    emptyMessage={
                        hasSearch
                            ? 'No announcements match your search.'
                            : 'No announcements yet.'
                    }
                />
                <Pagination pagination={announcements} />
            </div>
        </AuthenticatedLayout>
    );
}
