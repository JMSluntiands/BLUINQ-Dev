import {
    JOB_STATUS_LABELS,
    JOB_STATUS_STYLES,
    TAG_PILL_CLASS,
    staffBadgeColor,
} from '@/Components/JobBoard/jobBoardStyles';
import JobBoardCommentsModal, {
    JobBoardCommentButton,
} from '@/Components/JobBoard/JobBoardCommentsModal';
import Checkbox from '@/Components/Checkbox';
import { ChevronRightIcon, FlagIcon, PlusIcon } from '@heroicons/react/24/outline';
import { FlagIcon as FlagIconSolid } from '@heroicons/react/24/solid';
import { Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

const DRAFTING_SLOTS = 3;
const CHECKING_SLOTS = 2;

/**
 * @typedef {{ initials: string; hours?: string | null }} StaffAssignment
 * @typedef {{ color: string; weight: number }} ProgressSegment
 * @typedef {{
 *   id: number;
 *   job: string;
 *   job_no: string;
 *   builder: string;
 *   category: string;
 *   house_type: string;
 *   date_in: string;
 *   eta: string;
 *   progress_segments?: ProgressSegment[];
 *   drafting: (StaffAssignment | null)[];
 *   checking: (StaffAssignment | null)[];
 *   total_hours?: number | null;
 *   area?: string | null;
 *   date_out?: string | null;
 *   status: keyof typeof JOB_STATUS_LABELS;
 *   status_label?: string;
 *   is_priority?: boolean;
 *   vo_hours?: string | null;
 *   files_count?: number;
 *   comments_count?: number;
 *   has_comments?: boolean;
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

function EmptyStaffSlot() {
    return (
        <span className="inline-block h-6 w-6 rounded bg-[#e6e9ef] dark:bg-[#252838]" />
    );
}

function StaffSlot({ assignment }) {
    if (!assignment) {
        return <EmptyStaffSlot />;
    }

    return (
        <div className="flex items-center gap-1">
            <span
                className={
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white ' +
                    staffBadgeColor(assignment.initials)
                }
                title={assignment.initials}
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

function FooterTag({ label, count }) {
    return (
        <span className="inline-flex max-w-full items-center gap-1.5 rounded-md bg-[#e6f4ff] px-2 py-1 text-[11px] font-medium text-[#0073ea] dark:bg-[#2c5282] dark:text-blue-100">
            <span className="truncate">{label}</span>
            {count > 1 && (
                <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-[#0073ea]/15 px-1 text-[10px] font-semibold text-[#0073ea] dark:bg-white/15 dark:text-blue-50">
                    +{count - 1}
                </span>
            )}
        </span>
    );
}

function ColumnSumCell({ hours = 0, barClass = 'bg-slate-600' }) {
    const formatted =
        hours % 1 === 0
            ? `${hours} h`
            : `${Math.round(hours * 10) / 10} h`;

    return (
        <div className="flex min-w-[3.5rem] flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
                <span
                    className={`h-2 w-7 shrink-0 rounded-sm ${barClass}`}
                    aria-hidden
                />
                <span className="whitespace-nowrap text-[11px] tabular-nums text-[#323338] dark:text-slate-300">
                    {formatted}
                </span>
            </div>
            <span className="text-[10px] text-[#676879] dark:text-slate-500">sum</span>
        </div>
    );
}

function ProgressSumCell({ percent = 0 }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-[11px] tabular-nums text-[#323338] dark:text-slate-300">
                {percent}%
            </span>
            <span className="text-[10px] text-[#676879] dark:text-slate-500">sum</span>
        </div>
    );
}

const SUMMARY_BAR_CLASSES = [
    'bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400',
    'bg-cyan-500',
    'bg-gradient-to-r from-orange-400 to-amber-300',
    'bg-slate-600',
    'bg-slate-600',
];

const thClass =
    'whitespace-nowrap border-r border-[#e6e9ef] px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-[#676879] last:border-r-0 dark:border-[#2f3347] dark:text-slate-400';

const tdClass =
    'border-r border-[#e6e9ef] px-2 py-1.5 align-middle text-xs text-[#323338] last:border-r-0 dark:border-[#2a2d42] dark:text-slate-200';

const checkboxClass =
    'border-[#c5c7d0] bg-white text-[#0073ea] focus:ring-[#0073ea] focus:ring-offset-white dark:border-slate-600 dark:bg-[#1a1b2e] dark:text-[#1890ff] dark:focus:ring-[#1890ff] dark:focus:ring-offset-[#1a1b2e]';

function parseHours(value) {
    if (!value) {
        return 0;
    }

    return parseFloat(String(value).replace(/[^\d.]/g, '')) || 0;
}

/**
 * @param {{
 *   jobs?: JobBoardRow[];
 *   emptyMessage?: string;
 *   getJobHref?: (row: JobBoardRow) => string;
 *   showFilesInTotal?: boolean;
 *   onCommentsUpdated?: () => void;
 *   onPriorityUpdated?: () => void;
 *   showAddJobRow?: boolean;
 * }} props
 */
export default function JobBoardGrid({
    jobs = [],
    emptyMessage = 'No jobs to display.',
    getJobHref,
    showFilesInTotal = false,
    onCommentsUpdated,
    onPriorityUpdated,
    showAddJobRow = true,
}) {
    const [commentJob, setCommentJob] = useState(null);
    const [selectedIds, setSelectedIds] = useState(() => new Set());

    const allSelected =
        jobs.length > 0 && jobs.every((job) => selectedIds.has(job.id));

    const toggleAll = () => {
        if (allSelected) {
            setSelectedIds(new Set());
            return;
        }

        setSelectedIds(new Set(jobs.map((job) => job.id)));
    };

    const toggleRow = (id) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const footerStats = useMemo(() => {
        const builders = {};
        const categories = {};
        const houseTypes = {};
        const draftingSlotHours = Array.from(
            { length: DRAFTING_SLOTS },
            () => 0,
        );
        const checkingSlotHours = Array.from(
            { length: CHECKING_SLOTS },
            () => 0,
        );
        let progressWeight = 0;

        for (const job of jobs) {
            builders[job.builder] = (builders[job.builder] ?? 0) + 1;
            categories[job.category] = (categories[job.category] ?? 0) + 1;
            houseTypes[job.house_type] = (houseTypes[job.house_type] ?? 0) + 1;

            (job.drafting ?? []).forEach((slot, index) => {
                if (slot?.hours && index < DRAFTING_SLOTS) {
                    draftingSlotHours[index] += parseHours(slot.hours);
                }
            });
            (job.checking ?? []).forEach((slot, index) => {
                if (slot?.hours && index < CHECKING_SLOTS) {
                    checkingSlotHours[index] += parseHours(slot.hours);
                }
            });

            const segments = job.progress_segments ?? [];
            progressWeight += segments.reduce((sum, seg) => sum + seg.weight, 0);
        }

        const topBuilder = Object.entries(builders).sort(
            (a, b) => b[1] - a[1],
        )[0];
        const topCategory = Object.entries(categories).sort(
            (a, b) => b[1] - a[1],
        )[0];
        const topHouseType = Object.entries(houseTypes).sort(
            (a, b) => b[1] - a[1],
        )[0];

        const progressPercent =
            jobs.length > 0
                ? Math.round((progressWeight / (jobs.length * 5)) * 100)
                : 0;

        const slotHours = [
            ...draftingSlotHours,
            ...checkingSlotHours,
        ];

        return {
            topBuilder,
            topCategory,
            topHouseType,
            slotHours,
            progressPercent: Math.min(progressPercent, 100),
        };
    }, [jobs]);

    if (!jobs.length) {
        return (
            <div className="border-t border-[#e6e9ef] bg-white px-6 py-12 text-center text-sm text-[#676879] dark:border-[#2f3347] dark:bg-[#1a1b2e] dark:text-slate-400">
                {emptyMessage}
            </div>
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
        <>
            <div className="bg-white dark:bg-[#1a1b2e]">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[90rem] border-collapse text-left">
                        <thead className="bg-[#fafbfc] dark:bg-[#151622]">
                            <tr>
                                <th className={thClass + ' w-8'}>
                                    <Checkbox
                                        checked={allSelected}
                                        onChange={toggleAll}
                                        className={checkboxClass + ' dark:focus:ring-offset-[#151622]'}
                                        aria-label="Select all jobs"
                                    />
                                </th>
                                <th className={thClass}>Job</th>
                                <th className={thClass + ' w-10'} />
                                <th className={thClass}>Job No.</th>
                                <th className={thClass}>Builder Name</th>
                                <th className={thClass}>Category</th>
                                <th className={thClass}>House Type</th>
                                <th className={thClass}>Date In</th>
                                <th className={thClass}>ETA</th>
                                <th className={thClass}>Progress</th>
                                {draftingHeaders}
                                {checkingHeaders}
                                <th className={thClass}>
                                    {showFilesInTotal ? 'Files' : 'Total'}
                                </th>
                                <th className={thClass}>Area</th>
                                <th className={thClass}>Date Out</th>
                                <th className={thClass}>Status</th>
                                <th className={thClass + ' w-10'}>Priority</th>
                                <th className={thClass}>VO hrs</th>
                                <th className={thClass}>IN</th>
                            </tr>
                        </thead>
                        <tbody>
                            {showAddJobRow && (
                                <tr className="border-b border-[#e6e9ef] bg-[#fafbfc] dark:border-[#2a2d42] dark:bg-[#1a1b2e]">
                                    <td
                                        className={
                                            tdClass +
                                            ' relative border-l-[3px] border-l-emerald-500'
                                        }
                                    >
                                        <Checkbox
                                            checked={false}
                                            readOnly
                                            className={checkboxClass}
                                            aria-hidden
                                            tabIndex={-1}
                                        />
                                    </td>
                                    <td className={tdClass} colSpan={3}>
                                        <Link
                                            href={route(
                                                'job.drafting-request-form',
                                            )}
                                            className="inline-flex items-center gap-1 text-sm font-medium text-[#676879] transition hover:text-[#0073ea] dark:text-slate-400 dark:hover:text-[#1890ff]"
                                        >
                                            <PlusIcon
                                                className="h-4 w-4"
                                                aria-hidden
                                            />
                                            Add job
                                        </Link>
                                    </td>
                                    <td className={tdClass} colSpan={18} />
                                </tr>
                            )}
                            {jobs.map((job, rowIndex) => {
                                const draftingSlots = job.drafting ?? [];
                                const checkingSlots = job.checking ?? [];

                                return (
                                    <tr
                                        key={job.id}
                                        className={
                                            'border-b border-[#e6e9ef] transition-colors hover:bg-[#f0f4ff] dark:border-[#2a2d42] dark:hover:bg-[#22243a] ' +
                                            (job.is_priority
                                                ? 'bg-amber-50/70 dark:bg-[#2a1f2e]'
                                                : rowIndex % 2 === 1
                                                  ? 'bg-[#fafbfc] dark:bg-[#1e1f32]'
                                                  : 'bg-white dark:bg-[#1a1b2e]')
                                        }
                                    >
                                        <td className={tdClass}>
                                            <Checkbox
                                                checked={selectedIds.has(job.id)}
                                                onChange={() => toggleRow(job.id)}
                                                className={checkboxClass}
                                                aria-label={`Select ${job.job}`}
                                            />
                                        </td>
                                        <td className={tdClass}>
                                            <div className="flex min-w-[14rem] items-center gap-1.5">
                                                <ChevronRightIcon
                                                    className="h-3.5 w-3.5 shrink-0 text-[#676879] dark:text-slate-500"
                                                    aria-hidden
                                                />
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
                                                onClick={() =>
                                                    setCommentJob(job)
                                                }
                                            />
                                        </td>
                                        <td className={tdClass + ' tabular-nums'}>
                                            {getJobHref ? (
                                                <Link
                                                    href={getJobHref(job)}
                                                    className="font-semibold text-[#0073ea] transition hover:text-[#0060c4] hover:underline dark:text-[#1890ff] dark:hover:text-[#1478e0]"
                                                >
                                                    {job.job_no}
                                                </Link>
                                            ) : (
                                                <span className="text-[#0073ea] dark:text-[#1890ff]">
                                                    {job.job_no}
                                                </span>
                                            )}
                                        </td>
                                        <td className={tdClass}>
                                            <TagPill title={job.builder}>
                                                {job.builder}
                                            </TagPill>
                                        </td>
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
                                            <TagPill title={job.house_type}>
                                                {job.house_type}
                                            </TagPill>
                                        </td>
                                        <td
                                            className={
                                                tdClass +
                                                ' whitespace-nowrap tabular-nums'
                                            }
                                        >
                                            {job.date_in}
                                        </td>
                                        <td
                                            className={
                                                tdClass +
                                                ' whitespace-nowrap tabular-nums'
                                            }
                                        >
                                            {job.eta}
                                        </td>
                                        <td className={tdClass}>
                                            <ProgressCell
                                                segments={
                                                    job.progress_segments
                                                }
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
                                            {showFilesInTotal
                                                ? (job.files_count ?? 0)
                                                : job.total_hours != null
                                                  ? `${job.total_hours} h`
                                                  : '—'}
                                        </td>
                                        <td className={tdClass + ' text-[#676879] dark:text-slate-400'}>
                                            {job.area ?? '—'}
                                        </td>
                                        <td
                                            className={
                                                tdClass +
                                                ' whitespace-nowrap tabular-nums text-[#676879] dark:text-slate-400'
                                            }
                                        >
                                            {job.date_out ?? '—'}
                                        </td>
                                        <td className={tdClass}>
                                            <StatusPill
                                                status={job.status}
                                                label={job.status_label}
                                            />
                                        </td>
                                        <td className={tdClass}>
                                            <PriorityFlag
                                                job={job}
                                                onToggled={onPriorityUpdated}
                                            />
                                        </td>
                                        <td
                                            className={
                                                tdClass +
                                                ' whitespace-nowrap tabular-nums text-[#676879] dark:text-slate-400'
                                            }
                                        >
                                            {job.vo_hours ?? '—'}
                                        </td>
                                        <td className={tdClass + ' text-[#676879] dark:text-slate-400'}>
                                            —
                                        </td>
                                    </tr>
                                );
                            })}
                            <tr className="border-t border-[#e6e9ef] bg-[#fafbfc] dark:border-[#2f3347] dark:bg-[#151622]">
                                <td className={tdClass} />
                                <td className={tdClass} colSpan={3} />
                                <td className={tdClass}>
                                    {footerStats.topBuilder && (
                                        <FooterTag
                                            label={footerStats.topBuilder[0]}
                                            count={footerStats.topBuilder[1]}
                                        />
                                    )}
                                </td>
                                <td className={tdClass}>
                                    {footerStats.topCategory && (
                                        <FooterTag
                                            label={footerStats.topCategory[0]}
                                            count={footerStats.topCategory[1]}
                                        />
                                    )}
                                </td>
                                <td className={tdClass}>
                                    {footerStats.topHouseType && (
                                        <FooterTag
                                            label={footerStats.topHouseType[0]}
                                            count={
                                                footerStats.topHouseType[1]
                                            }
                                        />
                                    )}
                                </td>
                                <td className={tdClass} />
                                <td className={tdClass} />
                                <td className={tdClass}>
                                    <ProgressSumCell
                                        percent={footerStats.progressPercent}
                                    />
                                </td>
                                {footerStats.slotHours.map((hours, index) => (
                                    <td
                                        key={`summary-slot-${index}`}
                                        className={tdClass}
                                    >
                                        <ColumnSumCell
                                            hours={hours}
                                            barClass={
                                                SUMMARY_BAR_CLASSES[index] ??
                                                'bg-slate-600'
                                            }
                                        />
                                    </td>
                                ))}
                                <td className={tdClass} colSpan={7} />
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <JobBoardCommentsModal
                show={commentJob != null}
                job={commentJob}
                onClose={() => setCommentJob(null)}
                onCommentsUpdated={onCommentsUpdated}
            />
        </>
    );
}
