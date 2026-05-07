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

function formatArchivedAt(value) {
    if (!value) {
        return '—';
    }
    try {
        return new Date(value).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
    } catch {
        return value;
    }
}

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

function roleLabel(role) {
    if (role === 'admin') {
        return 'Administrator';
    }
    if (role === 'user') {
        return 'Member';
    }
    return role ?? '—';
}

const restoreBtn =
    'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#676879] transition-colors hover:bg-[#e6e9ef] hover:text-[#0073ea] focus:outline-none focus:ring-2 focus:ring-[#0073ea] focus:ring-offset-1';

const FLASH_MESSAGES = {
    'user-restored': 'User account restored to the list.',
};

export default function UsersArchive({ users, filters = {} }) {
    const rows = users?.data ?? [];
    const hasSearch = Boolean((filters.search ?? '').trim());
    const q = filterQueryString(filters);
    const [restoreTarget, setRestoreTarget] = useState(null);

    const confirmRestore = useCallback(() => {
        if (!restoreTarget) {
            return;
        }
        router.post(
            route('settings.users.restore', restoreTarget.id) + q,
            {},
            { preserveScroll: true },
        );
        setRestoreTarget(null);
    }, [restoreTarget, q]);

    const columns = useMemo(
        () => [
            columnHelper.accessor('name', {
                header: ({ column }) => (
                    <DataTableSortHeader column={column}>
                        Name
                    </DataTableSortHeader>
                ),
                cell: ({ getValue }) => (
                    <span className="font-medium text-[#323338]">
                        {getValue()}
                    </span>
                ),
            }),
            columnHelper.accessor('email', {
                header: ({ column }) => (
                    <DataTableSortHeader column={column}>
                        Email
                    </DataTableSortHeader>
                ),
                cell: ({ getValue }) => (
                    <span className="text-[#323338]">{getValue()}</span>
                ),
            }),
            columnHelper.accessor('role', {
                header: ({ column }) => (
                    <DataTableSortHeader column={column}>
                        Role
                    </DataTableSortHeader>
                ),
                cell: ({ getValue }) => (
                    <span className="inline-flex rounded-md bg-[#e6e9ef] px-2.5 py-0.5 text-xs font-semibold text-[#676879]">
                        {roleLabel(getValue())}
                    </span>
                ),
            }),
            columnHelper.accessor('archived_at', {
                header: ({ column }) => (
                    <DataTableSortHeader column={column}>
                        Archived
                    </DataTableSortHeader>
                ),
                cell: ({ getValue }) => (
                    <span className="text-[#676879]">
                        {formatArchivedAt(getValue())}
                    </span>
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
                cell: ({ row }) => (
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={() =>
                                setRestoreTarget({
                                    id: row.original.id,
                                    name: row.original.name,
                                })
                            }
                            className={restoreBtn}
                            title="Restore"
                            aria-label={`Restore ${row.original.name}`}
                        >
                            <ArrowUturnLeftIcon className="h-5 w-5" />
                        </button>
                    </div>
                ),
            }),
        ],
        [],
    );

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-[#323338]">
                        User accounts — Archive
                    </h2>
                    <Link
                        href={
                            route('settings.users.index') +
                            filterQueryString(filters)
                        }
                        className="text-sm font-semibold text-[#0073ea] hover:underline"
                    >
                        Back to list
                    </Link>
                </div>
            }
        >
            <Head title="User accounts — Archive" />

            <FlashNoticeModal title="Notice" messages={FLASH_MESSAGES} />
            <Modal
                show={restoreTarget != null}
                onClose={() => setRestoreTarget(null)}
                maxWidth="md"
            >
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-[#323338]">
                        Restore user account?
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-[#676879]">
                        <span className="font-medium text-[#323338]">
                            “{restoreTarget?.name}”
                        </span>{' '}
                        will return to the main list and can sign in again.
                    </p>
                    <div className="mt-6 flex flex-wrap justify-end gap-2">
                        <SecondaryButton
                            type="button"
                            onClick={() => setRestoreTarget(null)}
                            className="rounded-lg normal-case tracking-normal"
                        >
                            Cancel
                        </SecondaryButton>
                        <button
                            type="button"
                            onClick={confirmRestore}
                            className="inline-flex items-center rounded-lg bg-[#0073ea] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0060c4] focus:outline-none focus:ring-2 focus:ring-[#0073ea] focus:ring-offset-1"
                        >
                            Restore
                        </button>
                    </div>
                </div>
            </Modal>

            <div className="space-y-4">
                <p className="text-sm text-[#676879]">
                    Archived accounts cannot sign in. Restore a user to allow
                    access again.
                </p>

                <div className="overflow-hidden rounded-2xl border border-[#e6e9ef] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
                    <TableSearchToolbar
                        key={`${filters.search ?? ''}-${filters.per_page}`}
                        ziggyRouteName="settings.users.archive"
                        filters={filters}
                    />
                    <DataTable
                        data={rows}
                        columns={columns}
                        emptyMessage={
                            hasSearch
                                ? 'No archived users match your search.'
                                : 'No archived user accounts.'
                        }
                    />
                    <Pagination pagination={users} />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
