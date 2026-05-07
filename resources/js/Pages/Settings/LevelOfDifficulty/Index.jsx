import DataTable, { DataTableSortHeader } from '@/Components/DataTable';
import DangerButton from '@/Components/DangerButton';
import FlashNoticeModal from '@/Components/FlashNoticeModal';
import MondayStatusBadge from '@/Components/MondayStatusBadge';
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
    'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#676879] transition-colors hover:bg-[#e6e9ef] hover:text-[#0073ea] focus:outline-none focus:ring-2 focus:ring-[#0073ea] focus:ring-offset-1';

const FLASH_MESSAGES = {
    'level-of-difficulty-created': 'Level of difficulty created.',
    'level-of-difficulty-updated': 'Level of difficulty updated.',
    'level-of-difficulty-archived': 'Level of difficulty moved to archive.',
};

export default function LevelOfDifficultyIndex({
    levelOfDifficulties,
    filters = {},
}) {
    const rows = levelOfDifficulties?.data ?? [];
    const hasSearch = Boolean((filters.search ?? '').trim());
    const [archiveTarget, setArchiveTarget] = useState(null);

    const confirmArchive = useCallback(() => {
        if (!archiveTarget) {
            return;
        }
        const qs = filterQueryString(filters);
        router.delete(
            route(
                'settings.level-of-difficulty.destroy',
                archiveTarget.id,
            ) + qs,
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
            columnHelper.accessor('status', {
                header: ({ column }) => (
                    <DataTableSortHeader column={column}>
                        Status
                    </DataTableSortHeader>
                ),
                cell: ({ getValue }) => (
                    <MondayStatusBadge value={getValue()} />
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
                            <Link
                                href={
                                    route(
                                        'settings.level-of-difficulty.edit',
                                        r.id,
                                    ) + q
                                }
                                className={iconBtn}
                                title="Edit"
                                aria-label={`Edit ${r.name}`}
                            >
                                <PencilSquareIcon className="h-5 w-5" />
                            </Link>
                            <button
                                type="button"
                                onClick={() => requestArchive(r.id, r.name)}
                                className={
                                    iconBtn +
                                    ' hover:text-[#e44258] focus:ring-[#e44258]'
                                }
                                title="Archive"
                                aria-label={`Archive ${r.name}`}
                            >
                                <ArchiveBoxArrowDownIcon className="h-5 w-5" />
                            </button>
                        </div>
                    );
                },
            }),
        ],
        [q, requestArchive],
    );

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-[#323338]">
                        Level of difficulty — List
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href={route('settings.level-of-difficulty.create')}
                            className="inline-flex items-center rounded-lg bg-[#0073ea] px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0060c4]"
                        >
                            Add level
                        </Link>
                        <Link
                            href={
                                route('settings.level-of-difficulty.archive') +
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
            <Head title="Level of difficulty — List" />

            <FlashNoticeModal messages={FLASH_MESSAGES} />

            <Modal
                show={archiveTarget != null}
                onClose={() => setArchiveTarget(null)}
                maxWidth="md"
            >
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-[#323338]">
                        Archive level of difficulty?
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-[#676879]">
                        <span className="font-medium text-[#323338]">
                            “{archiveTarget?.name}”
                        </span>{' '}
                        will move to Archive and can be restored later.
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
                        ziggyRouteName="settings.level-of-difficulty.index"
                        filters={filters}
                    />
                    <DataTable
                        data={rows}
                        columns={columns}
                        emptyMessage={
                            hasSearch
                                ? 'No levels match your search.'
                                : 'No levels yet. Add one to get started.'
                        }
                    />
                    <Pagination pagination={levelOfDifficulties} />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
