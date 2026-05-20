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
} from '@heroicons/react/24/outline';
import { createColumnHelper } from '@tanstack/react-table';
import { Head, Link, router, usePage } from '@inertiajs/react';
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

function roleLabel(role) {
    if (role === 'admin') {
        return 'Administrator';
    }
    if (role === 'user') {
        return 'Member';
    }
    return role ?? '—';
}

const iconBtn =
    'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#676879] transition-colors hover:bg-[#e6e9ef] hover:text-[#0073ea] focus:outline-none focus:ring-2 focus:ring-[#0073ea] focus:ring-offset-1';

const FLASH_MESSAGES = {
    'user-created': 'User account created.',
    'user-updated': 'User account updated.',
    'user-archived': 'User account moved to archive.',
    'user-cannot-archive-self': 'You cannot archive your own account.',
    'user-last-admin': 'Cannot archive the last active administrator.',
    'user-already-archived': 'That account is already archived.',
    'user-not-archived': 'That account is not archived.',
};

export default function UsersIndex({ users, filters = {} }) {
    const authUser = usePage().props.auth?.user;
    const currentUserId = authUser?.id;
    const rows = users?.data ?? [];
    const hasSearch = Boolean((filters.search ?? '').trim());
    const [archiveTarget, setArchiveTarget] = useState(null);

    const confirmArchive = useCallback(() => {
        if (!archiveTarget) {
            return;
        }
        const qs = filterQueryString(filters);
        router.delete(
            route('settings.users.destroy', archiveTarget.id) + qs,
            { preserveScroll: true },
        );
        setArchiveTarget(null);
    }, [archiveTarget, filters]);

    const requestArchive = useCallback((id, name) => {
        setArchiveTarget({ id, name });
    }, []);

    const q = filterQueryString(filters);

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
            columnHelper.accessor('role_name', {
                header: ({ column }) => (
                    <DataTableSortHeader column={column}>
                        Role
                    </DataTableSortHeader>
                ),
                cell: ({ row }) => (
                    <span className="inline-flex rounded-md bg-[#e6e9ef] px-2.5 py-0.5 text-xs font-semibold text-[#676879]">
                        {row.original.role_name ??
                            roleLabel(row.original.role)}
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
                cell: ({ row }) => {
                    const r = row.original;
                    const isSelf = currentUserId != null && r.id === currentUserId;
                    return (
                        <div className="flex flex-wrap items-center justify-end gap-0.5">
                            <Link
                                href={
                                    route('settings.users.edit', r.id) + q
                                }
                                className={iconBtn}
                                title="Edit"
                                aria-label={`Edit ${r.name}`}
                            >
                                <PencilSquareIcon className="h-5 w-5" />
                            </Link>
                            {!isSelf && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        requestArchive(r.id, r.name)
                                    }
                                    className={
                                        iconBtn +
                                        ' hover:text-[#e44258] focus:ring-[#e44258]'
                                    }
                                    title="Archive"
                                    aria-label={`Archive ${r.name}`}
                                >
                                    <ArchiveBoxArrowDownIcon className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                    );
                },
            }),
        ],
        [q, requestArchive, currentUserId],
    );

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-[#323338]">
                        User accounts — List
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href={route('settings.users.create')}
                            className="inline-flex items-center rounded-lg bg-[#0073ea] px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0060c4]"
                        >
                            Add user
                        </Link>
                        <Link
                            href={
                                route('settings.users.archive') +
                                filterQueryString(filters)
                            }
                            className="inline-flex items-center rounded-lg border border-[#c5c7d0] bg-white px-3 py-2 text-sm font-semibold text-[#323338] shadow-sm transition hover:bg-[#f6f7fb]"
                        >
                            Archive
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="User accounts — List" />

            <FlashNoticeModal title="Notice" messages={FLASH_MESSAGES} />

            <Modal
                show={archiveTarget != null}
                onClose={() => setArchiveTarget(null)}
                maxWidth="md"
            >
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-[#323338]">
                        Archive user account?
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-[#676879]">
                        <span className="font-medium text-[#323338]">
                            “{archiveTarget?.name}”
                        </span>{' '}
                        will be archived and cannot sign in until restored.
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

            <div className="space-y-4">
                <div className="overflow-hidden rounded-2xl border border-[#e6e9ef] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
                    <TableSearchToolbar
                        key={`${filters.search ?? ''}-${filters.per_page}`}
                        ziggyRouteName="settings.users.index"
                        filters={filters}
                    />
                    <DataTable
                        data={rows}
                        columns={columns}
                        emptyMessage={
                            hasSearch
                                ? 'No users match your search.'
                                : 'No user accounts yet. Add one to get started.'
                        }
                    />
                    <Pagination pagination={users} />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
