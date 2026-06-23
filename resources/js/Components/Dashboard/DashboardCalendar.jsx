import LeaveRequestModal from '@/Components/Leave/LeaveRequestModal';
import UserAvatar from '@/Components/UserAvatar';
import {
    CalendarDaysIcon,
    ChevronDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    GiftIcon,
    PlusIcon,
} from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function CoffeeIcon({ className = 'h-3 w-3' }) {
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

function shiftMonth(value, direction) {
    const date = parseMonth(value);
    date.setMonth(date.getMonth() + direction);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

function buildMonthWeeks(monthValue) {
    const monthStart = parseMonth(monthValue);
    const year = monthStart.getFullYear();
    const month = monthStart.getMonth();

    const gridStart = new Date(year, month, 1);
    gridStart.setDate(gridStart.getDate() - gridStart.getDay());

    const gridEnd = new Date(year, month + 1, 0);
    gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));

    const weeks = [];
    let current = new Date(gridStart);

    while (current <= gridEnd) {
        const week = [];
        for (let index = 0; index < 7; index += 1) {
            const dayDate = new Date(current);
            week.push({
                key: dateKey(dayDate),
                date: dayDate,
                label: dayDate.getDate(),
                isCurrentMonth: dayDate.getMonth() === month,
                isWeekend:
                    dayDate.getDay() === 0 || dayDate.getDay() === 6,
            });
            current.setDate(current.getDate() + 1);
        }
        weeks.push(week);
    }

    return weeks;
}

function markColor(type) {
    if (type === 'leave' || type === 'leave_pending') {
        return type === 'leave_pending' ? 'bg-amber-400' : 'bg-slate-400';
    }
    if (type === 'remote' || type === 'remote_pending') {
        return type === 'remote_pending' ? 'bg-amber-400' : 'bg-emerald-500';
    }
    if (type === 'birthday') {
        return 'bg-pink-500';
    }
    return 'bg-sky-500';
}

function MarkDot({ type }) {
    return (
        <span
            className={`inline-block h-2 w-2 shrink-0 rounded-full ${markColor(type)}`}
            title={type.replace('_', ' ')}
        />
    );
}

function DayMarkIcon({ type }) {
    if (type === 'birthday') {
        return <GiftIcon className="h-4 w-4 text-pink-500" aria-hidden />;
    }
    if (type === 'remote' || type === 'remote_pending') {
        return <CoffeeIcon className="h-4 w-4 text-emerald-500" />;
    }
    return (
        <CalendarDaysIcon
            className={
                'h-4 w-4 ' +
                (type === 'leave_pending'
                    ? 'text-amber-500'
                    : 'text-slate-400')
            }
            aria-hidden
        />
    );
}

function DayCell({ day, todayKey, selectedUser, users, entries }) {
    const isToday = day.key === todayKey;
    const isSelectedMonth = day.isCurrentMonth;

    return (
        <div
            className={
                'min-h-[5.5rem] border-b border-r border-slate-100 p-1.5 dark:border-slate-800 ' +
                (!isSelectedMonth
                    ? 'bg-slate-50/60 dark:bg-slate-900/40'
                    : day.isWeekend
                      ? 'bg-slate-50/90 dark:bg-slate-800/30'
                      : 'bg-white dark:bg-slate-900/90') +
                (isToday ? ' ring-1 ring-inset ring-sky-500/60' : '')
            }
        >
            <div className="flex items-center justify-between">
                <span
                    className={
                        'flex h-6 w-6 items-center justify-center text-xs font-semibold ' +
                        (isToday
                            ? 'rounded-full bg-sky-500 text-white'
                            : isSelectedMonth
                              ? 'text-slate-700 dark:text-slate-200'
                              : 'text-slate-400 dark:text-slate-500')
                    }
                >
                    {day.label}
                </span>
            </div>

            <div className="mt-1 space-y-1">
                {selectedUser ? (
                    entries[0]?.mark ? (
                        <div className="flex items-center gap-1 rounded-md bg-slate-100/80 px-1.5 py-1 dark:bg-slate-800/80">
                            <DayMarkIcon type={entries[0].mark} />
                        </div>
                    ) : null
                ) : (
                    entries.slice(0, 3).map((entry) => (
                        <div
                            key={entry.user.id}
                            className="flex items-center gap-1.5 truncate rounded-md bg-slate-100/80 px-1.5 py-0.5 dark:bg-slate-800/80"
                            title={entry.user.name}
                        >
                            <UserAvatar
                                user={entry.user}
                                className="h-4 w-4 text-[8px]"
                                ringClassName="ring-1 ring-white dark:ring-slate-800"
                            />
                            <MarkDot type={entry.mark} />
                            <span className="truncate text-[10px] font-medium text-slate-600 dark:text-slate-300">
                                {entry.user.name.split(' ')[0]}
                            </span>
                        </div>
                    ))
                )}
                {!selectedUser && entries.length > 3 && (
                    <p className="px-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                        +{entries.length - 3} more
                    </p>
                )}
            </div>
        </div>
    );
}

function MemberRow({ user, selected, onSelect }) {
    return (
        <button
            type="button"
            onClick={() => onSelect(user.id)}
            className={
                'flex w-full items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition ' +
                (selected
                    ? 'border-sky-300 bg-sky-50 dark:border-sky-500/50 dark:bg-sky-500/10'
                    : 'border-transparent hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-700 dark:hover:bg-slate-800/60')
            }
        >
            <UserAvatar
                user={user}
                className="h-8 w-8 text-xs"
                ringClassName="ring-2 ring-white dark:ring-slate-800"
            />
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {user.name}
                </p>
            </div>
            <span
                className={
                    'shrink-0 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ' +
                    (user.balance < 0
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300')
                }
            >
                {user.balance}
            </span>
        </button>
    );
}

export default function DashboardCalendar({
    users = [],
    canApplyLeave = false,
    calendarMonth,
}) {
    const today = new Date();
    const todayKey = dateKey(today);
    const activeMonth =
        calendarMonth ||
        `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    const [selectedUserId, setSelectedUserId] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const weeks = useMemo(
        () => buildMonthWeeks(activeMonth),
        [activeMonth],
    );

    const selectedUser = users.find((user) => user.id === selectedUserId) ?? null;

    const dayEntries = useMemo(() => {
        const map = {};

        users.forEach((user) => {
            if (selectedUserId && user.id !== selectedUserId) {
                return;
            }

            Object.entries(user.marks ?? {}).forEach(([key, mark]) => {
                if (!map[key]) {
                    map[key] = [];
                }
                map[key].push({ user, mark });
            });
        });

        return map;
    }, [users, selectedUserId]);

    useEffect(() => {
        const refreshCalendar = () => {
            router.reload({
                only: ['leaveCalendar', 'calendarMonth', 'onLeaveToday', 'pendingLeaveCount'],
                preserveScroll: true,
                preserveState: true,
            });
        };

        const interval = window.setInterval(() => {
            if (document.visibilityState === 'visible') {
                refreshCalendar();
            }
        }, 10000);

        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                refreshCalendar();
            }
        };

        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            window.clearInterval(interval);
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [activeMonth]);

    const changeMonth = (direction) => {
        router.get(
            route('dashboard', { calendar_month: shiftMonth(activeMonth, direction) }),
            {},
            { preserveState: true, preserveScroll: true, only: ['leaveCalendar', 'calendarMonth'] },
        );
    };

    return (
        <>
            <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700/70 dark:bg-slate-900/90">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-5">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => changeMonth(-1)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                            aria-label="Previous month"
                        >
                            <ChevronLeftIcon className="h-4 w-4" aria-hidden />
                        </button>
                        <h3 className="min-w-[10rem] text-center text-base font-semibold text-slate-800 dark:text-slate-100">
                            {formatMonthLabel(activeMonth)}
                        </h3>
                        <button
                            type="button"
                            onClick={() => changeMonth(1)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                            aria-label="Next month"
                        >
                            <ChevronRightIcon className="h-4 w-4" aria-hidden />
                        </button>
                    </div>

                    {canApplyLeave && (
                        <button
                            type="button"
                            onClick={() => setShowModal(true)}
                            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500"
                        >
                            <PlusIcon className="h-4 w-4" aria-hidden />
                            Leave request
                            <ChevronDownIcon className="h-4 w-4" aria-hidden />
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[15rem_minmax(0,1fr)]">
                    <aside className="border-b border-slate-100 p-4 dark:border-slate-800 lg:border-b-0 lg:border-r">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Team
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                            Leave credits shown per member
                        </p>

                        <div className="mt-3 space-y-1">
                            <button
                                type="button"
                                onClick={() => setSelectedUserId(null)}
                                className={
                                    'w-full rounded-xl border px-2.5 py-2 text-left text-sm font-medium transition ' +
                                    (selectedUserId === null
                                        ? 'border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-500/50 dark:bg-sky-500/10 dark:text-sky-300'
                                        : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800/60')
                                }
                            >
                                All team
                            </button>

                            {users.length === 0 ? (
                                <p className="px-2 py-4 text-sm text-slate-500 dark:text-slate-400">
                                    No team members.
                                </p>
                            ) : (
                                <div className="max-h-80 space-y-1 overflow-y-auto p-0.5">
                                    {users.map((user) => (
                                        <MemberRow
                                            key={user.id}
                                            user={user}
                                            selected={selectedUserId === user.id}
                                            onSelect={setSelectedUserId}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {selectedUser && (
                            <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/60">
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Viewing
                                </p>
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                    {selectedUser.name}
                                </p>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    {selectedUser.balance} leave credits left
                                </p>
                            </div>
                        )}
                    </aside>

                    <div className="p-4 sm:p-5">
                        <div className="overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800">
                            <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-800/40">
                                {WEEKDAYS.map((weekday) => (
                                    <div
                                        key={weekday}
                                        className="border-r border-slate-100 px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500 last:border-r-0 dark:border-slate-800 dark:text-slate-400"
                                    >
                                        {weekday}
                                    </div>
                                ))}
                            </div>

                            {weeks.map((week, weekIndex) => (
                                <div
                                    key={`week-${weekIndex}`}
                                    className="grid grid-cols-7"
                                >
                                    {week.map((day) => (
                                        <DayCell
                                            key={day.key}
                                            day={day}
                                            todayKey={todayKey}
                                            selectedUser={selectedUser}
                                            users={users}
                                            entries={dayEntries[day.key] ?? []}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="inline-flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-slate-400" />
                                Leave
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                Remote
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-pink-500" />
                                Birthday
                            </span>
                            <span className="text-slate-400 dark:text-slate-500">
                                Approved leave only
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {canApplyLeave && (
                <LeaveRequestModal
                    show={showModal}
                    onClose={() => setShowModal(false)}
                />
            )}
        </>
    );
}
