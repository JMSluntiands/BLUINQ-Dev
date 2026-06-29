import { staffBadgeColor } from '@/Components/JobBoard/jobBoardStyles';
import InputError from '@/Components/InputError';
import TextInput from '@/Components/TextInput';
import { PencilSquareIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

const cardClass =
    'overflow-hidden rounded-xl border border-[#e6e9ef] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)] dark:border-[#2f3347] dark:bg-[#1a1b2e]';

const cardHeader =
    'flex items-center justify-between border-b border-[#e6e9ef] bg-[#fafbfc] px-4 py-3 sm:px-5 dark:border-[#2f3347] dark:bg-[#151622]';

const cardTitle = 'text-sm font-semibold text-[#323338] dark:text-white';

const thClass =
    'whitespace-nowrap border border-[#e6e9ef] bg-[#fafbfc] px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-[#676879] dark:border-[#2f3347] dark:bg-[#151622] dark:text-slate-400';

const tdClass =
    'whitespace-nowrap border border-[#e6e9ef] px-3 py-2.5 align-middle text-xs text-[#323338] dark:border-[#2f3347] dark:text-slate-200';

export function JobPanel({
    title,
    subtitle,
    children,
    canEdit = false,
    onEdit,
    canAdd = false,
    onAdd,
    addLabel = 'Add',
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
                {canEdit && onEdit ? (
                    <button
                        type="button"
                        onClick={onEdit}
                        className="inline-flex items-center gap-1 rounded-md border border-[#c5c7d0] bg-white px-2.5 py-1 text-xs font-semibold text-[#0073ea] shadow-sm transition hover:bg-[#e6f4ff] dark:border-[#3b82f6]/50 dark:bg-[#1a1b2e] dark:text-[#60a5fa] dark:hover:bg-[#243044]"
                    >
                        <PencilSquareIcon className="h-3.5 w-3.5" aria-hidden />
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
            <div>{children}</div>
        </section>
    );
}

function JobDetailField({ label, children, value }) {
    const display =
        children ??
        (value === null || value === undefined || value === '' ? '—' : value);

    return (
        <div className="border-b border-[#e6e9ef] px-4 py-3 last:border-b-0 dark:border-[#2f3347]">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#676879] dark:text-slate-400">
                {label}
            </dt>
            <dd className="mt-1 whitespace-pre-wrap text-sm text-[#323338] dark:text-slate-200">
                {display}
            </dd>
        </div>
    );
}

function ExternalLink({ href, label }) {
    const text = label ?? '—';

    if (!href) {
        return (
            <span className="font-semibold text-[#0073ea] dark:text-[#60a5fa]">
                {text}
            </span>
        );
    }

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#0073ea] underline decoration-[#0073ea]/30 underline-offset-2 transition hover:text-[#0060c4] dark:text-[#60a5fa] dark:hover:text-[#93c5fd]"
        >
            {text}
        </a>
    );
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
                className={
                    'inline-flex max-w-[5rem] items-center truncate rounded-md px-2 py-0.5 text-[10px] font-bold text-white ' +
                    staffBadgeColor(text)
                }
                title={name ?? text}
            >
                {text}
            </span>
        );
    }

    return (
        <span
            className={
                'inline-flex h-7 w-7 items-center justify-center rounded text-[10px] font-bold text-white ' +
                staffBadgeColor(text)
            }
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

function BuildingAreaEditor({
    value,
    canEdit,
    updateUrl,
    onCancel,
}) {
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
 * @param {{
 *   draftingRequest: Record<string, unknown>;
 *   revisions?: Array<Record<string, unknown>>;
 *   quotes?: Array<Record<string, unknown>>;
 *   invoices?: Array<Record<string, unknown>>;
 *   integrationUrls?: { sharepoint?: string|null; xero_quote?: string|null; xero_invoice?: string|null };
 *   canEdit?: boolean;
 *   canEditJobDetails?: boolean;
 *   canEditBuildingArea?: boolean;
 *   canViewAccounts?: boolean;
 *   canAddAccount?: boolean;
 *   onEditQuote?: (row: Record<string, unknown>) => void;
 *   onEditInvoice?: (row: Record<string, unknown>) => void;
 *   onAddQuote?: () => void;
 *   onAddInvoice?: () => void;
 *   canViewRevision?: boolean;
 *   canAddRevision?: boolean;
 *   onEditRevision?: (row: Record<string, unknown>) => void;
 *   onAddRevision?: () => void;
 *   updateUrl?: string;
 *   onEditJobDetails?: () => void;
 *   commentsPanel?: React.ReactNode;
 *   filesPanel?: React.ReactNode;
 *   activityPanel?: React.ReactNode;
 *   backHref?: string;
 *   archiveActions?: React.ReactNode;
 * }} props
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
    onEditRevision,
    onAddRevision,
    updateUrl = '',
    onEditJobDetails,
    commentsPanel,
    filesPanel,
    activityPanel,
    backHref,
    archiveActions,
}) {
    const [editingArea, setEditingArea] = useState(false);

    const contactLine = [
        draftingRequest.your_name,
        draftingRequest.email ? `(${draftingRequest.email})` : null,
    ]
        .filter(Boolean)
        .join(' ');

    const revisionColumns = [
        {
            key: 'revision',
            label: 'Job Number',
            render: (row) => (
                <ExternalLink
                    href={
                        integrationUrls.sharepoint
                            ? `${integrationUrls.sharepoint}${row.code}`
                            : null
                    }
                    label={row.code}
                />
            ),
        },
        {
            key: 'log_date',
            label: 'Log Date',
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
            key: 'drafter',
            label: 'User',
            render: (row) => (
                <DrafterBadge
                    initials={row.drafter_initials}
                    name={row.drafter_name}
                />
            ),
        },
        {
            key: 'drafting_hours',
            label: 'Drafting hours',
            render: (row) => (
                <span className="tabular-nums font-medium">
                    {formatHours(row.drafting_hours)}
                </span>
            ),
        },
        {
            key: 'checking_hours',
            label: 'Checking hours',
            render: (row) => (
                <span className="tabular-nums font-medium">
                    {formatHours(row.checking_hours)}
                </span>
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
            key: 'area_size',
            label: 'Area size',
            render: (row) => row.area_size ?? '—',
        },
        {
            key: 'submitted_date',
            label: 'Submitted Date',
            render: (row) => row.submitted_date ?? '—',
        },
        ...(canAddRevision && onEditRevision
            ? [
                  {
                      key: 'actions',
                      label: 'Action',
                      render: (row) => (
                          <button
                              type="button"
                              onClick={() => onEditRevision(row)}
                              className="text-[11px] font-semibold text-[#0073ea] underline underline-offset-2 hover:text-[#0060c4] dark:text-[#60a5fa]"
                          >
                              Edit
                          </button>
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

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    {backHref ? (
                        <Link
                            href={backHref}
                            className="mb-2 inline-block text-sm font-medium text-[#0073ea] hover:underline dark:text-[#60a5fa]"
                        >
                            ← Back to board
                        </Link>
                    ) : null}
                    <h1 className="text-xl font-semibold leading-snug text-[#323338] dark:text-white sm:text-2xl">
                        {draftingRequest.site_address || 'Job details'}
                    </h1>
                    <p className="mt-1 text-sm text-[#676879] dark:text-slate-400">
                        Job number:{' '}
                        <span className="font-medium text-[#323338] dark:text-slate-200">
                            {draftingRequest.reference}
                        </span>
                        {draftingRequest.is_archived ? ' · Archived' : ''}
                    </p>
                </div>
                {archiveActions ? (
                    <div className="flex flex-wrap gap-2">{archiveActions}</div>
                ) : null}
            </div>

            {draftingRequest.is_archived ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/50 dark:bg-amber-950/30 dark:text-amber-200">
                    This job is archived
                    {draftingRequest.archived_at
                        ? ` on ${draftingRequest.archived_at}`
                        : ''}
                    .
                </p>
            ) : null}

            <div className="space-y-6">
                <section aria-label="Job overview">
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#676879] dark:text-slate-500">
                        1. Job details
                    </p>
                    <JobPanel
                        title="Job details"
                        canEdit={canEdit || canEditJobDetails}
                        onEdit={onEditJobDetails}
                    >
                                <dl>
                                    <JobDetailField
                                        label="Client name"
                                        value={draftingRequest.company_name}
                                    />
                                    <JobDetailField
                                        label="Contact"
                                        value={contactLine || null}
                                    />
                                    <JobDetailField
                                        label="House type"
                                        value={
                                            draftingRequest.building_type
                                                ? String(
                                                      draftingRequest.building_type,
                                                  ).toUpperCase()
                                                : null
                                        }
                                    />
                                    <JobDetailField
                                        label="Zoning"
                                        value={draftingRequest.zoning}
                                    />
                                    <JobDetailField label="Building area">
                                        {editingArea ? (
                                            <BuildingAreaEditor
                                                value={
                                                    draftingRequest.max_building_area_sqm
                                                }
                                                canEdit
                                                updateUrl={updateUrl}
                                                onCancel={() =>
                                                    setEditingArea(false)
                                                }
                                            />
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span>
                                                    {draftingRequest.building_area_label ??
                                                        '—'}
                                                </span>
                                                {canEditBuildingArea ? (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setEditingArea(true)
                                                        }
                                                        className="text-[11px] font-semibold text-[#0073ea] underline underline-offset-2 hover:text-[#0060c4] dark:text-[#60a5fa]"
                                                    >
                                                        Edit
                                                    </button>
                                                ) : null}
                                            </div>
                                        )}
                                    </JobDetailField>
                                    <JobDetailField
                                        label="Services / category"
                                        value={draftingRequest.services_label}
                                    />
                                    <JobDetailField
                                        label="NDIS / SDA"
                                        value={
                                            draftingRequest.ndis_sda
                                                ? 'YES'
                                                : 'NO'
                                        }
                                    />
                                    <JobDetailField
                                        label="Building specifications"
                                        value={
                                            draftingRequest.building_specifications
                                        }
                                    />
                                </dl>
                    </JobPanel>
                </section>

                {canViewRevision || canViewAccounts ? (
                <section aria-label="Project and accounts">
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#676879] dark:text-slate-500">
                        2. Project & accounts
                    </p>
                    <div className="grid grid-cols-1 gap-4">
                        {canViewRevision ? (
                        <JobPanel
                            title="Revision"
                            canAdd={canAddRevision}
                            onAdd={onAddRevision}
                            addLabel="Add Item"
                        >
                            <div className="p-4">
                                <DataTable
                                    columns={revisionColumns}
                                    rows={revisions}
                                    emptyMessage="No revisions recorded yet."
                                    minWidth="44rem"
                                />
                            </div>
                        </JobPanel>
                        ) : null}

                        {canViewAccounts ? (
                            <JobPanel title="Quotes & invoices">
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
                                                    <PlusIcon
                                                        className="h-3 w-3"
                                                        aria-hidden
                                                    />
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
                                                    <PlusIcon
                                                        className="h-3 w-3"
                                                        aria-hidden
                                                    />
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
                        ) : null}
                    </div>
                </section>
                ) : null}

                {filesPanel ? (
                    <section aria-label="Files">
                        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#676879] dark:text-slate-500">
                            3. Files
                        </p>
                        {filesPanel}
                    </section>
                ) : null}

                {commentsPanel ? (
                    <section aria-label="Comments">
                        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#676879] dark:text-slate-500">
                            4. Comments
                        </p>
                        <JobPanel
                            title="Discussion"
                            className="flex min-h-[18rem] flex-col"
                        >
                            <div className="flex min-h-[16rem] flex-1 flex-col">
                                {commentsPanel}
                            </div>
                        </JobPanel>
                    </section>
                ) : null}

                {activityPanel ? (
                    <section aria-label="Activity log">
                        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#676879] dark:text-slate-500">
                            5. Activity log
                        </p>
                        {activityPanel}
                    </section>
                ) : null}
            </div>
        </div>
    );
}
