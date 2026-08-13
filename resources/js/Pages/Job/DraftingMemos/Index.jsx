import DangerButton from '@/Components/DangerButton';
import DraftingMemoFormModal from '@/Components/Job/DraftingMemoFormModal';
import FlashNoticeModal from '@/Components/FlashNoticeModal';
import Modal from '@/Components/Modal';
import Pagination from '@/Components/Pagination';
import SecondaryButton from '@/Components/SecondaryButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    ArrowDownTrayIcon,
    ArrowTopRightOnSquareIcon,
    CalendarDaysIcon,
    DocumentTextIcon,
    MagnifyingGlassIcon,
    PencilSquareIcon,
    PlusIcon,
    TagIcon,
    TrashIcon,
    UserCircleIcon,
} from '@heroicons/react/24/outline';
import { Head, router } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

const tagPillClass =
    'inline-flex rounded border border-slate-300 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-600 dark:text-slate-300';

const fieldClass =
    'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100';

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
    if (filters.memo) {
        params.set('memo', String(filters.memo));
    }
    const query = params.toString();

    return query ? `?${query}` : '';
}

function referenceLinks(memo) {
    const raw = String(memo?.reference_url ?? '').trim();
    if (!raw) {
        return [];
    }

    return raw
        .split(/[\n,]+/)
        .map((url) => url.trim())
        .filter(Boolean);
}

function MemoPreview({ memo, canManageMemos, onEdit, onDelete }) {
    if (!memo) {
        return (
            <div className="flex h-full min-h-[28rem] flex-col items-center justify-center px-6 text-center">
                <DocumentTextIcon
                    className="h-10 w-10 text-slate-300 dark:text-slate-600"
                    aria-hidden
                />
                <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                    Select a memo to preview
                </p>
                <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                    Choose an item from the list to read the full content,
                    attachments, and reference links.
                </p>
            </div>
        );
    }

    const tags = memo.tags ?? [];
    const links = referenceLinks(memo);

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="shrink-0 border-b border-slate-200 px-5 py-4 dark:border-slate-700">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                            Preview
                        </p>
                        <h3 className="mt-1 truncate text-lg font-semibold text-slate-900 dark:text-white">
                            {memo.client_name}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                            {memo.description_excerpt}
                        </p>
                    </div>
                    {canManageMemos ? (
                        <div className="flex shrink-0 items-center gap-1">
                            <button
                                type="button"
                                onClick={() => onEdit(memo)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-sky-600 dark:hover:bg-slate-800 dark:hover:text-sky-400"
                                title="Edit"
                                aria-label="Edit memo"
                            >
                                <PencilSquareIcon className="h-5 w-5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => onDelete(memo)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                                title="Delete"
                                aria-label="Delete memo"
                            >
                                <TrashIcon className="h-5 w-5" />
                            </button>
                        </div>
                    ) : null}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1.5 font-medium tabular-nums text-slate-700 dark:text-slate-200">
                        <CalendarDaysIcon className="h-3.5 w-3.5" aria-hidden />
                        {memo.memo_date}
                    </span>
                    {tags.length > 0 ? (
                        <>
                            <span className="text-slate-300 dark:text-slate-600">
                                ·
                            </span>
                            <span className="inline-flex flex-wrap items-center gap-1.5">
                                <TagIcon className="h-3.5 w-3.5" aria-hidden />
                                {tags.map((tag) => (
                                    <span key={tag.id} className={tagPillClass}>
                                        {tag.name}
                                    </span>
                                ))}
                            </span>
                        </>
                    ) : null}
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                <div className="memo-view-paper rounded-xl border border-slate-200 bg-white px-4 py-4 dark:border-slate-700 dark:bg-slate-950/40 sm:px-5 sm:py-5">
                    <div
                        className="memo-view-richtext rich-text-content text-sm leading-relaxed text-slate-800 dark:text-slate-100"
                        dangerouslySetInnerHTML={{
                            __html: memo.description || '<p>—</p>',
                        }}
                    />
                </div>
            </div>

            <div className="shrink-0 space-y-3 border-t border-slate-200 bg-slate-50/80 px-5 py-4 dark:border-slate-700 dark:bg-slate-800/40">
                <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                            Tags
                        </p>
                        {tags.length === 0 ? (
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                —
                            </p>
                        ) : (
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                                {tags.map((tag) => (
                                    <span key={tag.id} className={tagPillClass}>
                                        {tag.name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                            Attachments
                        </p>
                        {memo.has_attachment ? (
                            <a
                                href={memo.attachment_url}
                                className="mt-1.5 inline-flex max-w-full items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-sky-500 hover:text-sky-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                                title={memo.attachment_name}
                            >
                                <ArrowDownTrayIcon
                                    className="h-3.5 w-3.5 shrink-0 text-sky-600"
                                    aria-hidden
                                />
                                <span className="truncate">
                                    {memo.attachment_name}
                                </span>
                            </a>
                        ) : (
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                —
                            </p>
                        )}
                    </div>
                </div>

                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Reference links
                    </p>
                    {links.length === 0 ? (
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            —
                        </p>
                    ) : (
                        <ul className="mt-1.5 space-y-1">
                            {links.map((url) => (
                                <li key={url}>
                                    <a
                                        href={url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex max-w-full items-center gap-1.5 text-sm font-medium text-sky-600 hover:underline dark:text-sky-400"
                                    >
                                        <ArrowTopRightOnSquareIcon
                                            className="h-3.5 w-3.5 shrink-0"
                                            aria-hidden
                                        />
                                        <span className="truncate">{url}</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="flex items-center gap-2 border-t border-slate-200 pt-3 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
                    <UserCircleIcon
                        className="h-5 w-5 shrink-0 text-slate-400"
                        aria-hidden
                    />
                    <span>
                        Memo posted by{' '}
                        <span className="font-semibold text-slate-800 dark:text-white">
                            {memo.author && memo.author !== '—'
                                ? memo.author
                                : 'Unknown'}
                        </span>
                    </span>
                </div>
            </div>
        </div>
    );
}

export default function Index({
    memos,
    selectedMemo = null,
    filters = {},
    clients = [],
    tags = [],
    canManageMemos = false,
    canManageTags = false,
}) {
    const rows = memos?.data ?? [];
    const [formMemo, setFormMemo] = useState(null);
    const [formOpen, setFormOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [activeMemo, setActiveMemo] = useState(selectedMemo);

    useEffect(() => {
        setActiveMemo(selectedMemo);
    }, [selectedMemo]);

    const clientNames = useMemo(
        () =>
            clients.map((client) =>
                typeof client === 'string' ? client : client.name,
            ),
        [clients],
    );

    const applyFilters = useCallback(
        (next) => {
            router.get(
                route('drafting-memos.index'),
                {
                    search: next.search ?? filters.search ?? '',
                    per_page: next.per_page ?? filters.per_page ?? 20,
                    client: next.client ?? filters.client ?? '',
                    tag_id: next.tag_id ?? filters.tag_id ?? '',
                    sort: next.sort ?? filters.sort ?? 'date_desc',
                    memo: next.memo ?? filters.memo ?? '',
                },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        },
        [filters],
    );

    const selectMemo = (memo) => {
        setActiveMemo(memo);
        applyFilters({ memo: memo.id });
    };

    const openCreate = () => {
        setFormMemo(null);
        setFormOpen(true);
    };

    const openEdit = useCallback((memo) => {
        setFormMemo(memo);
        setFormOpen(true);
    }, []);

    const q = filterQueryString({
        ...filters,
        memo: activeMemo?.id ?? filters.memo,
    });

    const confirmDelete = useCallback(() => {
        if (!deleteTarget) {
            return;
        }

        router.delete(route('drafting-memos.destroy', deleteTarget.id) + q, {
            preserveScroll: true,
        });
        setDeleteTarget(null);
    }, [deleteTarget, q]);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-slate-800 dark:text-slate-100">
                            Drafting Memos
                        </h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Latest memos visible and editable by the team.
                        </p>
                    </div>
                    {canManageMemos && (
                        <button
                            type="button"
                            onClick={openCreate}
                            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-sky-600 px-4 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600"
                        >
                            <PlusIcon className="h-4 w-4 shrink-0" aria-hidden />
                            Add memo
                        </button>
                    )}
                </div>
            }
        >
            <Head title="Drafting Memos" />
            <FlashNoticeModal messages={FLASH_MESSAGES} />

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 lg:grid lg:min-h-[70vh] lg:grid-cols-12">
                {/* Memo list */}
                <section className="flex min-h-0 flex-col border-b border-slate-200 dark:border-slate-700 lg:col-span-5 lg:border-b-0 lg:border-r">
                    <div className="shrink-0 space-y-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700 sm:px-5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-800 dark:text-white">
                                Latest memos
                            </h3>
                            <select
                                value={filters.sort ?? 'date_desc'}
                                aria-label="Date sort"
                                onChange={(event) =>
                                    applyFilters({
                                        sort: event.target.value,
                                        memo: '',
                                    })
                                }
                                className={fieldClass}
                            >
                                <option value="date_desc">Newest first</option>
                                <option value="date_asc">Oldest first</option>
                            </select>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <div className="relative min-w-[10rem] flex-1">
                                <MagnifyingGlassIcon
                                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                                    aria-hidden
                                />
                                <input
                                    type="search"
                                    defaultValue={filters.search ?? ''}
                                    placeholder="Search…"
                                    aria-label="Search memos"
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') {
                                            applyFilters({
                                                search: event.currentTarget
                                                    .value,
                                                memo: '',
                                            });
                                        }
                                    }}
                                    className={
                                        fieldClass + ' w-full !pl-9'
                                    }
                                />
                            </div>
                            <select
                                value={filters.client ?? ''}
                                aria-label="Filter by client"
                                onChange={(event) =>
                                    applyFilters({
                                        client: event.target.value,
                                        memo: '',
                                    })
                                }
                                className={fieldClass + ' min-w-[9rem]'}
                            >
                                <option value="">All clients</option>
                                {clientNames.map((name) => (
                                    <option key={name} value={name}>
                                        {name}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={filters.tag_id ?? ''}
                                aria-label="Filter by tag"
                                onChange={(event) =>
                                    applyFilters({
                                        tag_id: event.target.value,
                                        memo: '',
                                    })
                                }
                                className={fieldClass + ' min-w-[8rem]'}
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

                    <div className="hidden grid-cols-[minmax(0,7rem)_minmax(0,1fr)_4.5rem_minmax(0,6rem)] gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:border-slate-700 dark:bg-slate-800/50 sm:grid sm:px-5">
                        <span>Client</span>
                        <span>Memo / description</span>
                        <span>Date</span>
                        <span>Tags</span>
                    </div>

                    <ul className="min-h-0 flex-1 overflow-y-auto">
                        {rows.length === 0 ? (
                            <li className="px-5 py-16 text-center text-sm text-slate-500 dark:text-slate-400">
                                No drafting memos yet.
                            </li>
                        ) : (
                            rows.map((memo) => {
                                const active = activeMemo?.id === memo.id;
                                const memoTags = memo.tags ?? [];

                                return (
                                    <li key={memo.id}>
                                        <button
                                            type="button"
                                            onClick={() => selectMemo(memo)}
                                            className={
                                                'grid w-full grid-cols-1 gap-1 border-b border-slate-100 px-4 py-3 text-left transition sm:grid-cols-[minmax(0,7rem)_minmax(0,1fr)_4.5rem_minmax(0,6rem)] sm:items-start sm:gap-2 sm:px-5 dark:border-slate-800 ' +
                                                (active
                                                    ? 'bg-sky-50 dark:bg-sky-500/10'
                                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50')
                                            }
                                        >
                                            <span
                                                className={
                                                    'truncate text-xs font-semibold uppercase tracking-wide ' +
                                                    (active
                                                        ? 'text-sky-800 dark:text-sky-300'
                                                        : 'text-slate-800 dark:text-slate-100')
                                                }
                                            >
                                                {memo.client_name}
                                            </span>
                                            <span className="line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                                                {memo.description_excerpt}
                                            </span>
                                            <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
                                                {memo.memo_date}
                                            </span>
                                            <span className="flex flex-wrap gap-1">
                                                {memoTags.length === 0 ? (
                                                    <span className="text-xs text-slate-400">
                                                        —
                                                    </span>
                                                ) : (
                                                    memoTags
                                                        .slice(0, 3)
                                                        .map((tag) => (
                                                            <span
                                                                key={tag.id}
                                                                className={
                                                                    tagPillClass
                                                                }
                                                            >
                                                                {tag.name}
                                                            </span>
                                                        ))
                                                )}
                                                {memoTags.length > 3 ? (
                                                    <span className="text-[10px] font-semibold text-slate-400">
                                                        +{memoTags.length - 3}
                                                    </span>
                                                ) : null}
                                            </span>
                                        </button>
                                    </li>
                                );
                            })
                        )}
                    </ul>

                    <Pagination pagination={memos} />
                </section>

                {/* Preview */}
                <section className="flex min-h-[28rem] min-w-0 flex-col lg:col-span-7 lg:min-h-0">
                    <MemoPreview
                        memo={activeMemo}
                        canManageMemos={canManageMemos}
                        onEdit={openEdit}
                        onDelete={setDeleteTarget}
                    />
                </section>
            </div>

            <DraftingMemoFormModal
                show={formOpen}
                memo={formMemo}
                clients={clients}
                tags={tags}
                filters={{
                    ...filters,
                    memo: activeMemo?.id ?? filters.memo,
                }}
                canManageTags={canManageTags}
                defaultClientName={filters.client ?? ''}
                onClose={() => {
                    setFormOpen(false);
                    setFormMemo(null);
                }}
            />

            <Modal
                show={deleteTarget != null}
                onClose={() => setDeleteTarget(null)}
                maxWidth="sm"
            >
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Delete memo?
                    </h2>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        This will permanently remove the memo for{' '}
                        <span className="font-semibold text-slate-900 dark:text-white">
                            {deleteTarget?.client_name}
                        </span>
                        .
                    </p>
                    <div className="mt-6 flex justify-end gap-2">
                        <SecondaryButton
                            type="button"
                            onClick={() => setDeleteTarget(null)}
                        >
                            Cancel
                        </SecondaryButton>
                        <DangerButton type="button" onClick={confirmDelete}>
                            Delete
                        </DangerButton>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
