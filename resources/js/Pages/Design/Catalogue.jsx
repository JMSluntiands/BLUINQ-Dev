import CatalogueFormModal from '@/Components/Design/CatalogueFormModal';
import DangerButton from '@/Components/DangerButton';
import FlashNoticeModal from '@/Components/FlashNoticeModal';
import Modal from '@/Components/Modal';
import Pagination from '@/Components/Pagination';
import SecondaryButton from '@/Components/SecondaryButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    ArrowTopRightOnSquareIcon,
    DocumentTextIcon,
    MagnifyingGlassIcon,
    PencilSquareIcon,
    PlusIcon,
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
    'design-catalogue-created': 'Catalogue item added.',
    'design-catalogue-updated': 'Catalogue item updated.',
    'design-catalogue-deleted': 'Catalogue item deleted.',
    'design-catalogue-tag-created': 'Tag added.',
};

const listGridClass =
    'grid w-full grid-cols-1 gap-1 sm:grid-cols-[minmax(0,6rem)_minmax(0,1fr)_minmax(0,6rem)_4.25rem_4rem_3.5rem_1.75rem] sm:items-start sm:gap-2';

function TagList({ tags = [], empty = '—' }) {
    if (tags.length === 0) {
        return <span className="text-xs text-slate-400">{empty}</span>;
    }

    return (
        <span className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag) => (
                <span key={tag.id} className={tagPillClass}>
                    {tag.name}
                </span>
            ))}
            {tags.length > 3 ? (
                <span className="text-[10px] font-semibold text-slate-400">
                    +{tags.length - 3}
                </span>
            ) : null}
        </span>
    );
}

function ItemPreview({ item, canManageItems, onEdit, onDelete }) {
    if (!item) {
        return (
            <div className="flex h-full min-h-[28rem] flex-col items-center justify-center px-6 text-center">
                <DocumentTextIcon
                    className="h-10 w-10 text-slate-300 dark:text-slate-600"
                    aria-hidden
                />
                <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                    Select a catalogue item
                </p>
                <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                    Choose a model from the list to preview its PDF and details.
                </p>
            </div>
        );
    }

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="shrink-0 border-b border-slate-200 px-5 py-4 dark:border-slate-700">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                            Preview
                        </p>
                        <h3 className="mt-1 truncate text-lg font-semibold text-slate-900 dark:text-white">
                            {item.model_name}
                        </h3>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
                            <span>{item.catalogue_date}</span>
                            <span className="text-slate-300 dark:text-slate-600">
                                ·
                            </span>
                            <span>{item.rcode_label}</span>
                            {item.area ? (
                                <>
                                    <span className="text-slate-300 dark:text-slate-600">
                                        ·
                                    </span>
                                    <span>{item.area}</span>
                                </>
                            ) : null}
                            {item.link_url ? (
                                <>
                                    <span className="text-slate-300 dark:text-slate-600">
                                        ·
                                    </span>
                                    <a
                                        href={item.link_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 font-medium text-sky-600 hover:underline dark:text-sky-400"
                                    >
                                        Link
                                        <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                                    </a>
                                </>
                            ) : null}
                        </div>
                    </div>
                    {canManageItems ? (
                        <div className="flex shrink-0 items-center gap-1">
                            <button
                                type="button"
                                onClick={() => onEdit(item)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-sky-600 dark:hover:bg-slate-800 dark:hover:text-sky-400"
                                title="Edit"
                                aria-label="Edit catalogue item"
                            >
                                <PencilSquareIcon className="h-5 w-5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => onDelete(item)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                                title="Delete"
                                aria-label="Delete catalogue item"
                            >
                                <TrashIcon className="h-5 w-5" />
                            </button>
                        </div>
                    ) : null}
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                            Frontage
                        </p>
                        <div className="mt-1.5">
                            <TagList tags={item.frontage_tags} />
                        </div>
                    </div>
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                            Zoning
                        </p>
                        <div className="mt-1.5">
                            <TagList tags={item.zoning_tags} />
                        </div>
                    </div>
                </div>

                <div className="mt-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <UserCircleIcon
                        className="h-5 w-5 shrink-0 text-slate-400"
                        aria-hidden
                    />
                    <span>
                        Designer:{' '}
                        <span className="font-semibold text-slate-800 dark:text-white">
                            {item.designer && item.designer !== '—'
                                ? item.designer
                                : 'Unknown'}
                        </span>
                    </span>
                </div>
            </div>

            <div className="min-h-0 flex-1 bg-slate-100 p-3 dark:bg-slate-950/40">
                {item.pdf_url ? (
                    <iframe
                        title={`${item.model_name} PDF preview`}
                        src={item.pdf_url}
                        className="h-full min-h-[28rem] w-full rounded-lg border border-slate-200 bg-white dark:border-slate-700"
                    />
                ) : (
                    <div className="flex h-full min-h-[28rem] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                        No PDF attached.
                    </div>
                )}
            </div>
        </div>
    );
}

export default function Catalogue({
    items,
    selectedItem = null,
    filters = {},
    clients = [],
    tags = [],
    rcodes = [],
    canManageItems = false,
    canManageTags = false,
}) {
    const rows = items?.data ?? [];
    const [formItem, setFormItem] = useState(null);
    const [formOpen, setFormOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [activeItem, setActiveItem] = useState(selectedItem);

    useEffect(() => {
        setActiveItem(selectedItem);
    }, [selectedItem]);

    const clientNames = useMemo(
        () =>
            clients.map((client) =>
                typeof client === 'string' ? client : client.name,
            ),
        [clients],
    );

    const frontageTags = useMemo(
        () => tags.filter((tag) => tag.type === 'frontage'),
        [tags],
    );
    const zoningTags = useMemo(
        () => tags.filter((tag) => tag.type === 'zoning'),
        [tags],
    );

    const applyFilters = useCallback(
        (next) => {
            router.get(
                route('design.catalogue'),
                {
                    search: next.search ?? filters.search ?? '',
                    per_page: next.per_page ?? filters.per_page ?? 20,
                    client: next.client ?? filters.client ?? '',
                    tag_id: next.tag_id ?? filters.tag_id ?? '',
                    sort: next.sort ?? filters.sort ?? 'date_desc',
                    item: next.item ?? filters.item ?? '',
                },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        },
        [filters],
    );

    const selectItem = (item) => {
        setActiveItem(item);
        applyFilters({ item: item.id });
    };

    const openCreate = () => {
        setFormItem(null);
        setFormOpen(true);
    };

    const openEdit = useCallback((item) => {
        setFormItem(item);
        setFormOpen(true);
    }, []);

    const qParams = useMemo(() => {
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
        const itemId = activeItem?.id ?? filters.item;
        if (itemId) {
            params.set('item', String(itemId));
        }
        const query = params.toString();

        return query ? `?${query}` : '';
    }, [filters, activeItem?.id]);

    const confirmDelete = useCallback(() => {
        if (!deleteTarget) {
            return;
        }

        router.delete(
            route('design.catalogue.destroy', deleteTarget.id) + qParams,
            { preserveScroll: true },
        );
        setDeleteTarget(null);
    }, [deleteTarget, qParams]);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-slate-800 dark:text-slate-100">
                            Design Catalogue
                        </h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Model library with frontage, zoning, and PDF plans.
                        </p>
                    </div>
                    {canManageItems ? (
                        <button
                            type="button"
                            onClick={openCreate}
                            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-sky-600 px-4 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600"
                        >
                            <PlusIcon className="h-4 w-4 shrink-0" aria-hidden />
                            Add model
                        </button>
                    ) : null}
                </div>
            }
        >
            <Head title="Design Catalogue" />
            <FlashNoticeModal messages={FLASH_MESSAGES} />

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 lg:grid lg:min-h-[70vh] lg:grid-cols-12">
                <section className="flex min-h-0 flex-col border-b border-slate-200 dark:border-slate-700 lg:col-span-6 lg:border-b-0 lg:border-r">
                    <div className="shrink-0 space-y-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700 sm:px-5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-800 dark:text-white">
                                Catalogue
                            </h3>
                            <select
                                value={filters.sort ?? 'date_desc'}
                                aria-label="Date sort"
                                onChange={(event) =>
                                    applyFilters({
                                        sort: event.target.value,
                                        item: '',
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
                                    aria-label="Search catalogue"
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') {
                                            applyFilters({
                                                search: event.currentTarget
                                                    .value,
                                                item: '',
                                            });
                                        }
                                    }}
                                    className={fieldClass + ' w-full !pl-9'}
                                />
                            </div>
                            <select
                                value={filters.client ?? ''}
                                aria-label="Filter by client"
                                onChange={(event) =>
                                    applyFilters({
                                        client: event.target.value,
                                        item: '',
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
                                        item: '',
                                    })
                                }
                                className={fieldClass + ' min-w-[8rem]'}
                            >
                                <option value="">All tags</option>
                                {frontageTags.length > 0 ? (
                                    <optgroup label="Frontage">
                                        {frontageTags.map((tag) => (
                                            <option key={tag.id} value={tag.id}>
                                                {tag.name}
                                            </option>
                                        ))}
                                    </optgroup>
                                ) : null}
                                {zoningTags.length > 0 ? (
                                    <optgroup label="Zoning">
                                        {zoningTags.map((tag) => (
                                            <option key={tag.id} value={tag.id}>
                                                {tag.name}
                                            </option>
                                        ))}
                                    </optgroup>
                                ) : null}
                            </select>
                        </div>
                    </div>

                    <div
                        className={
                            listGridClass +
                            ' hidden border-b border-slate-200 bg-slate-50 px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:border-slate-700 dark:bg-slate-800/50 sm:grid sm:px-5'
                        }
                    >
                        <span>Frontage</span>
                        <span>Model name</span>
                        <span>Zoning</span>
                        <span>R-Codes</span>
                        <span>Area</span>
                        <span>Date</span>
                        <span>Link</span>
                    </div>

                    <ul className="min-h-0 flex-1 overflow-y-auto">
                        {rows.length === 0 ? (
                            <li className="px-5 py-16 text-center text-sm text-slate-500 dark:text-slate-400">
                                No catalogue items yet.
                            </li>
                        ) : (
                            rows.map((item) => {
                                const active = activeItem?.id === item.id;

                                return (
                                    <li key={item.id}>
                                        <button
                                            type="button"
                                            onClick={() => selectItem(item)}
                                            className={
                                                listGridClass +
                                                ' border-b border-slate-100 px-4 py-3 text-left transition sm:px-5 dark:border-slate-800 ' +
                                                (active
                                                    ? 'bg-sky-50 dark:bg-sky-500/10'
                                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50')
                                            }
                                        >
                                            <TagList
                                                tags={item.frontage_tags}
                                            />
                                            <span
                                                className={
                                                    'truncate text-sm font-semibold ' +
                                                    (active
                                                        ? 'text-sky-800 dark:text-sky-300'
                                                        : 'text-slate-800 dark:text-slate-100')
                                                }
                                            >
                                                {item.model_name}
                                            </span>
                                            <TagList tags={item.zoning_tags} />
                                            <span className="text-xs text-slate-600 dark:text-slate-300">
                                                {item.rcode_label}
                                            </span>
                                            <span className="truncate text-xs text-slate-500 dark:text-slate-400">
                                                {item.area || '—'}
                                            </span>
                                            <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
                                                {item.catalogue_date}
                                            </span>
                                            <span className="text-slate-400">
                                                {item.link_url ? (
                                                    <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                                                ) : (
                                                    <span className="text-xs">
                                                        —
                                                    </span>
                                                )}
                                            </span>
                                        </button>
                                    </li>
                                );
                            })
                        )}
                    </ul>

                    <Pagination pagination={items} />
                </section>

                <section className="flex min-h-[28rem] min-w-0 flex-col lg:col-span-6 lg:min-h-0">
                    <ItemPreview
                        item={activeItem}
                        canManageItems={canManageItems}
                        onEdit={openEdit}
                        onDelete={setDeleteTarget}
                    />
                </section>
            </div>

            <CatalogueFormModal
                show={formOpen}
                item={formItem}
                clients={clients}
                frontageTags={frontageTags}
                zoningTags={zoningTags}
                rcodes={rcodes}
                filters={{
                    ...filters,
                    item: activeItem?.id ?? filters.item,
                }}
                canManageTags={canManageTags}
                onClose={() => {
                    setFormOpen(false);
                    setFormItem(null);
                }}
            />

            <Modal
                show={deleteTarget != null}
                onClose={() => setDeleteTarget(null)}
                maxWidth="sm"
            >
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Delete catalogue item?
                    </h2>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        This will permanently remove{' '}
                        <span className="font-semibold text-slate-900 dark:text-white">
                            {deleteTarget?.model_name}
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
