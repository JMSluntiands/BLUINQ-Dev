import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';

const DAY_LETTERS = ['M', 'T', 'W', 'TH', 'F', 'SA', 'SU'];
const MONTH_ABBREVS = [
    'JAN',
    'FEB',
    'MAR',
    'APR',
    'MAY',
    'JUN',
    'JUL',
    'AUG',
    'SEP',
    'OCT',
    'NOV',
    'DEC',
];
const MONTH_NAMES = [
    'JANUARY',
    'FEBRUARY',
    'MARCH',
    'APRIL',
    'MAY',
    'JUNE',
    'JULY',
    'AUGUST',
    'SEPTEMBER',
    'OCTOBER',
    'NOVEMBER',
    'DECEMBER',
];
const STANDARD_HOURS = 8;

function toLocalDate(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseIsoDate(value) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
}

function startOfWeek(date) {
    const d = toLocalDate(date);
    const weekday = d.getDay();
    const diff = weekday === 0 ? -6 : 1 - weekday;
    d.setDate(d.getDate() + diff);
    return d;
}

function addDays(date, days) {
    const d = toLocalDate(date);
    d.setDate(d.getDate() + days);
    return d;
}

function toIsoDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function dateKey(date) {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function getWeekDays(weekStart) {
    const base = toLocalDate(weekStart);
    return Array.from({ length: 7 }, (_, index) => addDays(base, index));
}

function formatDayHeader(date, dayIndex) {
    return {
        letter: DAY_LETTERS[dayIndex],
        dateLabel: `${date.getDate()}-${MONTH_ABBREVS[date.getMonth()]}`,
    };
}

function formatWeekRange(days) {
    const start = days[0];
    const end = days[6];
    const startMonth = MONTH_NAMES[start.getMonth()];
    const endMonth = MONTH_NAMES[end.getMonth()];

    if (startMonth === endMonth) {
        return `« ${startMonth} ${start.getDate()} - ${end.getDate()} »`;
    }

    return `« ${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()} »`;
}

function calcOvertime(hours) {
    return hours.reduce(
        (sum, value) => sum + Math.max(0, Number(value) - STANDARD_HOURS),
        0,
    );
}

function calcDayTotals(rows) {
    return Array.from({ length: 7 }, (_, dayIndex) =>
        rows.reduce((sum, row) => sum + Number(row.hours[dayIndex] || 0), 0),
    );
}

function clampHour(value) {
    const num = Number(value);
    if (Number.isNaN(num) || num < 0) {
        return 0;
    }
    if (num > 24) {
        return 24;
    }
    return Math.round(num * 2) / 2;
}

function ApprovalCell({ status, canApprove, onApprove, onDecline }) {
    if (status === 'approved') {
        return (
            <span className="text-xs font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                Approved
            </span>
        );
    }

    if (status === 'declined') {
        return (
            <span className="text-xs font-bold uppercase tracking-wide text-rose-600 dark:text-rose-400">
                Declined
            </span>
        );
    }

    if (!canApprove) {
        return (
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-gray-500">
                Pending
            </span>
        );
    }

    return (
        <div className="flex flex-col items-center gap-1">
            <button
                type="button"
                onClick={onApprove}
                className="text-[10px] font-bold uppercase tracking-wide text-emerald-600 transition hover:text-emerald-500 dark:text-emerald-400"
            >
                Approve
            </button>
            <span className="text-[10px] text-slate-300 dark:text-gray-600">
                /
            </span>
            <button
                type="button"
                onClick={onDecline}
                className="text-[10px] font-bold uppercase tracking-wide text-rose-600 transition hover:text-rose-500 dark:text-rose-400"
            >
                Decline
            </button>
        </div>
    );
}

function AddTaskMenu({ availableRevisions, standardTasks, weekStart, onClose }) {
    const [revisionId, setRevisionId] = useState('');

    const addStandardTask = (taskType) => {
        router.post(
            route('profile.weekly-timesheet.entries.store'),
            {
                week_start: weekStart,
                task_type: taskType,
            },
            {
                preserveScroll: true,
                onSuccess: onClose,
            },
        );
    };

    const addRevisionTask = (event) => {
        event.preventDefault();
        if (!revisionId) {
            return;
        }

        router.post(
            route('profile.weekly-timesheet.entries.store'),
            {
                week_start: weekStart,
                task_type: 'revision',
                revision_id: revisionId,
            },
            {
                preserveScroll: true,
                onSuccess: onClose,
            },
        );
    };

    return (
        <div className="absolute right-0 top-full z-20 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-[#0f1729]">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Standard tasks
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(standardTasks).map(([taskType, label]) => (
                    <button
                        key={taskType}
                        type="button"
                        onClick={() => addStandardTask(taskType)}
                        className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-sky-500 hover:text-sky-600 dark:border-gray-700 dark:text-gray-200 dark:hover:border-sky-500 dark:hover:text-sky-400"
                    >
                        {label}
                    </button>
                ))}
            </div>

            <form onSubmit={addRevisionTask} className="mt-4 border-t border-slate-100 pt-3 dark:border-gray-800">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    APM revision
                </p>
                <select
                    value={revisionId}
                    onChange={(event) => setRevisionId(event.target.value)}
                    className="mt-2 block w-full rounded-lg border-slate-300 text-xs shadow-sm focus:border-sky-500 focus:ring-sky-500 dark:border-gray-700 dark:bg-slate-900 dark:text-gray-100"
                >
                    <option value="">Select revision...</option>
                    {availableRevisions.map((revision) => (
                        <option key={revision.id} value={revision.id}>
                            {revision.code}
                            {revision.job_number ? ` · ${revision.job_number}` : ''}
                        </option>
                    ))}
                </select>
                <button
                    type="submit"
                    disabled={!revisionId}
                    className="mt-2 w-full rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Add revision task
                </button>
            </form>
        </div>
    );
}

export default function WeeklyTimesheet({ weeklyTimesheet }) {
    const { auth } = usePage().props;
    const canApprove = auth.user?.role === 'admin';
    const [addMenuOpen, setAddMenuOpen] = useState(false);
    const saveTimers = useRef({});

    const weekStart = useMemo(
        () => parseIsoDate(weeklyTimesheet?.week_start ?? toIsoDate(startOfWeek(new Date()))),
        [weeklyTimesheet?.week_start],
    );
    const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
    const rows = weeklyTimesheet?.rows ?? [];
    const availableRevisions = weeklyTimesheet?.available_revisions ?? [];
    const standardTasks = weeklyTimesheet?.standard_tasks ?? {};
    const [localRows, setLocalRows] = useState(rows);
    const dayTotals = useMemo(() => calcDayTotals(localRows), [localRows]);

    useEffect(() => {
        setLocalRows(rows);
    }, [rows]);

    useEffect(() => {
        return () => {
            Object.values(saveTimers.current).forEach(clearTimeout);
        };
    }, []);

    const navigateWeek = (offsetDays) => {
        const nextWeek = addDays(weekStart, offsetDays);
        router.get(
            route('profile.edit'),
            { week: toIsoDate(nextWeek) },
            { preserveState: false, preserveScroll: true },
        );
    };

    const persistHour = (rowId, dayIndex, value) => {
        const hours = clampHour(value);
        const workDate = toIsoDate(weekDays[dayIndex]);
        const timerKey = `${rowId}-${dayIndex}`;

        setLocalRows((current) =>
            current.map((row) => {
                if (row.id !== rowId) {
                    return row;
                }

                const nextHours = [...row.hours];
                nextHours[dayIndex] = hours;

                return { ...row, hours: nextHours };
            }),
        );

        if (saveTimers.current[timerKey]) {
            clearTimeout(saveTimers.current[timerKey]);
        }

        saveTimers.current[timerKey] = setTimeout(() => {
            router.patch(
                route('profile.weekly-timesheet.hours.update', rowId),
                {
                    work_date: workDate,
                    hours,
                },
                {
                    preserveScroll: true,
                    preserveState: true,
                },
            );
        }, 400);
    };

    const updateApproval = (rowId, approval) => {
        router.patch(
            route('profile.weekly-timesheet.approval.update', rowId),
            { approval_status: approval },
            { preserveScroll: true },
        );
    };

    const removeRow = (rowId) => {
        if (!window.confirm('Remove this task row from the timesheet?')) {
            return;
        }

        router.delete(route('profile.weekly-timesheet.entries.destroy', rowId), {
            preserveScroll: true,
        });
    };

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-gray-800/80 dark:bg-[#0a0e14] dark:shadow-xl dark:shadow-black/30">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-gray-800/70 sm:px-6">
                <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.6)]" />
                    <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-500">
                        Weekly timesheet
                    </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setAddMenuOpen((open) => !open)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-sky-500 hover:text-sky-600 dark:border-gray-700 dark:text-gray-200 dark:hover:border-sky-500 dark:hover:text-sky-400"
                        >
                            <PlusIcon className="h-4 w-4" />
                            Add task
                        </button>
                        {addMenuOpen && (
                            <AddTaskMenu
                                availableRevisions={availableRevisions}
                                standardTasks={standardTasks}
                                weekStart={weeklyTimesheet.week_start}
                                onClose={() => setAddMenuOpen(false)}
                            />
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={() => navigateWeek(-7)}
                        className="rounded-md border border-slate-200 p-1 text-slate-500 transition hover:border-blue-500/40 hover:text-blue-500 dark:border-gray-700 dark:text-gray-400 dark:hover:text-blue-400"
                        aria-label="Previous week"
                    >
                        <ChevronLeftIcon className="h-4 w-4" />
                    </button>
                    <p className="min-w-[10rem] text-center text-xs font-bold uppercase tracking-[0.12em] text-slate-700 dark:text-gray-300">
                        {formatWeekRange(weekDays)}
                    </p>
                    <button
                        type="button"
                        onClick={() => navigateWeek(7)}
                        className="rounded-md border border-slate-200 p-1 text-slate-500 transition hover:border-blue-500/40 hover:text-blue-500 dark:border-gray-700 dark:text-gray-400 dark:hover:text-blue-400"
                        aria-label="Next week"
                    >
                        <ChevronRightIcon className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto px-3 py-4 sm:px-5">
                {localRows.length === 0 ? (
                    <div className="px-3 py-10 text-center text-sm text-slate-500 dark:text-gray-400">
                        No tasks for this week. Use <strong>Add task</strong> to
                        link an APM revision or add Admin, Training, or Meeting.
                    </div>
                ) : (
                    <table className="w-full min-w-[760px] border-collapse text-center text-xs">
                        <thead>
                            <tr>
                                <th className="border border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-blue-600 dark:border-gray-800 dark:bg-[#0f1729] dark:text-blue-500">
                                    Task
                                </th>
                                {weekDays.map((day, dayIndex) => {
                                    const { letter, dateLabel } = formatDayHeader(
                                        day,
                                        dayIndex,
                                    );

                                    return (
                                        <th
                                            key={dateKey(day)}
                                            className="min-w-[4.5rem] border border-slate-200 bg-slate-50 px-1.5 py-2 text-center dark:border-gray-800 dark:bg-[#0f1729]"
                                        >
                                            <span className="block whitespace-nowrap text-[10px] font-bold uppercase leading-tight tracking-wide text-blue-600 dark:text-blue-500">
                                                {dateLabel}
                                            </span>
                                            <span className="mt-1 block text-[11px] font-bold uppercase leading-none text-blue-600 dark:text-blue-500">
                                                {letter}
                                            </span>
                                        </th>
                                    );
                                })}
                                <th className="border border-slate-200 bg-slate-50 px-2 py-2.5 text-[10px] font-bold uppercase tracking-wide text-blue-600 dark:border-gray-800 dark:bg-[#0f1729] dark:text-blue-500">
                                    Overtime
                                </th>
                                <th className="border border-slate-200 bg-slate-50 px-2 py-2.5 text-[10px] font-bold uppercase tracking-wide text-blue-600 dark:border-gray-800 dark:bg-[#0f1729] dark:text-blue-500">
                                    Approval
                                </th>
                                <th className="border border-slate-200 bg-slate-50 px-2 py-2.5 dark:border-gray-800 dark:bg-[#0f1729]" />
                            </tr>
                        </thead>
                        <tbody>
                            {localRows.map((row) => {
                                const overtime = calcOvertime(row.hours);

                                return (
                                    <tr key={row.id}>
                                        <td className="border border-slate-200 px-3 py-2 text-left dark:border-gray-800">
                                            {row.is_linked && row.job_id ? (
                                                <Link
                                                    href={route(
                                                        'job.drafting.show',
                                                        row.job_id,
                                                    )}
                                                    className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
                                                >
                                                    {row.task_label}
                                                </Link>
                                            ) : row.is_project_activity && row.job_id ? (
                                                <Link
                                                    href={route(
                                                        'job.drafting.show',
                                                        row.job_id,
                                                    )}
                                                    className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
                                                >
                                                    {row.task_label}
                                                </Link>
                                            ) : (
                                                <span className="font-semibold text-slate-800 dark:text-gray-200">
                                                    {row.task_label}
                                                </span>
                                            )}
                                            <p className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-400 dark:text-gray-600">
                                                {row.is_linked
                                                    ? 'Linked from APM'
                                                    : row.is_project_activity
                                                      ? row.activity_label
                                                      : 'Standard task'}
                                            </p>
                                        </td>
                                        {row.hours.map((hour, dayIndex) => (
                                            <td
                                                key={`${row.id}-${dayIndex}`}
                                                className="border border-slate-200 p-1 dark:border-gray-800"
                                            >
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="24"
                                                    step="0.5"
                                                    value={hour}
                                                    onChange={(e) =>
                                                        persistHour(
                                                            row.id,
                                                            dayIndex,
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="w-12 rounded border-0 bg-transparent px-1 py-1 text-center text-sm font-medium text-slate-800 focus:bg-blue-500/5 focus:ring-1 focus:ring-blue-500/40 dark:text-gray-100 dark:focus:bg-blue-500/10"
                                                />
                                            </td>
                                        ))}
                                        <td className="border border-slate-200 px-2 py-2 font-semibold text-slate-800 dark:border-gray-800 dark:text-gray-200">
                                            {overtime}
                                        </td>
                                        <td className="border border-slate-200 px-2 py-2 dark:border-gray-800">
                                            <ApprovalCell
                                                status={row.approval}
                                                canApprove={canApprove}
                                                onApprove={() =>
                                                    updateApproval(
                                                        row.id,
                                                        'approved',
                                                    )
                                                }
                                                onDecline={() =>
                                                    updateApproval(
                                                        row.id,
                                                        'declined',
                                                    )
                                                }
                                            />
                                        </td>
                                        <td className="border border-slate-200 px-2 py-2 dark:border-gray-800">
                                            <button
                                                type="button"
                                                onClick={() => removeRow(row.id)}
                                                className="rounded p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                                                title="Remove task"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            <tr className="bg-slate-50/80 dark:bg-[#0f1729]/80">
                                <td className="border border-slate-200 px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600 dark:border-gray-800 dark:text-gray-400">
                                    Total hours per day
                                </td>
                                {dayTotals.map((total, index) => (
                                    <td
                                        key={`total-${index}`}
                                        className="border border-slate-200 px-2 py-2.5 font-bold text-slate-800 dark:border-gray-800 dark:text-gray-200"
                                    >
                                        {total}
                                    </td>
                                ))}
                                <td
                                    className="border border-slate-200 dark:border-gray-800"
                                    colSpan={3}
                                />
                            </tr>
                        </tbody>
                    </table>
                )}
            </div>

            <div className="border-t border-slate-100 px-5 py-3 text-[11px] text-slate-500 dark:border-gray-800/70 dark:text-gray-500 sm:px-6">
                Link APM revisions, add Admin / Training / Meeting tasks, or log
                project activities from the dashboard. Project activity rows show
                the job number with the activity underneath. Revision task hours
                sync with APM drafting hours automatically. Overtime is calculated
                for any day over {STANDARD_HOURS} hours.
                {canApprove
                    ? ' You can approve or decline entries as admin.'
                    : ' Approval is handled by admin or manager.'}
            </div>
        </div>
    );
}
