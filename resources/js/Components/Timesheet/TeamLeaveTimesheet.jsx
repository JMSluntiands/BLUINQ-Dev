import SearchableSelect from '@/Components/SearchableSelect';
import UserAvatar from '@/Components/UserAvatar';
import {
    CalendarDaysIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    GiftIcon,
} from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';
import { useEffect, useMemo } from 'react';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

function dateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function parseMonth(value) {
    const [year, month] = (value || '').split('-').map(Number);
    if (!year || !month) {
        return new Date();
    }
    return new Date(year, month - 1, 1);
}

function formatMonthLabel(value) {
    return parseMonth(value).toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
    });
}

function formatDisplayDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function shiftMonth(value, direction) {
    const date = parseMonth(value);
    date.setMonth(date.getMonth() + direction);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

function buildMonthDays(monthValue) {
    const monthStart = parseMonth(monthValue);
    const year = monthStart.getFullYear();
    const month = monthStart.getMonth();

    const gridStart = new Date(year, month, 1);
    gridStart.setDate(gridStart.getDate() - gridStart.getDay());

    const gridEnd = new Date(year, month + 1, 0);
    gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));

    const days = [];
    let current = new Date(gridStart);

    while (current <= gridEnd) {
        const weekdayIndex = current.getDay();
        days.push({
            key: dateKey(current),
            date: new Date(current),
            label: current.getDate(),
            weekday: WEEKDAYS[weekdayIndex],
            isCurrentMonth: current.getMonth() === month,
            isWeekend: weekdayIndex === 0 || weekdayIndex === 6,
        });
        current = addDays(current, 1);
    }

    return days;
}

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
                (!day.isCurrentMonth
                    ? 'bg-slate-50/40 dark:bg-slate-900/30'
                    : day.isWeekend
                      ? 'bg-slate-50/90 dark:bg-slate-800/40'
                      : 'bg-white dark:bg-slate-900/90') +
                (highlight ? ' bg-sky-50/80 dark:bg-sky-500/10' : '')
            }
        >
            {!mark && day.isCurrentMonth && (
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

export default function TeamLeaveTimesheet({
    users = [],
    teamMembers = [],
    calendarMonth,
    filters = {},
}) {
    const today = new Date();
    const todayKey = dateKey(today);
    const activeMonth =
        calendarMonth ||
        `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const selectedUserId = filters.user_id ?? 'all';

    const userFilterOptions = useMemo(
        () => [
            { value: 'all', label: 'All team' },
            ...teamMembers.map((member) => ({
                value: String(member.id),
                label: member.name,
                description: member.email ?? undefined,
            })),
        ],
        [teamMembers],
    );

    const days = useMemo(() => buildMonthDays(activeMonth), [activeMonth]);

    const visibleUsers = useMemo(() => {
        if (selectedUserId === 'all') {
            return users;
        }

        return users.filter((user) => user.id === Number(selectedUserId));
    }, [users, selectedUserId]);

    const rangeLabel = useMemo(() => {
        if (days.length === 0) {
            return formatMonthLabel(activeMonth);
        }

        return `${formatDisplayDate(days[0].date)} to ${formatDisplayDate(days[days.length - 1].date)}`;
    }, [days, activeMonth]);

    const reload = (next = {}) => {
        router.get(
            route('timesheet.index'),
            {
                calendar_month: activeMonth,
                user_id: selectedUserId,
                ...next,
            },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['leaveCalendar', 'calendarMonth', 'filters', 'teamMembers'],
            },
        );
    };

    useEffect(() => {
        const interval = window.setInterval(() => {
            if (document.visibilityState !== 'visible') {
                return;
            }

            router.reload({
                only: ['leaveCalendar', 'calendarMonth', 'filters', 'teamMembers'],
                preserveScroll: true,
                preserveState: true,
            });
        }, 15000);

        return () => window.clearInterval(interval);
    }, []);

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700/70 dark:bg-slate-900/90">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-5">
                <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <span className="font-medium">User</span>
                        <SearchableSelect
                            value={String(selectedUserId)}
                            onChange={(userId) => reload({ user_id: userId })}
                            options={userFilterOptions}
                            placeholder="Search team member..."
                        />
                    </label>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() =>
                            reload({
                                calendar_month: shiftMonth(activeMonth, -1),
                            })
                        }
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                        aria-label="Previous month"
                    >
                        <ChevronLeftIcon className="h-4 w-4" aria-hidden />
                    </button>
                    <div className="text-center">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {formatMonthLabel(activeMonth)}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {rangeLabel}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() =>
                            reload({
                                calendar_month: shiftMonth(activeMonth, 1),
                            })
                        }
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                        aria-label="Next month"
                    >
                        <ChevronRightIcon className="h-4 w-4" aria-hidden />
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
                            <p className="mt-0.5 text-[10px] text-slate-400">
                                Leave credits
                            </p>
                        </div>
                        {days.map((day) => (
                            <div
                                key={`head-${day.key}`}
                                className={
                                    'flex min-w-[2.75rem] shrink-0 flex-col items-center justify-center border-r border-slate-100 px-1 py-2 dark:border-slate-800 ' +
                                    (!day.isCurrentMonth
                                        ? 'bg-slate-50/40 dark:bg-slate-900/30'
                                        : day.isWeekend
                                          ? 'bg-slate-50/90 dark:bg-slate-800/40'
                                          : 'bg-white dark:bg-slate-900/90') +
                                    (day.key === todayKey
                                        ? ' bg-sky-50/80 dark:bg-sky-500/10'
                                        : '')
                                }
                            >
                                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                    {day.weekday}
                                </span>
                                <span
                                    className={
                                        'mt-0.5 text-xs font-semibold ' +
                                        (day.key === todayKey
                                            ? 'flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 text-white'
                                            : day.isCurrentMonth
                                              ? 'text-slate-700 dark:text-slate-200'
                                              : 'text-slate-400 dark:text-slate-500')
                                    }
                                >
                                    {day.label}
                                </span>
                            </div>
                        ))}
                    </div>

                    {visibleUsers.length === 0 ? (
                        <div className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                            No team members to display.
                        </div>
                    ) : (
                        visibleUsers.map((user) => (
                            <div
                                key={user.id}
                                className="flex border-b border-slate-100 last:border-b-0 dark:border-slate-800"
                            >
                                <div className="sticky left-0 z-10 flex w-52 shrink-0 items-center gap-3 border-r border-slate-100 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                                    <UserAvatar
                                        user={user}
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
                                        mark={user.marks?.[day.key]}
                                        highlight={day.key === todayKey}
                                    />
                                ))}
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-5">
                <div className="flex flex-wrap gap-4 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1.5">
                        <CalendarDaysIcon className="h-3.5 w-3.5 text-slate-400" />
                        Approved leave
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <CoffeeIcon className="h-3.5 w-3.5 text-emerald-500" />
                        Remote work
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <GiftIcon className="h-3.5 w-3.5 text-pink-500" />
                        Birthday
                    </span>
                </div>
            </div>
        </div>
    );
}
