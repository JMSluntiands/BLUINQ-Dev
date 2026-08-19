import {
    JOB_LIST_SECTIONS,
    JOB_STATUS_LABELS,
    JOB_STATUS_STYLES,
    TAG_PILL_CLASS,
    staffBadgeStyle,
} from '@/Components/JobBoard/jobBoardStyles';
import JobBoardCommentsModal, {
    JobBoardCommentButton,
} from '@/Components/JobBoard/JobBoardCommentsModal';
import JobBoardAssignmentModal from '@/Components/JobBoard/JobBoardAssignmentModal';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import {
    CalendarDaysIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    FlagIcon,
} from '@heroicons/react/24/outline';
import { FlagIcon as FlagIconSolid } from '@heroicons/react/24/solid';
import { Link, router } from '@inertiajs/react';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';

const DRAFTING_SLOTS = 1;
const CHECKING_SLOTS = 1;

/**
 * @typedef {{ id?: number; user_id?: number; initials: string; name?: string; hours?: string | null }} StaffAssignment
 * @typedef {{ color: string; weight: number }} ProgressSegment
 * @typedef {{
 *   id: number;
 *   job: string;
 *   job_no: string;
 *   builder: string;
 *   category: string;
 *   storey_level: string;
 *   latest_revision?: string;
 *   accounting?: string;
 *   revisions?: Array<{ id: number; code: string; status?: string | null; status_label?: string | null }>;
 *   date_in?: string | null;
 *   date_in_label?: string | null;
 *   eta?: string | null;
 *   eta_label?: string | null;
 *   start_date?: string | null;
 *   start_date_label?: string | null;
 *   progress_segments?: ProgressSegment[];
 *   drafting: (StaffAssignment | null)[];
 *   checking: (StaffAssignment | null)[];
 *   total_hours?: number | null;
 *   area?: string | null;
 *   area_sqm?: string | null;
 *   date_out?: string | null;
 *   date_out_label?: string | null;
 *   status: keyof typeof JOB_STATUS_LABELS;
 *   status_label?: string;
 *   list_group?: string;
 *   is_priority?: boolean;
 *   vo_hours?: string | null;
 *   files_count?: number;
 *   comments_count?: number;
 *   has_comments?: boolean;
 *   can_assign?: boolean;
 * }} JobBoardRow
 */

function TagPill({ children, title }) {
    return (
        <span className={TAG_PILL_CLASS} title={title ?? children}>
            {children}
        </span>
    );
}

function StatusPill({ status, label }) {
    return (
        <span
            className={
                'inline-flex min-w-[5.5rem] items-center justify-center rounded-md px-2 py-1 text-[11px] font-semibold ' +
                (JOB_STATUS_STYLES[status] ?? JOB_STATUS_STYLES.new)
            }
        >
            {label ?? JOB_STATUS_LABELS[status] ?? status}
        </span>
    );
}

function StaffSlot({ assignment, editable = false, onClick }) {
    const content = !assignment ? (
        <span className="text-[11px] text-[#676879] dark:text-slate-500">
            {editable ? 'Assign…' : '—'}
        </span>
    ) : (
        <div className="flex items-center gap-1">
            <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-[10px] font-bold shadow-sm ring-1 ring-black/10"
                style={staffBadgeStyle(assignment.initials)}
                title={assignment.name ?? assignment.initials}
            >
                {assignment.initials}
            </span>
            {assignment.hours && (
                <span className="whitespace-nowrap text-[11px] text-[#676879] dark:text-slate-400">
                    {assignment.hours}
                </span>
            )}
        </div>
    );

    if (!editable) {
        return content;
    }

    return (
        <button
            type="button"
            onClick={onClick}
            className="rounded-md px-1 py-0.5 text-left transition hover:bg-[#e6f4ff] dark:hover:bg-[#243044]"
            title="Edit assignment"
        >
            {content}
        </button>
    );
}

/** Map legacy / removed codes onto active Archi statuses. */
const LEGACY_STATUS_TO_ARCHI = {
    wip: 'drafting_wip',
    for_quote: 'new',
    quote_sent: 'submitted',
    invoiced: 'submitted',
    paid: 'submitted',
    for_quotes: 'new',
    completed_projects: 'submitted',
    cancelled_jobs: 'cancelled',
    assigned: 'design_wip',
    on_hold: 'design_wip',
    query: 'design_wip',
};

/**
 * @param {string | null | undefined} status
 * @param {Set<string>} known
 */
function normalizeArchiStatus(status, known) {
    const raw = status || 'new';

    if (!known || known.size === 0 || known.has(raw)) {
        return raw;
    }

    const mapped = LEGACY_STATUS_TO_ARCHI[raw] ?? raw;

    if (known.has(mapped)) {
        return mapped;
    }

    return known.has('new') ? 'new' : mapped;
}

function EditableStatusSelect({ job, statusOptions = [], disabled = false }) {
    const [busy, setBusy] = useState(false);

    if (disabled) {
        return (
            <StatusPill status={job.status} label={job.status_label} />
        );
    }

    const current = job.status ?? 'new';
    const hasDraftingWip = statusOptions.some(
        (option) => option.value === 'drafting_wip',
    );
    const collapsedCurrent =
        hasDraftingWip &&
        (current === 'design_wip' || current === 'wip')
            ? 'drafting_wip'
            : current;
    const dropdownOptions = statusOptions.filter((option) => {
        if (!hasDraftingWip) {
            return true;
        }

        return option.value !== 'design_wip' && option.value !== 'wip';
    });
    const options = dropdownOptions.some(
        (option) => option.value === collapsedCurrent,
    )
        ? dropdownOptions
        : [
              {
                  value: collapsedCurrent,
                  label:
                      job.status_label ??
                      JOB_STATUS_LABELS[collapsedCurrent] ??
                      collapsedCurrent,
              },
              ...dropdownOptions,
          ];

    return (
        <select
            value={collapsedCurrent}
            disabled={busy}
            onChange={(event) => {
                const next = event.target.value;
                if (next === job.status || next === collapsedCurrent) {
                    return;
                }
                setBusy(true);
                router.patch(
                    route('job.drafting.board.update', job.id),
                    { status: next },
                    {
                        preserveScroll: true,
                        onFinish: () => setBusy(false),
                    },
                );
            }}
            className={
                'job-board-status-select max-w-[8.5rem] rounded-md border px-2 py-1 text-[11px] font-semibold focus:outline-none focus:ring-2 focus:ring-[#0073ea] disabled:opacity-50 ' +
                (JOB_STATUS_STYLES[job.status] ?? JOB_STATUS_STYLES.new)
            }
            aria-label={`Status for ${job.job_no}`}
        >
            {options.map((option) => (
                <option
                    key={option.value}
                    value={option.value}
                    className="bg-white text-[#323338]"
                >
                    {option.label}
                </option>
            ))}
        </select>
    );
}

function EditableVoHours({ job, disabled = false }) {
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [value, setValue] = useState(job.vo_hours ?? '');
    const display =
        job.vo_hours != null && job.vo_hours !== ''
            ? `${job.vo_hours} h`
            : '—';

    useEffect(() => {
        if (open) {
            setValue(job.vo_hours ?? '');
        }
    }, [open, job.vo_hours]);

    if (disabled) {
        return (
            <span className="whitespace-nowrap tabular-nums text-[#676879] dark:text-slate-400">
                {display}
            </span>
        );
    }

    const close = () => {
        if (busy) {
            return;
        }
        setOpen(false);
        setValue(job.vo_hours ?? '');
    };

    const save = (event) => {
        event.preventDefault();
        const next = String(value).trim();
        setBusy(true);
        router.patch(
            route('job.drafting.board.update', job.id),
            { vo_hours: next === '' ? null : next },
            {
                preserveScroll: true,
                onSuccess: () => setOpen(false),
                onFinish: () => setBusy(false),
            },
        );
    };

    return (
        <>
            <div className="flex items-center gap-1.5">
                <span className="whitespace-nowrap tabular-nums text-[#676879] dark:text-slate-400">
                    {display}
                </span>
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="text-[10px] font-semibold text-[#0073ea] underline underline-offset-2 hover:text-[#0060c4] dark:text-[#60a5fa]"
                >
                    Edit
                </button>
            </div>

            <Modal show={open} onClose={close} maxWidth="sm">
                <form onSubmit={save} className="p-6">
                    <h2 className="text-lg font-semibold text-[#323338] dark:text-white">
                        Edit VO hours
                    </h2>
                    <p className="mt-1 text-sm text-[#676879] dark:text-slate-400">
                        {job.job_no}
                        {job.job ? ` — ${job.job}` : ''}
                    </p>

                    <div className="mt-5">
                        <InputLabel htmlFor={`vo-hours-${job.id}`} value="VO hours" />
                        <TextInput
                            id={`vo-hours-${job.id}`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={value}
                            onChange={(event) => setValue(event.target.value)}
                            className="mt-1 block w-full"
                            placeholder="e.g. 2.5"
                            disabled={busy}
                            autoFocus
                        />
                    </div>

                    <div className="mt-6 flex flex-wrap justify-end gap-2">
                        <SecondaryButton
                            type="button"
                            onClick={close}
                            disabled={busy}
                            className="rounded-lg normal-case tracking-normal"
                        >
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton
                            loading={busy}
                            className="rounded-lg normal-case tracking-normal !bg-[#0073ea] hover:!bg-[#0060c4]"
                        >
                            Save
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </>
    );
}

function EditableArea({ job, disabled = false }) {
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [value, setValue] = useState(job.area_sqm ?? '');
    const display = job.area ?? '—';

    useEffect(() => {
        if (open) {
            setValue(job.area_sqm ?? '');
        }
    }, [open, job.area_sqm]);

    if (disabled) {
        return (
            <span className="whitespace-nowrap tabular-nums text-[#676879] dark:text-slate-400">
                {display}
            </span>
        );
    }

    const close = () => {
        if (busy) {
            return;
        }
        setOpen(false);
        setValue(job.area_sqm ?? '');
    };

    const save = (event) => {
        event.preventDefault();
        const next = String(value).trim();
        setBusy(true);
        router.patch(
            route('job.drafting.board.update', job.id),
            { max_building_area_sqm: next === '' ? null : next },
            {
                preserveScroll: true,
                onSuccess: () => setOpen(false),
                onFinish: () => setBusy(false),
            },
        );
    };

    return (
        <>
            <div className="flex items-center gap-1.5">
                <span className="whitespace-nowrap tabular-nums text-[#676879] dark:text-slate-400">
                    {display}
                </span>
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="text-[10px] font-semibold text-[#0073ea] underline underline-offset-2 hover:text-[#0060c4] dark:text-[#60a5fa]"
                >
                    Edit
                </button>
            </div>

            <Modal show={open} onClose={close} maxWidth="sm">
                <form onSubmit={save} className="p-6">
                    <h2 className="text-lg font-semibold text-[#323338] dark:text-white">
                        Edit area
                    </h2>
                    <p className="mt-1 text-sm text-[#676879] dark:text-slate-400">
                        {job.job_no}
                        {job.job ? ` — ${job.job}` : ''}
                    </p>

                    <div className="mt-5">
                        <InputLabel
                            htmlFor={`area-sqm-${job.id}`}
                            value="Building area (m²)"
                        />
                        <TextInput
                            id={`area-sqm-${job.id}`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={value}
                            onChange={(event) => setValue(event.target.value)}
                            className="mt-1 block w-full"
                            placeholder="e.g. 276.48"
                            disabled={busy}
                            autoFocus
                        />
                    </div>

                    <div className="mt-6 flex flex-wrap justify-end gap-2">
                        <SecondaryButton
                            type="button"
                            onClick={close}
                            disabled={busy}
                            className="rounded-lg normal-case tracking-normal"
                        >
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton
                            loading={busy}
                            className="rounded-lg normal-case tracking-normal !bg-[#0073ea] hover:!bg-[#0060c4]"
                        >
                            Save
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </>
    );
}

function EditableBoardDate({
    job,
    field,
    labelKey,
    ariaName,
    emptyTitle,
    disabled = false,
}) {
    const [busy, setBusy] = useState(false);
    const inputRef = useRef(null);
    const value = job[field] ?? null;
    const label = job[labelKey] ?? '—';

    if (disabled) {
        return (
            <span className="whitespace-nowrap tabular-nums text-[#676879] dark:text-slate-400">
                {label}
            </span>
        );
    }

    const openPicker = () => {
        const input = inputRef.current;
        if (!input || busy) {
            return;
        }
        if (typeof input.showPicker === 'function') {
            try {
                input.showPicker();
                return;
            } catch {
                // Fall through to click() for browsers that block showPicker.
            }
        }
        input.click();
    };

    return (
        <div className="inline-flex items-center gap-1.5">
            <button
                type="button"
                disabled={busy}
                onClick={openPicker}
                title={value ? `${ariaName}: ${label}` : emptyTitle}
                aria-label={`${ariaName} for ${job.job_no}`}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#c5c7d0] bg-white text-[#676879] transition-colors hover:border-[#0073ea] hover:bg-[#e6e9ef] hover:text-[#0073ea] focus:outline-none focus:ring-2 focus:ring-[#0073ea] focus:ring-offset-1 disabled:opacity-50 dark:border-[#2f3347] dark:bg-[#151622] dark:text-slate-300 dark:hover:bg-[#1c1e2e]"
            >
                <CalendarDaysIcon className="h-4 w-4" />
            </button>
            <span className="whitespace-nowrap tabular-nums text-[11px] text-[#676879] dark:text-slate-400">
                {label}
            </span>
            <input
                ref={inputRef}
                type="date"
                value={value ?? ''}
                disabled={busy}
                onChange={(event) => {
                    setBusy(true);
                    router.patch(
                        route('job.drafting.board.update', job.id),
                        { [field]: event.target.value || null },
                        {
                            preserveScroll: true,
                            onFinish: () => setBusy(false),
                        },
                    );
                }}
                className="pointer-events-none absolute h-0 w-0 opacity-0"
                tabIndex={-1}
                aria-hidden="true"
            />
        </div>
    );
}

function EditableDateOut({ job, disabled = false }) {
    return (
        <EditableBoardDate
            job={job}
            field="date_out"
            labelKey="date_out_label"
            ariaName="Date out"
            emptyTitle="Set date out"
            disabled={disabled}
        />
    );
}

function EditableStartDate({ job, disabled = false }) {
    return (
        <EditableBoardDate
            job={job}
            field="start_date"
            labelKey="start_date_label"
            ariaName="Start date"
            emptyTitle="Set start date"
            disabled={disabled}
        />
    );
}

function EditableDateIn({ job, disabled = false }) {
    return (
        <EditableBoardDate
            job={job}
            field="date_in"
            labelKey="date_in_label"
            ariaName="Date in"
            emptyTitle="Set date in"
            disabled={disabled}
        />
    );
}

function EditableEta({ job, disabled = false }) {
    return (
        <EditableBoardDate
            job={job}
            field="eta"
            labelKey="eta_label"
            ariaName="ETA"
            emptyTitle="Set ETA"
            disabled={disabled}
        />
    );
}

function ProgressCell({ segments = [] }) {
    if (!segments.length) {
        return <span className="inline-block h-7 w-3 rounded-sm bg-[#e6e9ef] dark:bg-[#2a2d3e]" />;
    }

    const totalWeight = segments.reduce((sum, seg) => sum + seg.weight, 0);

    return (
        <div className="flex h-7 w-3 flex-col-reverse overflow-hidden rounded-sm">
            {segments.map((segment, index) => (
                <div
                    key={`${segment.color}-${index}`}
                    style={{
                        flexGrow: segment.weight,
                        backgroundColor: segment.color,
                        minHeight: totalWeight > 0 ? `${(segment.weight / totalWeight) * 100}%` : 0,
                    }}
                />
            ))}
        </div>
    );
}

function PriorityFlag({ job, onToggled }) {
    const [busy, setBusy] = useState(false);
    const flagged = Boolean(job.is_priority);

    const toggle = () => {
        if (busy) {
            return;
        }

        setBusy(true);
        router.patch(route('job.drafting.priority.update', job.id), {}, {
            preserveScroll: true,
            onFinish: () => {
                setBusy(false);
                onToggled?.();
            },
        });
    };

    const Icon = flagged ? FlagIconSolid : FlagIcon;

    return (
        <button
            type="button"
            onClick={toggle}
            disabled={busy}
            className={
                'rounded-md p-1 transition hover:bg-[#f0f4ff] disabled:opacity-50 dark:hover:bg-[#243044] ' +
                (flagged
                    ? 'text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300'
                    : 'text-[#676879] hover:text-[#323338] dark:text-slate-500 dark:hover:text-slate-300')
            }
            aria-label={flagged ? 'Remove priority flag' : 'Mark as priority'}
            title={flagged ? 'Priority job' : 'Add priority flag'}
        >
            <Icon className="h-4 w-4" aria-hidden />
        </button>
    );
}

const thClass =
    'whitespace-nowrap border-r border-[#e6e9ef] px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-[#676879] last:border-r-0 dark:border-[#2f3347] dark:text-slate-400';

const tdClass =
    'border-r border-[#e6e9ef] px-2 py-1.5 align-middle text-xs text-[#323338] last:border-r-0 dark:border-[#2a2d42] dark:text-slate-200';

/**
 * Group jobs by Archi workflow status (Workflows.pdf Status list).
 *
 * @param {JobBoardRow[]} jobs
 * @param {Array<{ value: string, label: string }>} statusOptions
 * @returns {Array<{ status: string; label: string; jobs: JobBoardRow[]; listSection: boolean }>}
 */
function groupJobsByWorkflowStatus(jobs, statusOptions) {
    const options = statusOptions ?? [];
    const known = new Set(options.map((option) => option.value));

    /** @type {Map<string, JobBoardRow[]>} */
    const buckets = new Map();

    for (const job of jobs) {
        const key = normalizeArchiStatus(job.status, known);
        const existing = buckets.get(key) ?? [];
        existing.push(job);
        buckets.set(key, existing);
    }

    return options.map((option) => ({
        status: option.value,
        label: option.label,
        jobs: buckets.get(option.value) ?? [],
        listSection: false,
    }));
}

/**
 * @param {JobBoardRow[]} jobs
 * @param {Record<string, string>} sectionLabels
 * @returns {Array<{ status: string; label: string; jobs: JobBoardRow[]; listSection: boolean }>}
 */
function groupJobsByListSection(jobs, sectionLabels) {
    /** @type {Map<string, JobBoardRow[]>} */
    const buckets = new Map();

    for (const job of jobs) {
        const key = job.list_group ?? 'for_quotes';
        const existing = buckets.get(key) ?? [];
        existing.push(job);
        buckets.set(key, existing);
    }

    return JOB_LIST_SECTIONS.map(({ key, label }) => ({
        status: key,
        label: sectionLabels[key] ?? label,
        jobs: buckets.get(key) ?? [],
        listSection: true,
    }));
}

function JobBoardTableHead({
    showFilesInTotal,
    hideStatus,
    showActions = false,
    variant = 'board',
}) {
    if (variant === 'masterlist') {
        return (
            <thead className="bg-[#fafbfc] dark:bg-[#151622]">
                <tr>
                    <th className={thClass}>Site Address</th>
                    <th className={thClass + ' w-10'} />
                    <th className={thClass}>Lead No.</th>
                    <th className={thClass}>Client Name</th>
                    <th className={thClass}>Storey / Levels</th>
                    <th className={thClass}>Latest Revision</th>
                    <th className={thClass}>Status</th>
                    <th className={thClass}>Accounting</th>
                    <th className={thClass + ' w-10'}>Priority</th>
                    {showActions && <th className={thClass}>Actions</th>}
                </tr>
            </thead>
        );
    }

    const draftingHeaders = Array.from({ length: DRAFTING_SLOTS }, (_, index) => (
        <th key={`drafting-${index}`} className={thClass}>
            Drafting
        </th>
    ));

    const checkingHeaders = Array.from({ length: CHECKING_SLOTS }, (_, index) => (
        <th key={`checking-${index}`} className={thClass}>
            Checking
        </th>
    ));

    return (
        <thead className="bg-[#fafbfc] dark:bg-[#151622]">
            <tr>
                <th className={thClass}>Site Address</th>
                <th className={thClass + ' w-10'} />
                <th className={thClass}>Revision No.</th>
                <th className={thClass}>Client Name</th>
                <th className={thClass}>Category</th>
                <th className={thClass}>Storey / Levels</th>
                <th className={thClass}>Date In</th>
                <th className={thClass}>ETA</th>
                <th className={thClass}>Start Date</th>
                {draftingHeaders}
                {checkingHeaders}
                <th className={thClass}>Total hrs</th>
                <th className={thClass}>Areas</th>
                <th className={thClass}>Date Out</th>
                {!hideStatus && <th className={thClass}>Status</th>}
                <th className={thClass + ' w-10'}>Priority</th>
                <th className={thClass}>VO</th>
                {showActions && <th className={thClass}>Actions</th>}
            </tr>
        </thead>
    );
}

/**
 * @param {{
 *   jobs?: JobBoardRow[];
 *   emptyMessage?: string;
 *   getJobHref?: (row: JobBoardRow) => string;
 *   showFilesInTotal?: boolean;
 *   groupByStatus?: boolean;
 *   onCommentsUpdated?: () => void;
 *   onPriorityUpdated?: () => void;
 *   onAssignmentsUpdated?: () => void;
 *   assignableUsers?: Array<{ id: number; name: string; initials?: string }>;
 *   commentJob: JobBoardRow | null;
 *   setCommentJob: (job: JobBoardRow | null) => void;
 *   onPriorityUpdated?: () => void;
 *   hideStatus?: boolean;
 *   variant?: 'board' | 'masterlist';
 * }} props
 */
function JobBoardTableBody({
    jobs,
    getJobHref,
    showFilesInTotal = false,
    hideStatus = false,
    setCommentJob,
    onPriorityUpdated,
    renderActions = null,
    variant = 'board',
    fitWidth = false,
    assignableUsers = [],
    statusOptions = [],
    onOpenAssignment = null,
}) {
    const isMasterlist = variant === 'masterlist';
    const [expandedIds, setExpandedIds] = useState(() => new Set());

    const toggleExpanded = (jobId) => {
        setExpandedIds((current) => {
            const next = new Set(current);
            if (next.has(jobId)) {
                next.delete(jobId);
            } else {
                next.add(jobId);
            }
            return next;
        });
    };

    const masterlistColSpan = renderActions ? 10 : 9;

    return (
        <tbody>
            {jobs.map((job, rowIndex) => {
                const draftingSlots = job.drafting ?? [];
                const checkingSlots = job.checking ?? [];
                const revisions = job.revisions ?? [];
                const isExpanded = expandedIds.has(job.id);
                // APM REVISION NO. = server latest_revision only (never invent from job_no).
                const revisionNo = isMasterlist
                    ? job.job_no
                    : job.latest_revision && job.latest_revision !== '—'
                      ? job.latest_revision
                      : '—';
                const rowTone = job.is_priority
                    ? 'bg-amber-50/70 dark:bg-[#2a1f2e]'
                    : rowIndex % 2 === 1
                      ? 'bg-[#fafbfc] dark:bg-[#1e1f32]'
                      : 'bg-white dark:bg-[#1a1b2e]';

                return (
                    <Fragment key={job.id}>
                        <tr
                            className={
                                'border-b border-[#e6e9ef] transition-colors hover:bg-[#f0f4ff] dark:border-[#2a2d42] dark:hover:bg-[#22243a] ' +
                                rowTone
                            }
                        >
                            <td className={tdClass}>
                                <div
                                    className={
                                        'flex items-center gap-1.5 ' +
                                        (fitWidth
                                            ? 'min-w-0'
                                            : 'min-w-[14rem]')
                                    }
                                >
                                    {isMasterlist ? (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                toggleExpanded(job.id)
                                            }
                                            className="rounded p-0.5 text-[#676879] transition hover:bg-[#e6e9ef] hover:text-[#323338] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                            aria-expanded={isExpanded}
                                            aria-label={
                                                isExpanded
                                                    ? 'Hide revisions'
                                                    : 'Show revisions'
                                            }
                                            title={
                                                isExpanded
                                                    ? 'Hide revisions'
                                                    : 'Show revisions'
                                            }
                                        >
                                            <ChevronRightIcon
                                                className={
                                                    'h-3.5 w-3.5 shrink-0 transition-transform ' +
                                                    (isExpanded
                                                        ? 'rotate-90'
                                                        : '')
                                                }
                                                aria-hidden
                                            />
                                        </button>
                                    ) : (
                                        <ChevronRightIcon
                                            className="h-3.5 w-3.5 shrink-0 text-[#676879] dark:text-slate-500"
                                            aria-hidden
                                        />
                                    )}
                                    <span
                                        className="line-clamp-2 min-w-0 flex-1 font-medium text-[#323338] dark:text-white"
                                        title={job.job}
                                    >
                                        {job.job}
                                    </span>
                                </div>
                            </td>
                            <td className={tdClass}>
                                <JobBoardCommentButton
                                    count={job.comments_count ?? 0}
                                    label={job.job}
                                    onClick={() => setCommentJob(job)}
                                />
                            </td>
                            <td className={tdClass + ' tabular-nums'}>
                                {getJobHref ? (
                                    <Link
                                        href={getJobHref(job)}
                                        className="font-semibold text-[#0073ea] transition hover:text-[#0060c4] hover:underline dark:text-[#1890ff] dark:hover:text-[#1478e0]"
                                    >
                                        {revisionNo}
                                    </Link>
                                ) : (
                                    <span className="text-[#0073ea] dark:text-[#1890ff]">
                                        {revisionNo}
                                    </span>
                                )}
                            </td>
                            <td className={tdClass}>
                                <TagPill title={job.builder}>
                                    {job.builder}
                                </TagPill>
                            </td>
                            {isMasterlist ? (
                                <>
                                    <td className={tdClass}>
                                        <TagPill title={job.storey_level}>
                                            {job.storey_level}
                                        </TagPill>
                                    </td>
                                    <td
                                        className={
                                            tdClass + ' whitespace-nowrap'
                                        }
                                    >
                                        {job.latest_revision ?? '—'}
                                    </td>
                                    <td className={tdClass}>
                                        <StatusPill
                                            status={job.status}
                                            label={job.status_label}
                                        />
                                    </td>
                                    <td className={tdClass}>
                                        <TagPill title={job.accounting}>
                                            {job.accounting ?? '—'}
                                        </TagPill>
                                    </td>
                                </>
                            ) : (
                                <>
                                    <td className={tdClass}>
                                        <TagPill
                                            title={
                                                job.category_full ??
                                                job.category
                                            }
                                        >
                                            {job.category}
                                        </TagPill>
                                    </td>
                                    <td className={tdClass}>
                                        <TagPill title={job.storey_level}>
                                            {job.storey_level}
                                        </TagPill>
                                    </td>
                                    <td className={tdClass}>
                                        <EditableDateIn
                                            job={job}
                                            disabled={!job.can_assign}
                                        />
                                    </td>
                                    <td className={tdClass}>
                                        <EditableEta
                                            job={job}
                                            disabled={!job.can_assign}
                                        />
                                    </td>
                                    <td className={tdClass}>
                                        <EditableStartDate
                                            job={job}
                                            disabled={!job.can_assign}
                                        />
                                    </td>
                                    {Array.from(
                                        { length: DRAFTING_SLOTS },
                                        (_, index) => (
                                            <td
                                                key={`${job.id}-draft-${index}`}
                                                className={tdClass}
                                            >
                                                <StaffSlot
                                                    assignment={
                                                        draftingSlots[index]
                                                    }
                                                    editable={Boolean(
                                                        job.can_assign &&
                                                            onOpenAssignment,
                                                    )}
                                                    onClick={() =>
                                                        onOpenAssignment?.({
                                                            job,
                                                            role: 'drafting',
                                                            slot: index,
                                                            assignment:
                                                                draftingSlots[
                                                                    index
                                                                ],
                                                        })
                                                    }
                                                />
                                            </td>
                                        ),
                                    )}
                                    {Array.from(
                                        { length: CHECKING_SLOTS },
                                        (_, index) => (
                                            <td
                                                key={`${job.id}-check-${index}`}
                                                className={tdClass}
                                            >
                                                <StaffSlot
                                                    assignment={
                                                        checkingSlots[index]
                                                    }
                                                    editable={Boolean(
                                                        job.can_assign &&
                                                            onOpenAssignment,
                                                    )}
                                                    onClick={() =>
                                                        onOpenAssignment?.({
                                                            job,
                                                            role: 'checking',
                                                            slot: index,
                                                            assignment:
                                                                checkingSlots[
                                                                    index
                                                                ],
                                                        })
                                                    }
                                                />
                                            </td>
                                        ),
                                    )}
                                    <td
                                        className={
                                            tdClass +
                                            ' whitespace-nowrap tabular-nums text-[#676879] dark:text-slate-400'
                                        }
                                    >
                                        {job.total_hours != null
                                            ? `${job.total_hours} h`
                                            : '—'}
                                    </td>
                                    <td className={tdClass}>
                                        <EditableArea
                                            job={job}
                                            disabled={!job.can_assign}
                                        />
                                    </td>
                                    <td className={tdClass}>
                                        <EditableDateOut
                                            job={job}
                                            disabled={!job.can_assign}
                                        />
                                    </td>
                                    {!hideStatus && (
                                        <td className={tdClass}>
                                            <EditableStatusSelect
                                                job={job}
                                                statusOptions={statusOptions}
                                                disabled={!job.can_assign}
                                            />
                                        </td>
                                    )}
                                </>
                            )}
                            <td className={tdClass}>
                                <PriorityFlag
                                    job={job}
                                    onToggled={onPriorityUpdated}
                                />
                            </td>
                            {!isMasterlist && (
                                <td className={tdClass}>
                                    <EditableVoHours
                                        job={job}
                                        disabled={!job.can_assign}
                                    />
                                </td>
                            )}
                            {renderActions ? (
                                <td className={tdClass}>
                                    {renderActions(job)}
                                </td>
                            ) : null}
                        </tr>

                        {isMasterlist &&
                            isExpanded &&
                            (revisions.length > 0 ? (
                                revisions.map((revision) => (
                                    <tr
                                        key={`${job.id}-rev-${revision.id}`}
                                        className="border-b border-[#e6e9ef] bg-[#f6f7fb] dark:border-[#2a2d42] dark:bg-[#151622]"
                                    >
                                        <td className={tdClass} colSpan={2}>
                                            <div className="flex items-center gap-1.5 ps-6">
                                                <span className="text-[10px] text-[#c5c7d0] dark:text-slate-600">
                                                    └
                                                </span>
                                                <span className="font-semibold tabular-nums text-[#0073ea] dark:text-[#1890ff]">
                                                    {revision.code}
                                                </span>
                                            </div>
                                        </td>
                                        <td className={tdClass}>—</td>
                                        <td className={tdClass}>—</td>
                                        <td className={tdClass}>—</td>
                                        <td
                                            className={
                                                tdClass + ' whitespace-nowrap'
                                            }
                                        >
                                            {revision.code}
                                        </td>
                                        <td className={tdClass}>
                                            {revision.status ? (
                                                <StatusPill
                                                    status={revision.status}
                                                    label={
                                                        revision.status_label
                                                    }
                                                />
                                            ) : (
                                                '—'
                                            )}
                                        </td>
                                        <td className={tdClass}>—</td>
                                        <td className={tdClass}>—</td>
                                        {renderActions ? (
                                            <td className={tdClass}>—</td>
                                        ) : null}
                                    </tr>
                                ))
                            ) : (
                                <tr className="border-b border-[#e6e9ef] bg-[#f6f7fb] dark:border-[#2a2d42] dark:bg-[#151622]">
                                    <td
                                        className={
                                            tdClass +
                                            ' ps-8 text-[#676879] dark:text-slate-400'
                                        }
                                        colSpan={masterlistColSpan}
                                    >
                                        No revisions yet.
                                    </td>
                                </tr>
                            ))}
                    </Fragment>
                );
            })}
        </tbody>
    );
}

function JobBoardStatusSection({
    status,
    label,
    jobs,
    collapsed,
    onToggle,
    showFilesInTotal,
    getJobHref,
    setCommentJob,
    onPriorityUpdated,
    listSection = false,
    hideStatus = false,
    renderActions = null,
    variant = 'board',
    fitWidth = false,
    assignableUsers = [],
    statusOptions = [],
    onOpenAssignment = null,
}) {
    const sectionId = `job-board-status-${status}`;

    return (
        <section className="border-t border-[#e6e9ef] first:border-t-0 dark:border-[#2f3347]">
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={!collapsed}
                aria-controls={sectionId}
                className="flex w-full items-center gap-3 bg-[#fafbfc] px-4 py-2.5 text-left transition hover:bg-[#f0f4ff] dark:bg-[#151622] dark:hover:bg-[#1e2035]"
            >
                <ChevronDownIcon
                    className={
                        'h-4 w-4 shrink-0 text-[#676879] transition-transform dark:text-slate-400 ' +
                        (collapsed ? '-rotate-90' : '')
                    }
                    aria-hidden
                />
                {listSection ? (
                    <span className="text-sm font-semibold text-[#323338] dark:text-white">
                        {label}
                    </span>
                ) : (
                    <StatusPill status={status} label={label} />
                )}
                <span className="text-xs font-medium text-[#676879] dark:text-slate-400">
                    {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'}
                </span>
                <span className="sr-only">
                    {collapsed ? 'Show' : 'Hide'} {label} jobs
                </span>
            </button>

            {!collapsed &&
                (jobs.length > 0 ? (
                    <div
                        id={sectionId}
                        className={
                            'min-w-0 max-w-full ' +
                            (fitWidth ? 'overflow-x-hidden' : 'overflow-x-auto')
                        }
                    >
                        <table
                            className={
                                'w-full border-collapse text-left ' +
                                (fitWidth
                                    ? 'table-fixed'
                                    : variant === 'masterlist'
                                      ? 'min-w-[64rem]'
                                      : 'min-w-[108rem]')
                            }
                        >
                            <JobBoardTableHead
                                showFilesInTotal={showFilesInTotal}
                                hideStatus={hideStatus}
                                showActions={Boolean(renderActions)}
                                variant={variant}
                            />
                            <JobBoardTableBody
                                jobs={jobs}
                                getJobHref={getJobHref}
                                showFilesInTotal={showFilesInTotal}
                                hideStatus={hideStatus}
                                setCommentJob={setCommentJob}
                                onPriorityUpdated={onPriorityUpdated}
                                renderActions={renderActions}
                                variant={variant}
                                fitWidth={fitWidth}
                                assignableUsers={assignableUsers}
                                statusOptions={statusOptions}
                                onOpenAssignment={onOpenAssignment}
                            />
                        </table>
                    </div>
                ) : (
                    <div
                        id={sectionId}
                        className="border-t border-[#e6e9ef] px-4 py-6 text-center text-sm text-[#676879] dark:border-[#2a2d42] dark:text-slate-400"
                    >
                        No jobs in this section.
                    </div>
                ))}
        </section>
    );
}

/**
 * @param {{
 *   jobs?: JobBoardRow[];
 *   emptyMessage?: string;
 *   getJobHref?: (row: JobBoardRow) => string;
 *   showFilesInTotal?: boolean;
 *   groupByStatus?: boolean;
 *   hideEmptyStatusGroups?: boolean;
 *   onCommentsUpdated?: () => void;
 *   onPriorityUpdated?: () => void;
 *   variant?: 'board' | 'masterlist';
 * }} props
 */
export default function JobBoardGrid({
    jobs = [],
    emptyMessage = 'No jobs to display.',
    getJobHref,
    showFilesInTotal = false,
    groupByStatus = false,
    hideEmptyStatusGroups = false,
    jobListSections = {},
    onCommentsUpdated,
    onPriorityUpdated,
    onAssignmentsUpdated,
    hideStatus = false,
    renderActions = null,
    variant = 'board',
    fitWidth = false,
    assignableUsers = [],
    statusOptions = [],
    statusGroupOptions = [],
}) {
    const [commentJob, setCommentJob] = useState(null);
    const [assignmentTarget, setAssignmentTarget] = useState(null);
    const [collapsedStatuses, setCollapsedStatuses] = useState(
        () => new Set(),
    );

    const useListSections =
        groupByStatus && Object.keys(jobListSections).length > 0;

    const statusGroups = useMemo(() => {
        if (!groupByStatus) {
            return [];
        }

        const groupingOptions =
            statusGroupOptions.length > 0
                ? statusGroupOptions
                : statusOptions;

        const groups = useListSections
            ? groupJobsByListSection(jobs, jobListSections)
            : groupJobsByWorkflowStatus(jobs, groupingOptions);

        if (!hideEmptyStatusGroups) {
            return groups;
        }

        return groups.filter((group) => group.jobs.length > 0);
    }, [
        groupByStatus,
        hideEmptyStatusGroups,
        useListSections,
        jobs,
        jobListSections,
        statusOptions,
        statusGroupOptions,
    ]);

    const toggleStatusSection = (status) => {
        setCollapsedStatuses((current) => {
            const next = new Set(current);
            if (next.has(status)) {
                next.delete(status);
            } else {
                next.add(status);
            }
            return next;
        });
    };

    if (!jobs.length && !groupByStatus) {
        return (
            <div className="border-t border-[#e6e9ef] bg-white px-6 py-12 text-center text-sm text-[#676879] dark:border-[#2f3347] dark:bg-[#1a1b2e] dark:text-slate-400">
                {emptyMessage}
            </div>
        );
    }

    const tableMinWidth = fitWidth
        ? 'table-fixed'
        : variant === 'masterlist'
          ? 'min-w-[64rem]'
          : 'min-w-[108rem]';
    const tableOverflowClass = fitWidth
        ? 'overflow-x-hidden'
        : 'overflow-x-auto';

    return (
        <>
            <div className="min-w-0 max-w-full bg-white dark:bg-[#1a1b2e]">
                {groupByStatus ? (
                    statusGroups.map((group) => (
                        <JobBoardStatusSection
                            key={group.status}
                            status={group.status}
                            label={group.label}
                            jobs={group.jobs}
                            listSection={group.listSection}
                            collapsed={collapsedStatuses.has(group.status)}
                            onToggle={() =>
                                toggleStatusSection(group.status)
                            }
                            showFilesInTotal={showFilesInTotal}
                            getJobHref={getJobHref}
                            setCommentJob={setCommentJob}
                            onPriorityUpdated={onPriorityUpdated}
                            hideStatus={hideStatus}
                            renderActions={renderActions}
                            variant={variant}
                            fitWidth={fitWidth}
                            assignableUsers={assignableUsers}
                            statusOptions={statusOptions}
                            onOpenAssignment={setAssignmentTarget}
                        />
                    ))
                ) : (
                    <div
                        className={
                            'min-w-0 max-w-full ' + tableOverflowClass
                        }
                    >
                        <table
                            className={
                                'w-full border-collapse text-left ' +
                                tableMinWidth
                            }
                        >
                            <JobBoardTableHead
                                showFilesInTotal={showFilesInTotal}
                                hideStatus={hideStatus}
                                showActions={Boolean(renderActions)}
                                variant={variant}
                            />
                            <JobBoardTableBody
                                jobs={jobs}
                                getJobHref={getJobHref}
                                showFilesInTotal={showFilesInTotal}
                                hideStatus={hideStatus}
                                setCommentJob={setCommentJob}
                                onPriorityUpdated={onPriorityUpdated}
                                renderActions={renderActions}
                                variant={variant}
                                fitWidth={fitWidth}
                                assignableUsers={assignableUsers}
                                statusOptions={statusOptions}
                                onOpenAssignment={setAssignmentTarget}
                            />
                        </table>
                    </div>
                )}
            </div>

            <JobBoardCommentsModal
                show={commentJob != null}
                job={commentJob}
                onClose={() => setCommentJob(null)}
                onCommentsUpdated={onCommentsUpdated}
            />

            <JobBoardAssignmentModal
                show={assignmentTarget != null}
                job={assignmentTarget?.job ?? null}
                role={assignmentTarget?.role ?? 'drafting'}
                slot={assignmentTarget?.slot ?? 0}
                assignment={assignmentTarget?.assignment ?? null}
                assignableUsers={assignableUsers}
                onClose={() => setAssignmentTarget(null)}
                onSaved={onAssignmentsUpdated}
            />
        </>
    );
}
