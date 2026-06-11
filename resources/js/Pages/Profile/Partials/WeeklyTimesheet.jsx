import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Link, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

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

const INITIAL_ROWS = [
    {
        id: 1,
        revision: 'B26001-01',
        jobId: null,
        hours: [3, 4, 5, 10, 10, 0, 0],
        approval: 'pending',
    },
    {
        id: 2,
        revision: 'B25123-02',
        jobId: null,
        hours: [8, 4, 2, 0, 0, 4, 0],
        approval: 'pending',
    },
    {
        id: 3,
        revision: 'B26004-01',
        jobId: null,
        hours: [0, 0, 0, 0, 0, 0, 0],
        approval: 'pending',
    },
];

function toLocalDate(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
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

export default function WeeklyTimesheet() {
    const { auth } = usePage().props;
    const canApprove = auth.user?.role === 'admin';
    const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
    const [rows, setRows] = useState(INITIAL_ROWS);

    const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
    const dayTotals = useMemo(() => calcDayTotals(rows), [rows]);

    const updateHour = (rowId, dayIndex, value) => {
        setRows((current) =>
            current.map((row) => {
                if (row.id !== rowId) {
                    return row;
                }

                const hours = [...row.hours];
                hours[dayIndex] = clampHour(value);

                return { ...row, hours };
            }),
        );
    };

    const updateApproval = (rowId, approval) => {
        setRows((current) =>
            current.map((row) =>
                row.id === rowId ? { ...row, approval } : row,
            ),
        );
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

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() =>
                            setWeekStart((current) => addDays(current, -7))
                        }
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
                        onClick={() =>
                            setWeekStart((current) => addDays(current, 7))
                        }
                        className="rounded-md border border-slate-200 p-1 text-slate-500 transition hover:border-blue-500/40 hover:text-blue-500 dark:border-gray-700 dark:text-gray-400 dark:hover:text-blue-400"
                        aria-label="Next week"
                    >
                        <ChevronRightIcon className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto px-3 py-4 sm:px-5">
                <table className="w-full min-w-[760px] border-collapse text-center text-xs">
                    <thead>
                        <tr>
                            <th className="border border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-blue-600 dark:border-gray-800 dark:bg-[#0f1729] dark:text-blue-500">
                                Revision
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
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => {
                            const overtime = calcOvertime(row.hours);

                            return (
                                <tr key={row.id}>
                                    <td className="border border-slate-200 px-3 py-2 text-left dark:border-gray-800">
                                        {row.jobId ? (
                                            <Link
                                                href={route(
                                                    'job.drafting.show',
                                                    row.jobId,
                                                )}
                                                className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
                                            >
                                                {row.revision}
                                            </Link>
                                        ) : (
                                            <span className="font-semibold text-slate-800 dark:text-gray-200">
                                                {row.revision}
                                            </span>
                                        )}
                                        <p className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-400 dark:text-gray-600">
                                            Linked from job list
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
                                                    updateHour(
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
                                colSpan={2}
                            />
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="border-t border-slate-100 px-5 py-3 text-[11px] text-slate-500 dark:border-gray-800/70 dark:text-gray-500 sm:px-6">
                Hours are entered manually per job. Overtime is auto-calculated
                for any day over {STANDARD_HOURS} hours.
                {canApprove
                    ? ' You can approve or decline entries as admin.'
                    : ' Approval is handled by admin or manager.'}
            </div>
        </div>
    );
}
