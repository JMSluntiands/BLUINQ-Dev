import DataTable, { DataTableSortHeader } from '@/Components/DataTable';
import DraftingMemoFormModal from '@/Components/Job/DraftingMemoFormModal';
import DangerButton from '@/Components/DangerButton';
import FlashNoticeModal from '@/Components/FlashNoticeModal';
import Modal from '@/Components/Modal';
import Pagination from '@/Components/Pagination';
import SecondaryButton from '@/Components/SecondaryButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    ArrowDownTrayIcon,
    PencilSquareIcon,
    PlusIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';
import { createColumnHelper } from '@tanstack/react-table';
import { Head, router } from '@inertiajs/react';
import { useCallback, useMemo, useState } from 'react';

const columnHelper = createColumnHelper();

const iconBtn =
    'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#676879] transition-colors hover:bg-[#e6e9ef] hover:text-[#0073ea] focus:outline-none focus:ring-2 focus:ring-[#0073ea] focus:ring-offset-1 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-sky-400 dark:focus:ring-offset-slate-900';

const tagPillClass =
    'inline-flex rounded border border-[#c5c7d0] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#676879] dark:border-[#3a3f55] dark:text-slate-300';

const FLASH_MESSAGES = {
    'drafting-memo-created': 'Drafting memo added.',
    'drafting-memo-updated': 'Drafting memo updated.',
    'drafting-memo-deleted': 'Drafting memo deleted.',
    'drafting-memo-tag-created': 'Tag added.',
};

function filterQueryString(filters = {}) {
    const params = new URLSearchParams();
    if (filters.search) {
        params.set('search', filters.search);
    }
    if (filters.per_page) {
        params.set('per_page', String(filters.per_page));
    }
    if (filters.client) {
        params.set('client', filters.client);
    }
    if (filters.tag_id) {
        params.set('tag_id', String(filters.tag_id));
    }
    if (filters.sort) {
        params.set('sort', filters.sort);
    }
    const query = params.toString();

    return query ? `?${query}` : '';
}

function MemoDescriptionModal({ memo, onClose }) {
    if (!memo) {
        return null;
    }

    return (
        <Modal show={Boolean(memo)} onClose={onClose} maxWidth="2xl">
            <div className="p-6">
                <h2 className="text-lg font-semibold text-[#323338] dark:text-white">
                    {memo.client_name}
                </h2>
                <p className="mt-1 text-sm text-[#676879] dark:text-slate-400">
                    {memo.memo_date}
                </p>
                <div
                    className="rich-text-content mt-4 max-h-[28rem] overflow-y-auto text-sm text-[#323338] dark:text-slate-200 [&_img]:max-h-64 [&_img]:rounded-md [&_p]:mb-2"
                    dangerouslySetInnerHTML={{
                        __html: memo.description || '<p>—</p>',
                    }}
                />
                <div className="mt-6 flex justify-end">
                    <SecondaryButton
                        type="button"
                        onClick={onClose}
                        className="rounded-lg normal-case tracking-normal"
                    >
                        Close
                    </SecondaryButton>
                </div>
            </div>
        </Modal>
    );
}

export default function Index({
    memos,
    filters = {},
    clients = [],
    tags = [],
    canManageMemos = false,
    canManageTags = false,
}) {
    const rows = memos?.data ?? [];
    const q = filterQueryString(filters);
    const [formMemo, setFormMemo] = useState(null);
    const [formOpen, setFormOpen] = useState(false);
    const [viewMemo, setViewMemo] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const applyFilters = useCallback(
        (next) => {
            router.get(
                route('drafting-memos.index'),
                {
                    search: next.search ?? filters.search ?? '',
                    per_page: next.per_page ?? filters.per_page ?? 10,
                    client: next.client ?? filters.client ?? '',
                    tag_id: next.tag_id ?? filters.tag_id ?? '',
                    sort: next.sort ?? filters.sort ?? 'date_desc',
                },
                { preserveState: true, preserveScroll: true },
            );
        },
        [filters],
    );

    const openCreate = () => {
        setFormMemo(null);
        setFormOpen(true);
    };

    const openEdit = useCallback((memo) => {
        setFormMemo(memo);
        setFormOpen(true);
    }, []);

    const confirmDelete = useCallback(() => {
        if (!deleteTarget) {
            return;
        }

        router.delete(route('drafting-memos.destroy', deleteTarget.id) + q, {
            preserveScroll: true,
        });
        setDeleteTarget(null);
    }, [deleteTarget, q]);

    const columns = useMemo(() => {
        const baseColumns = [
            columnHelper.accessor('client_name', {
                header: ({ column }) => (
                    <DataTableSortHeader column={column}>
                        Client name
                    </DataTableSortHeader>
                ),
                cell: ({ getValue }) => (
                    <span className="font-semibold uppercase text-[#323338] dark:text-white">
                        {getValue()}
                    </span>
                ),
            }),
            columnHelper.accessor('description_excerpt', {
                id: 'description',
                header: () => (
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-[#676879] dark:text-slate-400">
                        Memo / description
                    </span>
                ),
                enableSorting: false,
                cell: ({ row }) => {
                    const memo = row.original;

                    return (
                        <button
                            type="button"
                            onClick={() => setViewMemo(memo)}
                            className="line-clamp-2 text-left text-[#676879] transition hover:text-[#0073ea] dark:text-slate-400 dark:hover:text-[#1890ff]"
                        >
                            {memo.description_excerpt}
                        </button>
                    );
                },
            }),
            columnHelper.display({
                id: 'attachment',
                header: () => (
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-[#676879] dark:text-slate-400">
                        Email attachment
                    </span>
                ),
                cell: ({ row }) => {
                    const memo = row.original;

                    if (!memo.has_attachment) {
                        return (
                            <span className="text-[#676879] dark:text-slate-500">
                                —
                            </span>
                        );
                    }

                    return (
                        <a
                            href={memo.attachment_url}
                            className="inline-flex max-w-[12rem] items-center gap-2 rounded-md border border-[#c5c7d0] bg-[#f5f6f8] px-2 py-1.5 text-xs text-[#323338] transition hover:border-[#0073ea] dark:border-[#2f3347] dark:bg-[#151622] dark:text-slate-200"
                            title={memo.attachment_name}
                        >
                            <ArrowDownTrayIcon className="h-4 w-4 shrink-0 text-[#0073ea]" />
                            <span className="truncate">
                                {memo.attachment_name}
                            </span>
                        </a>
                    );
                },
            }),
            columnHelper.accessor('reference_url', {
                header: () => (
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-[#676879] dark:text-slate-400">
                        Reference
                    </span>
                ),
                enableSorting: false,
                cell: ({ getValue }) => {
                    const url = getValue();

                    if (!url) {
                        return (
                            <span className="text-[#676879] dark:text-slate-500">
                                —
                            </span>
                        );
                    }

                    return (
                        <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold uppercase text-[#0073ea] hover:underline dark:text-[#1890ff]"
                        >
                            Link
                        </a>
                    );
                },
            }),
            columnHelper.accessor('memo_date', {
                header: ({ column }) => (
                    <DataTableSortHeader column={column}>
                        Date
                    </DataTableSortHeader>
                ),
                cell: ({ getValue }) => (
                    <span className="whitespace-nowrap tabular-nums text-[#676879] dark:text-slate-400">
                        {getValue()}
                    </span>
                ),
            }),
            columnHelper.accessor('tags', {
                header: () => (
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-[#676879] dark:text-slate-400">
                        Tags
                    </span>
                ),
                enableSorting: false,
                cell: ({ getValue }) => {
                    const memoTags = getValue() ?? [];

                    if (!memoTags.length) {
                        return (
                            <span className="text-[#676879] dark:text-slate-500">
                                —
                            </span>
                        );
                    }

                    return (
                        <div className="flex max-w-[14rem] flex-wrap gap-1">
                            {memoTags.map((tag) => (
                                <span key={tag.id} className={tagPillClass}>
                                    {tag.name}
                                </span>
                            ))}
                        </div>
                    );
                },
            }),
        ];

        if (!canManageMemos) {
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
                    const memo = row.original;

                    return (
                        <div className="flex flex-wrap items-center justify-end gap-0.5">
                            <button
                                type="button"
                                onClick={() => openEdit(memo)}
                                className={iconBtn}
                                title="Edit"
                                aria-label={`Edit memo for ${memo.client_name}`}
                            >
                                <PencilSquareIcon className="h-5 w-5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setDeleteTarget(memo)}
                                className={iconBtn + ' hover:text-rose-600 dark:hover:text-rose-400'}
                                title="Delete"
                                aria-label={`Delete memo for ${memo.client_name}`}
                            >
                                <TrashIcon className="h-5 w-5" />
                            </button>
                        </div>
                    );
                },
            }),
        ];
    }, [canManageMemos, openEdit]);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-[#323338] dark:text-white">
                            Drafting Memos
                        </h2>
                        <p className="mt-1 text-sm text-[#676879] dark:text-slate-400">
                            Latest memos visible and editable by the team.
                        </p>
                    </div>
                    {canManageMemos && (
                        <button
                            type="button"
                            onClick={openCreate}
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#0073ea] px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0060c4] dark:bg-[#1890ff] dark:hover:bg-[#1478e0]"
                        >
                            <PlusIcon className="h-4 w-4" aria-hidden />
                            Add memo
                        </button>
                    )}
                </div>
            }
        >
            <Head title="Drafting Memos" />

            <FlashNoticeModal messages={FLASH_MESSAGES} />

            <div className="overflow-hidden rounded-xl border border-[#e6e9ef] bg-white shadow-sm dark:border-[#2f3347] dark:bg-[#1a1b2e] dark:shadow-none">
                <div className="border-b border-[#e6e9ef] px-4 py-4 dark:border-[#2f3347] sm:px-6">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-[#323338] dark:text-white">
                            Latest memos
                        </h3>
                        <div className="grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="sm:col-span-2">
                                <label
                                    htmlFor="memo-search"
                                    className="text-xs font-semibold uppercase tracking-wide text-[#676879] dark:text-slate-400"
                                >
                                    Search tags
                                </label>
                                <input
                                    id="memo-search"
                                    type="search"
                                    defaultValue={filters.search ?? ''}
                                    placeholder="Search tags…"
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') {
                                            applyFilters({
                                                search: event.currentTarget.value,
                                            });
                                        }
                                    }}
                                    className="mt-1 block w-full rounded-md border border-[#c5c7d0] bg-white px-3 py-2 text-sm text-[#323338] shadow-sm focus:border-[#0073ea] focus:outline-none focus:ring-1 focus:ring-[#0073ea] dark:border-[#2f3347] dark:bg-[#151622] dark:text-slate-200"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="memo-client-filter"
                                    className="text-xs font-semibold uppercase tracking-wide text-[#676879] dark:text-slate-400"
                                >
                                    Client
                                </label>
                                <select
                                    id="memo-client-filter"
                                    value={filters.client ?? ''}
                                    onChange={(event) =>
                                        applyFilters({ client: event.target.value })
                                    }
                                    className="mt-1 block w-full rounded-md border border-[#c5c7d0] bg-white px-3 py-2 text-sm text-[#323338] shadow-sm focus:border-[#0073ea] focus:outline-none focus:ring-1 focus:ring-[#0073ea] dark:border-[#2f3347] dark:bg-[#151622] dark:text-slate-200"
                                >
                                    <option value="">All clients</option>
                                    {clients.map((client) => (
                                        <option key={client} value={client}>
                                            {client}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label
                                    htmlFor="memo-tag-filter"
                                    className="text-xs font-semibold uppercase tracking-wide text-[#676879] dark:text-slate-400"
                                >
                                    Tag
                                </label>
                                <select
                                    id="memo-tag-filter"
                                    value={filters.tag_id ?? ''}
                                    onChange={(event) =>
                                        applyFilters({
                                            tag_id: event.target.value,
                                        })
                                    }
                                    className="mt-1 block w-full rounded-md border border-[#c5c7d0] bg-white px-3 py-2 text-sm text-[#323338] shadow-sm focus:border-[#0073ea] focus:outline-none focus:ring-1 focus:ring-[#0073ea] dark:border-[#2f3347] dark:bg-[#151622] dark:text-slate-200"
                                >
                                    <option value="">All tags</option>
                                    {tags.map((tag) => (
                                        <option key={tag.id} value={tag.id}>
                                            {tag.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <label
                            htmlFor="memo-sort"
                            className="text-xs font-semibold uppercase tracking-wide text-[#676879] dark:text-slate-400"
                        >
                            Date sort
                        </label>
                        <select
                            id="memo-sort"
                            value={filters.sort ?? 'date_desc'}
                            onChange={(event) =>
                                applyFilters({ sort: event.target.value })
                            }
                            className="rounded-md border border-[#c5c7d0] bg-white px-3 py-2 text-sm text-[#323338] shadow-sm focus:border-[#0073ea] focus:outline-none focus:ring-1 focus:ring-[#0073ea] dark:border-[#2f3347] dark:bg-[#151622] dark:text-slate-200"
                        >
                            <option value="date_desc">Newest first</option>
                            <option value="date_asc">Oldest first</option>
                        </select>
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={rows}
                    emptyMessage="No drafting memos yet."
                />
                <Pagination pagination={memos} />
            </div>

            <DraftingMemoFormModal
                show={formOpen}
                memo={formMemo}
                tags={tags}
                filters={filters}
                canManageTags={canManageTags}
                onClose={() => {
                    setFormOpen(false);
                    setFormMemo(null);
                }}
            />

            <MemoDescriptionModal
                memo={viewMemo}
                onClose={() => setViewMemo(null)}
            />

            <Modal
                show={deleteTarget != null}
                onClose={() => setDeleteTarget(null)}
                maxWidth="sm"
            >
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-[#323338] dark:text-white">
                        Delete memo?
                    </h2>
                    <p className="mt-2 text-sm text-[#676879] dark:text-slate-400">
                        This will permanently remove the memo for{' '}
                        <span className="font-semibold text-[#323338] dark:text-white">
                            {deleteTarget?.client_name}
                        </span>
                        .
                    </p>
                    <div className="mt-6 flex justify-end gap-2">
                        <SecondaryButton
                            type="button"
                            onClick={() => setDeleteTarget(null)}
                            className="rounded-lg normal-case tracking-normal"
                        >
                            Cancel
                        </SecondaryButton>
                        <DangerButton
                            type="button"
                            onClick={confirmDelete}
                            className="rounded-lg normal-case tracking-normal"
                        >
                            Delete
                        </DangerButton>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
