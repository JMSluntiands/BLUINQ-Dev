import UserAvatar from '@/Components/UserAvatar';
import {
    CalendarDaysIcon,
    ChevronDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    FunnelIcon,
    GiftIcon,
    PlusIcon,
    UserMinusIcon,
} from '@heroicons/react/24/outline';
import { useMemo, useState } from 'react';

function CoffeeIcon({ className = 'h-3.5 w-3.5' }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden
        >
            <path d="M5 8h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8z" />
            <path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16" />
            <path d="M7 4l1 2M12 4l1 2M16 4l1 2" strokeLinecap="round" />
        </svg>
    );
}

function addDays(date, days) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
}

function formatDisplayDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function dateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function buildCalendarDays(start, end) {
    const days = [];
    let current = new Date(start);

    while (current <= end) {
        const weekdayIndex = current.getDay();
        days.push({
            key: dateKey(current),
            date: new Date(current),
            label: current.getDate(),
            weekday: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][
                weekdayIndex
            ],
            isWeekend: weekdayIndex === 0 || weekdayIndex === 6,
        });
        current = addDays(current, 1);
    }

    return days;
}

const SAMPLE_CALENDAR_USERS = [
    {
        id: 1,
        name: 'Greg Morrison',
        balance: 13,
        marks: {
            '2026-03-12': 'leave',
            '2026-03-18': 'birthday',
        },
    },
    {
        id: 2,
        name: 'Jenny Ellis',
        balance: 11,
        marks: {
            '2026-03-09': 'remote',
            '2026-03-22': 'leave',
        },
    },
    {
        id: 3,
        name: 'Samuel Ortiz',
        balance: 8,
        marks: {
            '2026-03-15': 'birthday',
            '2026-03-28': 'leave',
        },
    },
    {
        id: 4,
        name: 'Joem Danganan',
        balance: -36,
        marks: Object.fromEntries(
            Array.from({ length: 8 }, (_, index) => {
                const day = 10 + index;
                return [`2026-03-${String(day).padStart(2, '0')}`, 'remote'];
            }),
        ),
    },
    {
        id: 5,
        name: 'Maria Santos',
        balance: 5,
        marks: {
            '2026-03-08': 'leave',
            '2026-04-02': 'birthday',
        },
    },
    {
        id: 6,
        name: 'Kevin Tran',
        balance: 19,
        marks: {
            '2026-03-20': 'remote',
            '2026-03-25': 'remote',
        },
    },
    {
        id: 7,
        name: 'Patricia Cruz',
        balance: 2,
        marks: {
            '2026-03-14': 'birthday',
            '2026-04-05': 'leave',
        },
    },
];

function MarkBadge({ type }) {
    if (type === 'leave') {
        return (
            <span className="inline-flex h-7 w-8 items-center justify-center rounded-md bg-slate-400 text-white dark:bg-slate-500">
                <CalendarDaysIcon className="h-3.5 w-3.5" aria-hidden />
            </span>
        );
    }

    if (type === 'birthday') {
        return (
            <span className="inline-flex h-7 w-8 items-center justify-center rounded-md bg-emerald-500 text-white">
                <GiftIcon className="h-3.5 w-3.5" aria-hidden />
            </span>
        );
    }

    if (type === 'remote') {
        return (
            <span className="inline-flex h-7 w-8 items-center justify-center rounded-md bg-emerald-500 text-white">
                <CoffeeIcon />
            </span>
        );
    }

    return null;
}

function CalendarCell({ day, mark, highlight }) {
    return (
        <div
            className={
                'flex h-14 min-w-[2.75rem] shrink-0 flex-col items-center justify-start border-r border-slate-100 px-1 pt-1.5 dark:border-slate-800 ' +
                (day.isWeekend
                    ? 'bg-slate-50/90 dark:bg-slate-800/40'
                    : 'bg-white dark:bg-slate-900/90')
            }
        >
            {!mark && (
                <span
                    className={
                        'text-xs font-medium ' +
                        (highlight
                            ? 'flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 text-white'
                            : 'text-slate-400 dark:text-slate-500')
                    }
                >
                    {day.label}
                </span>
            )}
            {mark && (
                <div className="mt-0.5">
                    <MarkBadge type={mark} />
                </div>
            )}
        </div>
    );
}

export default function DashboardCalendar() {
    const [rangeStart, setRangeStart] = useState(new Date(2026, 2, 6));
    const [rangeEnd, setRangeEnd] = useState(new Date(2026, 3, 7));

    const days = useMemo(
        () => buildCalendarDays(rangeStart, rangeEnd),
        [rangeStart, rangeEnd],
    );

    const highlightKey = '2026-03-11';

    const shiftRange = (direction) => {
        const dayCount = Math.round(
            (rangeEnd.getTime() - rangeStart.getTime()) / 86400000,
        ) + 1;
        setRangeStart((current) => addDays(current, direction * dayCount));
        setRangeEnd((current) => addDays(current, direction * dayCount));
    };

    return (
        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700/70 dark:bg-slate-900/90">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-5">
                <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                    <FunnelIcon className="h-4 w-4" aria-hidden />
                    Filter
                </button>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => shiftRange(-1)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                        aria-label="Previous date range"
                    >
                        <ChevronLeftIcon className="h-4 w-4" aria-hidden />
                    </button>
                    <span className="min-w-[12rem] text-center text-sm font-medium text-slate-700 dark:text-slate-200">
                        {formatDisplayDate(rangeStart)} to{' '}
                        {formatDisplayDate(rangeEnd)}
                    </span>
                    <button
                        type="button"
                        onClick={() => shiftRange(1)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                        aria-label="Next date range"
                    >
                        <ChevronRightIcon className="h-4 w-4" aria-hidden />
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                        <UserMinusIcon className="h-4 w-4" aria-hidden />
                        Absent today
                    </button>
                    <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500"
                    >
                        <PlusIcon className="h-4 w-4" aria-hidden />
                        Create request
                        <ChevronDownIcon className="h-4 w-4" aria-hidden />
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <div className="min-w-max">
                    <div className="flex border-b border-slate-100 dark:border-slate-800">
                        <div className="sticky left-0 z-20 w-52 shrink-0 border-r border-slate-100 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Team
                            </p>
                        </div>
                        {days.map((day) => (
                            <div
                                key={`head-${day.key}`}
                                className={
                                    'flex min-w-[2.75rem] shrink-0 flex-col items-center justify-center border-r border-slate-100 px-1 py-2 dark:border-slate-800 ' +
                                    (day.isWeekend
                                        ? 'bg-slate-50/90 dark:bg-slate-800/40'
                                        : 'bg-white dark:bg-slate-900/90')
                                }
                            >
                                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                    {day.weekday}
                                </span>
                                <span
                                    className={
                                        'mt-0.5 text-xs font-semibold ' +
                                        (day.key === highlightKey
                                            ? 'flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 text-white'
                                            : 'text-slate-700 dark:text-slate-200')
                                    }
                                >
                                    {day.label}
                                </span>
                            </div>
                        ))}
                    </div>

                    {SAMPLE_CALENDAR_USERS.map((user) => (
                        <div
                            key={user.id}
                            className="flex border-b border-slate-100 last:border-b-0 dark:border-slate-800"
                        >
                            <div className="sticky left-0 z-10 flex w-52 shrink-0 items-center gap-3 border-r border-slate-100 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                                <UserAvatar
                                    user={{ name: user.name }}
                                    className="h-9 w-9 text-xs"
                                    ringClassName="ring-2 ring-white dark:ring-slate-800"
                                />
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                                        {user.name}
                                    </p>
                                    <p
                                        className={
                                            'text-xs font-semibold ' +
                                            (user.balance < 0
                                                ? 'text-rose-500'
                                                : 'text-emerald-600 dark:text-emerald-400')
                                        }
                                    >
                                        {user.balance}
                                    </p>
                                </div>
                            </div>

                            {days.map((day) => (
                                <CalendarCell
                                    key={`${user.id}-${day.key}`}
                                    day={day}
                                    mark={user.marks[day.key]}
                                    highlight={day.key === highlightKey}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
