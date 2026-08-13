import { staffBadgeStyle } from '@/Components/JobBoard/jobBoardStyles';
import InputError from '@/Components/InputError';
import TextInput from '@/Components/TextInput';
import { PencilSquareIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const cardClass =
    'overflow-hidden rounded-xl border border-[#e6e9ef] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)] dark:border-[#2f3347] dark:bg-[#1a1b2e]';

const cardHeader =
    'flex items-center justify-between border-b border-[#e6e9ef] bg-[#fafbfc] px-4 py-3 sm:px-5 dark:border-[#2f3347] dark:bg-[#151622]';

const cardTitle = 'text-sm font-semibold text-[#323338] dark:text-white';

const thClass =
    'whitespace-nowrap border border-[#e6e9ef] bg-[#fafbfc] px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-[#676879] dark:border-[#2f3347] dark:bg-[#151622] dark:text-slate-400';

const tdClass =
    'whitespace-nowrap border border-[#e6e9ef] px-3 py-2.5 align-middle text-xs text-[#323338] dark:border-[#2f3347] dark:text-slate-200';

const sectionLabelClass =
    'mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#676879] dark:text-slate-500';

export function JobPanel({
    title,
    subtitle,
    children,
    canEdit = false,
    onEdit,
    canAdd = false,
    onAdd,
    addLabel = 'Add',
    headerActions = null,
    className = '',
}) {
    return (
        <section className={`${cardClass} ${className}`}>
            <div className={cardHeader}>
                <div className="min-w-0">
                    <h2 className={cardTitle}>{title}</h2>
                    {subtitle ? (
                        <p className="mt-0.5 text-xs text-[#676879] dark:text-slate-400">
                            {subtitle}
                        </p>
                    ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {headerActions}
                    {canEdit && onEdit ? (
                        <button
                            type="button"
                            onClick={onEdit}
                            className="inline-flex items-center gap-1 rounded-md border border-[#c5c7d0] bg-white px-2.5 py-1 text-xs font-semibold text-[#0073ea] shadow-sm transition hover:bg-[#e6f4ff] dark:border-[#3b82f6]/50 dark:bg-[#1a1b2e] dark:text-[#60a5fa] dark:hover:bg-[#243044]"
                        >
                            <PencilSquareIcon
                                className="h-3.5 w-3.5"
                                aria-hidden
                            />
                            Edit
                        </button>
                    ) : canAdd && onAdd ? (
                        <button
                            type="button"
                            onClick={onAdd}
                            className="inline-flex items-center gap-1 rounded-md border border-[#c5c7d0] bg-white px-2.5 py-1 text-xs font-semibold text-[#0073ea] shadow-sm transition hover:bg-[#e6f4ff] dark:border-[#3b82f6]/50 dark:bg-[#1a1b2e] dark:text-[#60a5fa] dark:hover:bg-[#243044]"
                        >
                            <PlusIcon className="h-3.5 w-3.5" aria-hidden />
                            {addLabel}
                        </button>
                    ) : null}
                </div>
            </div>
            <div>{children}</div>
        </section>
    );
}

function JobDetailField({ label, children, value, hint = null }) {
    const display =
        children ??
        (value === null || value === undefined || value === '' ? '—' : value);

    return (
        <div className="flex flex-col gap-1 border-b border-[#e6e9ef] px-4 py-3 last:border-b-0 dark:border-[#2f3347] md:flex-row md:items-start md:gap-0">
            <dt className="w-full shrink-0 text-[11px] font-semibold uppercase tracking-wide text-[#676879] dark:text-slate-400 md:w-4/12 md:pr-4">
                {label}
            </dt>
            <dd className="w-full min-w-0 md:w-8/12">
                <div className="whitespace-pre-wrap text-sm font-medium text-[#323338] dark:text-slate-100">
                    {display}
                </div>
                {hint ? (
                    <p className="mt-1 text-[11px] text-[#676879] dark:text-slate-500">
                        {hint}
                    </p>
                ) : null}
            </dd>
        </div>
    );
}

function ExternalLink({ href, label }) {
    const text = label ?? '—';

    if (!href) {
        return (
            <span className="font-semibold text-[#323338] dark:text-slate-200">
                {text}
            </span>
        );
    }

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex max-w-full items-center gap-1 font-semibold text-[#0073ea] underline decoration-[#0073ea]/30 underline-offset-2 transition hover:text-[#0060c4] dark:text-[#60a5fa] dark:hover:text-[#93c5fd]"
        >
            <span className="truncate">{text}</span>
        </a>
    );
}

function revisionSharepointHref(sharepointBase, code) {
    const base = String(sharepointBase ?? '').trim();
    const revisionCode = String(code ?? '').trim();

    if (base === '' || revisionCode === '') {
        return null;
    }

    return `${base}${revisionCode}`;
}

function revisionLinkHref(row, sharepointBase) {
    const custom = String(row?.link ?? '').trim();
    if (custom !== '') {
        return custom;
    }

    return revisionSharepointHref(sharepointBase, row?.code);
}

function formatRate(rate) {
    if (rate === null || rate === undefined || rate === '') {
        return '—';
    }

    const trimmed = String(rate).trim();
    if (trimmed.startsWith('$')) {
        return trimmed;
    }

    return `$${trimmed}`;
}

function DrafterBadge({ initials, name }) {
    if (!initials && !name) {
        return <span className="text-[#676879] dark:text-slate-400">—</span>;
    }

    const text = String(initials || name || '')
        .trim()
        .toUpperCase();

    if (text.length > 3) {
        return (
            <span
                className="inline-flex max-w-[5rem] items-center truncate rounded-md px-2 py-0.5 text-[10px] font-bold"
                style={staffBadgeStyle(text)}
                title={name ?? text}
            >
                {text}
            </span>
        );
    }

    return (
        <span
            className="inline-flex h-7 w-7 items-center justify-center rounded text-[10px] font-bold"
            style={staffBadgeStyle(text)}
            title={name ?? text}
        >
            {text}
        </span>
    );
}

function formatHours(hours) {
    if (hours === null || hours === undefined || hours === '') {
        return '—';
    }

    return `${hours} hrs`;
}

function RevisionAreaSizeCell({
    row,
    draftingRequestId,
    canEdit = false,
}) {
    const [editing, setEditing] = useState(false);
    const form = useForm({
        code: row.code ?? '',
        log_date: row.log_date_value ?? '',
        category: row.category ?? '',
        status: row.status ?? 'new',
        area_size: row.area_size ?? '',
        drafter_user_id: row.drafter_user_id ?? '',
        checker_user_id: row.checker_user_id ?? '',
        drafting_hours: row.drafting_hours ?? '',
        checking_hours: row.checking_hours ?? '',
        submitted_date: row.submitted_date_value ?? '',
    });

    useEffect(() => {
        if (editing) {
            return;
        }

        form.setData({
            code: row.code ?? '',
            log_date: row.log_date_value ?? '',
            category: row.category ?? '',
            status: row.status ?? 'new',
            area_size: row.area_size ?? '',
            drafter_user_id: row.drafter_user_id ?? '',
            checker_user_id: row.checker_user_id ?? '',
            drafting_hours: row.drafting_hours ?? '',
            checking_hours: row.checking_hours ?? '',
            submitted_date: row.submitted_date_value ?? '',
        });
        form.clearErrors();
    }, [row.id, row.area_size, row.code, row.log_date_value, row.category, row.status, editing]);

    if (!canEdit) {
        return row.area_size ?? '—';
    }

    if (!editing) {
        return (
            <div className="flex items-center gap-2">
                <span className="tabular-nums">{row.area_size ?? '—'}</span>
                <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="text-[11px] font-semibold text-[#0073ea] underline underline-offset-2 hover:text-[#0060c4] dark:text-[#60a5fa]"
                >
                    Edit
                </button>
            </div>
        );
    }

    const submit = (e) => {
        e.preventDefault();
        form.patch(
            route('job.drafting.revisions.update', [
                draftingRequestId,
                row.id,
            ]),
            {
                preserveScroll: true,
                onSuccess: () => setEditing(false),
            },
        );
    };

    return (
        <form onSubmit={submit} className="flex min-w-[9rem] flex-col gap-1">
            <div className="flex items-center gap-1.5">
                <TextInput
                    type="text"
                    value={form.data.area_size}
                    onChange={(e) => form.setData('area_size', e.target.value)}
                    className="!mt-0 w-20 !px-2 !py-1 text-xs"
                    placeholder="e.g. 32"
                    disabled={form.processing}
                    autoFocus
                />
                <button
                    type="submit"
                    disabled={form.processing}
                    className="rounded bg-[#0073ea] px-2 py-1 text-[10px] font-semibold text-white hover:bg-[#0060c4] disabled:opacity-50"
                >
                    Save
                </button>
                <button
                    type="button"
                    onClick={() => {
                        form.setData('area_size', row.area_size ?? '');
                        form.clearErrors();
                        setEditing(false);
                    }}
                    className="rounded border border-[#c5c7d0] px-2 py-1 text-[10px] font-semibold text-[#676879] hover:bg-[#f6f7fb] dark:border-[#3b82f6]/40 dark:text-slate-400"
                >
                    Cancel
                </button>
            </div>
            <InputError message={form.errors.area_size} className="!mt-0" />
        </form>
    );
}

function BuildingAreaEditor({ value, canEdit, updateUrl, onCancel }) {
    const form = useForm({
        section: 'building_area',
        max_building_area_sqm: value ?? '',
    });

    if (!canEdit) {
        const display = value
            ? `${String(value).replace(/\.?0+$/, '')} SQM`
            : '—';

        return display;
    }

    const submit = (e) => {
        e.preventDefault();
        form.patch(updateUrl, {
            preserveScroll: true,
            onSuccess: () => onCancel?.(),
        });
    };

    return (
        <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
            <div className="min-w-[8rem] flex-1">
                <TextInput
                    id="building-area-sqm"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.data.max_building_area_sqm}
                    onChange={(e) =>
                        form.setData('max_building_area_sqm', e.target.value)
                    }
                    className="text-sm"
                    disabled={form.processing}
                />
                <InputError
                    message={form.errors.max_building_area_sqm}
                    className="mt-1"
                />
            </div>
            <span className="pb-2 text-xs font-semibold uppercase text-[#676879] dark:text-slate-400">
                SQM
            </span>
            <button
                type="submit"
                disabled={form.processing}
                className="rounded bg-[#0073ea] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#0060c4] disabled:opacity-50 dark:bg-[#2563eb] dark:hover:bg-[#1d4ed8]"
            >
                Save
            </button>
            <button
                type="button"
                onClick={onCancel}
                className="rounded border border-[#c5c7d0] px-3 py-1.5 text-xs font-semibold text-[#676879] transition hover:bg-[#f6f7fb] dark:border-[#3b82f6]/40 dark:text-slate-400 dark:hover:bg-[#243044]"
            >
                Cancel
            </button>
        </form>
    );
}

function DrawingStatusPanel({
    items = [],
    canEdit = false,
    updateUrl = '',
}) {
    const form = useForm({
        section: 'drawing_checklist',
        items: items.map((item) => ({
            key: item.key,
            checked: Boolean(item.checked),
        })),
    });

    const resetForm = useForm({
        section: 'drawing_checklist_reset',
    });

    useEffect(() => {
        form.setData(
            'items',
            items.map((item) => ({
                key: item.key,
                checked: Boolean(item.checked),
            })),
        );
    }, [items]);

    const toggleItem = (key) => {
        form.setData(
            'items',
            form.data.items.map((item) =>
                item.key === key
                    ? { ...item, checked: !item.checked }
                    : item,
            ),
        );
    };

    const save = () => {
        form.patch(updateUrl, { preserveScroll: true });
    };

    const reset = () => {
        if (
            !window.confirm(
                'Reset all drawing status checks? This cannot be undone.',
            )
        ) {
            return;
        }

        resetForm.patch(updateUrl, { preserveScroll: true });
    };

    const checkedByKey = Object.fromEntries(
        form.data.items.map((item) => [item.key, item.checked]),
    );

    return (
        <JobPanel
            title="Drawing status"
            subtitle="Visible to all job viewers"
            headerActions={
                canEdit ? (
                    <>
                        <button
                            type="button"
                            onClick={reset}
                            disabled={resetForm.processing || form.processing}
                            className="rounded-md border border-[#c5c7d0] bg-white px-2.5 py-1 text-xs font-semibold text-[#676879] shadow-sm transition hover:bg-[#f6f7fb] disabled:opacity-50 dark:border-[#3b82f6]/40 dark:bg-[#1a1b2e] dark:text-slate-300 dark:hover:bg-[#243044]"
                        >
                            Reset
                        </button>
                        <button
                            type="button"
                            onClick={save}
                            disabled={form.processing || resetForm.processing}
                            className="rounded-md bg-[#0073ea] px-2.5 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0060c4] disabled:opacity-50"
                        >
                            Save
                        </button>
                    </>
                ) : null
            }
        >
            <div className="p-4">
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((item) => {
                        const checked = Boolean(checkedByKey[item.key]);
                        const is3d = item.key === '3d_model';

                        return (
                            <li key={item.key}>
                                <label
                                    className={`flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2.5 transition ${
                                        checked
                                            ? 'border-[#0073ea]/40 bg-[#e6f4ff]/60 dark:border-[#3b82f6]/40 dark:bg-[#243044]/50'
                                            : 'border-[#e6e9ef] bg-[#fafbfc] dark:border-[#2f3347] dark:bg-[#151622]'
                                    } ${!canEdit ? 'cursor-default' : ''}`}
                                >
                                    <input
                                        type="checkbox"
                                        className="mt-0.5 rounded border-[#c5c7d0] text-[#0073ea] focus:ring-[#0073ea]"
                                        checked={checked}
                                        disabled={!canEdit || form.processing}
                                        onChange={() => toggleItem(item.key)}
                                    />
                                    <span className="min-w-0">
                                        <span className="block text-sm font-medium text-[#323338] dark:text-slate-200">
                                            {item.label}
                                        </span>
                                        {is3d ? (
                                            <span className="mt-0.5 block text-[11px] text-[#676879] dark:text-slate-500">
                                                Placeholder — 3D integration TBD
                                            </span>
                                        ) : null}
                                    </span>
                                </label>
                            </li>
                        );
                    })}
                </ul>
                <InputError
                    message={form.errors.items || form.errors.section}
                    className="mt-3"
                />
            </div>
        </JobPanel>
    );
}

function DataTable({ columns, rows, emptyMessage, minWidth = '32rem' }) {
    return (
        <div className="overflow-x-auto rounded-lg border border-[#e6e9ef] dark:border-[#2f3347]">
            <table
                className="w-full border-collapse text-left"
                style={{ minWidth }}
            >
                <thead>
                    <tr>
                        {columns.map((column) => (
                            <th key={column.key} className={thClass}>
                                {column.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.length === 0 ? (
                        <tr>
                            <td
                                colSpan={columns.length}
                                className={
                                    tdClass +
                                    ' bg-white py-8 text-center text-[#676879] dark:bg-[#1a1b2e] dark:text-slate-400'
                                }
                            >
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        rows.map((row, index) => (
                            <tr
                                key={row.id ?? row.key ?? index}
                                className="bg-white transition-colors hover:bg-[#fafbfc]/80 dark:bg-[#1a1b2e] dark:hover:bg-[#243044]/30"
                            >
                                {columns.map((column) => (
                                    <td key={column.key} className={tdClass}>
                                        {column.render(row)}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

/**
 * PROJECT INFO layout for drafting job show page.
 */
export default function DraftingJobShowLayout({
    draftingRequest,
    revisions = [],
    quotes = [],
    invoices = [],
    integrationUrls = {},
    canEdit = false,
    canEditJobDetails = false,
    canEditBuildingArea = false,
    canViewAccounts = false,
    canAddAccount = false,
    onEditQuote,
    onEditInvoice,
    onAddQuote,
    onAddInvoice,
    canViewRevision = true,
    canAddRevision = false,
    canDeleteRevision = false,
    onEditRevision,
    onDeleteRevision,
    onAddRevision,
    updateUrl = '',
    onEditJobDetails,
    commentsPanel,
    filesPanel,
    activityPanel,
    backHref,
    backLabel,
    archiveActions,
    variant = 'default',
}) {
    const [editingArea, setEditingArea] = useState(false);
    const isMasterlist = variant === 'masterlist';

    const contactLine = [
        draftingRequest.your_name,
        draftingRequest.email ? `(${draftingRequest.email})` : null,
        draftingRequest.phone || null,
    ]
        .filter(Boolean)
        .join(' ');

    const units = draftingRequest.units ?? [];
    const unitCount = Number(draftingRequest.unit_development_count ?? 0);

    const revisionColumns = [
        {
            key: 'revision',
            label: 'Revision #',
            render: (row) => (
                <ExternalLink
                    href={revisionLinkHref(row, integrationUrls.sharepoint)}
                    label={row.code}
                />
            ),
        },
        {
            key: 'link',
            label: 'Revision Link',
            render: (row) => {
                const href = revisionLinkHref(row, integrationUrls.sharepoint);
                if (!href) {
                    return (
                        <span className="text-[#676879] dark:text-slate-400">
                            —
                        </span>
                    );
                }

                return (
                    <ExternalLink
                        href={href}
                        label={row.link ? 'Open link' : 'Open SharePoint'}
                    />
                );
            },
        },
        {
            key: 'log_date',
            label: 'Date In',
            render: (row) => row.log_date ?? '—',
        },
        {
            key: 'category',
            label: 'Category',
            render: (row) => (
                <span className="font-medium">{row.category ?? '—'}</span>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (row) => (
                <span className="font-medium">
                    {row.status_label ?? row.status ?? '—'}
                </span>
            ),
        },
        {
            key: 'drafter',
            label: 'Drafter',
            render: (row) => (
                <DrafterBadge
                    initials={row.drafter_initials}
                    name={row.drafter_name}
                />
            ),
        },
        {
            key: 'drafting_hours',
            label: 'Drafting Hours',
            render: (row) => (
                <span className="tabular-nums font-medium">
                    {formatHours(row.drafting_hours)}
                </span>
            ),
        },
        {
            key: 'checker',
            label: 'Checker',
            render: (row) =>
                row.checker_user_id || row.checker_initials ? (
                    <DrafterBadge
                        initials={row.checker_initials}
                        name={row.checker_name}
                    />
                ) : (
                    '—'
                ),
        },
        {
            key: 'checking_hours',
            label: 'Checking Hours',
            render: (row) => (
                <span className="tabular-nums font-medium">
                    {formatHours(row.checking_hours)}
                </span>
            ),
        },
        {
            key: 'area_size',
            label: 'Area Size',
            render: (row) => (
                <RevisionAreaSizeCell
                    row={row}
                    draftingRequestId={draftingRequest.id}
                    canEdit={Boolean(onEditRevision)}
                />
            ),
        },
        {
            key: 'submitted_date',
            label: 'Date Out',
            render: (row) => row.submitted_date ?? '—',
        },
        ...(onEditRevision || (canDeleteRevision && onDeleteRevision)
            ? [
                  {
                      key: 'actions',
                      label: 'Action',
                      render: (row) => (
                          <div className="flex flex-wrap items-center gap-2">
                              {onEditRevision ? (
                                  <button
                                      type="button"
                                      onClick={() => onEditRevision(row)}
                                      className="text-[11px] font-semibold text-[#0073ea] underline underline-offset-2 hover:text-[#0060c4] dark:text-[#60a5fa]"
                                  >
                                      Edit
                                  </button>
                              ) : null}
                              {canDeleteRevision && onDeleteRevision ? (
                                  <button
                                      type="button"
                                      onClick={() => onDeleteRevision(row)}
                                      className="text-[11px] font-semibold text-rose-600 underline underline-offset-2 hover:text-rose-500 dark:text-rose-400"
                                  >
                                      Delete
                                  </button>
                              ) : null}
                          </div>
                      ),
                  },
              ]
            : []),
    ];

    const accountColumns = (linkBase, numberKey, onEdit) => {
        const columns = [
            {
                key: 'number',
                label: numberKey,
                render: (row) => (
                    <ExternalLink
                        href={linkBase ? `${linkBase}${row.number}` : null}
                        label={row.number}
                    />
                ),
            },
            {
                key: 'category',
                label: 'Category',
                render: (row) => (
                    <span className="font-semibold uppercase">
                        {row.category ?? '—'}
                    </span>
                ),
            },
            {
                key: 'rate',
                label: 'Rate',
                render: (row) => (
                    <span className="tabular-nums">{formatRate(row.rate)}</span>
                ),
            },
            {
                key: 'status',
                label: 'Status',
                render: (row) => (
                    <span className="font-semibold uppercase">
                        {row.status ?? '—'}
                    </span>
                ),
            },
        ];

        if (canAddAccount && onEdit) {
            columns.push({
                key: 'actions',
                label: 'Action',
                render: (row) => (
                    <button
                        type="button"
                        onClick={() => onEdit(row)}
                        className="text-[11px] font-semibold text-[#0073ea] underline underline-offset-2 hover:text-[#0060c4] dark:text-[#60a5fa]"
                    >
                        Edit
                    </button>
                ),
            });
        }

        return columns;
    };

    const pageHeader = (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
                {backHref ? (
                    <Link
                        href={backHref}
                        preserveState={false}
                        preserveScroll={false}
                        className="mb-2 inline-block text-sm font-medium text-[#0073ea] hover:underline dark:text-[#60a5fa]"
                    >
                        {backLabel ?? '← Back to board'}
                    </Link>
                ) : null}
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#676879] dark:text-slate-500">
                    Project info
                </p>
                <h1 className="mt-1 text-xl font-semibold leading-snug text-[#323338] dark:text-white sm:text-2xl">
                    {draftingRequest.site_address || 'Project info'}
                </h1>
                <p className="mt-1 text-sm text-[#676879] dark:text-slate-400">
                    {isMasterlist ? 'Lead number' : 'Revision number'}:{' '}
                    <span className="font-medium text-[#323338] dark:text-slate-200">
                        {isMasterlist
                            ? draftingRequest.reference || '—'
                            : draftingRequest.latest_revision ||
                              revisions[0]?.code ||
                              '—'}
                    </span>
                    {draftingRequest.is_archived ? ' · Archived' : ''}
                </p>
            </div>
        </div>
    );

    const archivedBanner = draftingRequest.is_archived ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/50 dark:bg-amber-950/30 dark:text-amber-200">
            This job is archived
            {draftingRequest.archived_at
                ? ` on ${draftingRequest.archived_at}`
                : ''}
            .
        </p>
    ) : null;

    const clientDetailsPanel = (
        <JobPanel
            title={isMasterlist ? 'Client details' : 'Project info'}
            subtitle={
                isMasterlist
                    ? 'Contact and site details'
                    : 'Synced with Project Management'
            }
            canEdit={canEdit || canEditJobDetails}
            onEdit={onEditJobDetails}
        >
            <dl>
                <JobDetailField
                    label={isMasterlist ? 'Lead number' : 'Revision number'}
                >
                    {isMasterlist ? (
                        draftingRequest.reference || '—'
                    ) : (draftingRequest.latest_revision ||
                          revisions[0]?.code) ? (
                        <ExternalLink
                            href={revisionLinkHref(
                                revisions[0] ?? {
                                    code:
                                        draftingRequest.latest_revision ||
                                        draftingRequest.reference,
                                    link: null,
                                },
                                integrationUrls.sharepoint,
                            )}
                            label={
                                draftingRequest.latest_revision ||
                                revisions[0]?.code ||
                                '—'
                            }
                        />
                    ) : (
                        '—'
                    )}
                </JobDetailField>
                <JobDetailField
                    label="Client name"
                    value={draftingRequest.company_name}
                    hint="Connected to Project Management"
                />
                <JobDetailField
                    label="Contact"
                    value={contactLine || null}
                />
                <JobDetailField
                    label="Site address"
                    value={draftingRequest.site_address}
                />
                <JobDetailField
                    label="Council / Shire"
                    value={draftingRequest.council_shire}
                />
                <JobDetailField
                    label="Home owner name"
                    value={draftingRequest.site_owner_name}
                />
                <JobDetailField
                    label="Building class"
                    value={draftingRequest.building_class}
                />
                <JobDetailField
                    label="Storey / Levels"
                    value={draftingRequest.storey_level}
                />
                <JobDetailField
                    label="Zoning"
                    value={draftingRequest.zoning}
                />
                <JobDetailField label="Building area">
                    {editingArea ? (
                        <BuildingAreaEditor
                            value={draftingRequest.max_building_area_sqm}
                            canEdit
                            updateUrl={updateUrl}
                            onCancel={() => setEditingArea(false)}
                        />
                    ) : (
                        <div className="flex items-center gap-2">
                            <span>
                                {draftingRequest.building_area_label ?? '—'}
                            </span>
                            {canEditBuildingArea ? (
                                <button
                                    type="button"
                                    onClick={() => setEditingArea(true)}
                                    className="text-[11px] font-semibold text-[#0073ea] underline underline-offset-2 hover:text-[#0060c4] dark:text-[#60a5fa]"
                                >
                                    Edit
                                </button>
                            ) : null}
                        </div>
                    )}
                </JobDetailField>
                <JobDetailField
                    label="Category"
                    value={
                        draftingRequest.crm_category ??
                        draftingRequest.services_label
                    }
                    hint="From Workflow settings → Category"
                />
                <JobDetailField
                    label="NDIS / SDA"
                    value={
                        draftingRequest.sda_types?.length
                            ? draftingRequest.sda_types.join(', ')
                            : draftingRequest.ndis_sda
                              ? 'YES'
                              : 'NO'
                    }
                />
                <JobDetailField
                    label="Construction"
                    value={
                        draftingRequest.construction ??
                        draftingRequest.external_wall_construction
                    }
                />
                <JobDetailField
                    label="Roof"
                    value={draftingRequest.roof_type}
                />
                <JobDetailField
                    label="Ceiling heights"
                    value={draftingRequest.ceiling_heights}
                />
                <JobDetailField
                    label="First floor slab"
                    value={draftingRequest.first_floor_slab}
                />
                <JobDetailField label="Unit development">
                    {unitCount > 0 ? (
                        <div className="space-y-2">
                            <p className="text-sm font-medium">
                                {unitCount} unit
                                {unitCount === 1 ? '' : 's'}
                            </p>
                            <div className="overflow-x-auto rounded-lg border border-[#e6e9ef] dark:border-[#2f3347]">
                                <table className="w-full min-w-[20rem] border-collapse text-left">
                                    <thead>
                                        <tr>
                                            <th className={thClass}>Unit</th>
                                            <th className={thClass}>
                                                House type
                                            </th>
                                            <th className={thClass}>Area</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Array.from(
                                            { length: unitCount },
                                            (_, i) => {
                                                const n = i + 1;
                                                const unit =
                                                    units.find(
                                                        (u) =>
                                                            Number(
                                                                u.unit_number,
                                                            ) === n,
                                                    ) ?? {};

                                                return (
                                                    <tr key={n}>
                                                        <td className={tdClass}>
                                                            Unit {n}
                                                        </td>
                                                        <td className={tdClass}>
                                                            {unit.house_type ||
                                                                '—'}
                                                        </td>
                                                        <td className={tdClass}>
                                                            {unit.area_sqm
                                                                ? `${unit.area_sqm} SQM`
                                                                : '—'}
                                                        </td>
                                                    </tr>
                                                );
                                            },
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        '0'
                    )}
                </JobDetailField>
                {(draftingRequest.design_requirements ||
                    draftingRequest.additional_inclusions) && (
                    <JobDetailField
                        label="Notes / requirements"
                        value={[
                            draftingRequest.design_requirements,
                            draftingRequest.additional_inclusions,
                        ]
                            .filter(Boolean)
                            .join('\n\n')}
                    />
                )}
            </dl>
        </JobPanel>
    );

    const revisionsPanel = canViewRevision ? (
        <JobPanel
            title="Revisions"
            subtitle="Synced from Archi Project Management"
            canAdd={canAddRevision}
            onAdd={onAddRevision}
            addLabel="Add from masterlist"
        >
            <div className="p-4">
                <DataTable
                    columns={revisionColumns}
                    rows={revisions}
                    emptyMessage="No revisions recorded yet."
                    minWidth="52rem"
                />
            </div>
        </JobPanel>
    ) : null;

    const accountsPanel = canViewAccounts ? (
        <JobPanel title="Quotes & invoices" subtitle="Admin only">
            <div className="space-y-4 p-4">
                <div>
                    <div className="mb-2 flex items-center justify-between gap-2">
                        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[#676879] dark:text-slate-400">
                            Quote #
                        </h3>
                        {canAddAccount && onAddQuote ? (
                            <button
                                type="button"
                                onClick={onAddQuote}
                                className="inline-flex items-center gap-1 rounded-md border border-[#c5c7d0] bg-white px-2 py-0.5 text-[10px] font-semibold text-[#0073ea] shadow-sm transition hover:bg-[#e6f4ff] dark:border-[#3b82f6]/50 dark:bg-[#1a1b2e] dark:text-[#60a5fa] dark:hover:bg-[#243044]"
                            >
                                <PlusIcon className="h-3 w-3" aria-hidden />
                                Add quote
                            </button>
                        ) : null}
                    </div>
                    <DataTable
                        columns={accountColumns(
                            integrationUrls.xero_quote,
                            'Quote #',
                            onEditQuote,
                        )}
                        rows={quotes}
                        emptyMessage="No quotes linked yet."
                    />
                </div>
                <div>
                    <div className="mb-2 flex items-center justify-between gap-2">
                        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[#676879] dark:text-slate-400">
                            Invoice #
                        </h3>
                        {canAddAccount && onAddInvoice ? (
                            <button
                                type="button"
                                onClick={onAddInvoice}
                                className="inline-flex items-center gap-1 rounded-md border border-[#c5c7d0] bg-white px-2 py-0.5 text-[10px] font-semibold text-[#0073ea] shadow-sm transition hover:bg-[#e6f4ff] dark:border-[#3b82f6]/50 dark:bg-[#1a1b2e] dark:text-[#60a5fa] dark:hover:bg-[#243044]"
                            >
                                <PlusIcon className="h-3 w-3" aria-hidden />
                                Add invoice
                            </button>
                        ) : null}
                    </div>
                    <DataTable
                        columns={accountColumns(
                            integrationUrls.xero_invoice,
                            'Invoice #',
                            onEditInvoice,
                        )}
                        rows={invoices}
                        emptyMessage="No invoices linked yet."
                    />
                </div>
            </div>
        </JobPanel>
    ) : null;

    const drawingPanel = (
        <DrawingStatusPanel
            items={draftingRequest.drawing_checklist ?? []}
            canEdit={canEdit || canEditJobDetails}
            updateUrl={updateUrl}
        />
    );

    const commentsBlock = commentsPanel ? (
        <JobPanel
            title="Comments"
            className="flex min-h-[18rem] flex-col"
        >
            <div className="flex min-h-[16rem] flex-1 flex-col">
                {commentsPanel}
            </div>
        </JobPanel>
    ) : null;

    if (isMasterlist) {
        return (
            <div className="space-y-4">
                {pageHeader}
                {archivedBanner}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    <aside className="space-y-4 lg:col-span-4">
                        {clientDetailsPanel}
                        {activityPanel ? (
                            <section aria-label="Activity logs">
                                {activityPanel}
                            </section>
                        ) : null}
                    {filesPanel ? (
                        <section aria-label="Documents">{filesPanel}</section>
                    ) : null}
                    {archiveActions ? (
                        <div className="flex flex-wrap gap-2">
                            {archiveActions}
                        </div>
                    ) : null}
                    </aside>
                    <div className="space-y-4 lg:col-span-8">
                        {(canViewRevision || canViewAccounts) && (
                            <section aria-label="Project and accounts">
                                <p className={sectionLabelClass}>
                                    Project & accounts
                                </p>
                                <div className="space-y-4">
                                    {revisionsPanel}
                                    {accountsPanel}
                                </div>
                            </section>
                        )}
                        <section aria-label="Drawing status">
                            <p className={sectionLabelClass}>Drawing status</p>
                            {drawingPanel}
                        </section>
                        {commentsBlock ? (
                            <section aria-label="Comments">
                                <p className={sectionLabelClass}>Comments</p>
                                {commentsBlock}
                            </section>
                        ) : null}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {pageHeader}
            {archivedBanner}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <aside className="space-y-4 lg:col-span-4">
                    <section aria-label="Project info">
                        <p className={sectionLabelClass}>1. Project info</p>
                        {clientDetailsPanel}
                    </section>
                    {activityPanel ? (
                        <section aria-label="Activity log">
                            <p className={sectionLabelClass}>Activity log</p>
                            {activityPanel}
                        </section>
                    ) : null}
                    {filesPanel ? (
                        <section aria-label="Files">
                            <p className={sectionLabelClass}>Files</p>
                            {filesPanel}
                        </section>
                    ) : null}
                    {archiveActions ? (
                        <div className="flex flex-wrap gap-2">{archiveActions}</div>
                    ) : null}
                </aside>

                <div className="space-y-4 lg:col-span-8">
                    {canViewRevision || canViewAccounts ? (
                        <section aria-label="Project and accounts">
                            <p className={sectionLabelClass}>
                                2. Project & accounts
                            </p>
                            <div className="space-y-4">
                                {revisionsPanel}
                                {accountsPanel}
                            </div>
                        </section>
                    ) : null}
                    <section aria-label="Drawing status">
                        <p className={sectionLabelClass}>3. Drawing status</p>
                        {drawingPanel}
                    </section>
                    {commentsBlock ? (
                        <section aria-label="Comments">
                            <p className={sectionLabelClass}>4. Comments</p>
                            {commentsBlock}
                        </section>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
