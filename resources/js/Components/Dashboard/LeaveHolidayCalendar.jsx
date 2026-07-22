import CalendarEventModal from '@/Components/Dashboard/CalendarEventModal';
import LeaveRequestModal from '@/Components/Leave/LeaveRequestModal';
import {
    CalendarDaysIcon,
    ChevronDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    PlusIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const RELOAD_PROPS = [
    'leaveCalendar',
    'calendarMonth',
    'holidays',
    'calendarEvents',
    'onLeaveToday',
    'pendingLeaveCount',
];

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

function getAdjacentDayKey(dayKey, direction) {
    const [year, month, day] = dayKey.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + direction);
    return dateKey(date);
}

function eventContinuesOnDay(calendarEvents, dayKey, eventId) {
    return (calendarEvents[dayKey] ?? []).some((entry) => entry.id === eventId);
}

function eventBarClasses(continuesFromPrev, continuesToNext) {
    const base =
        'group relative z-10 flex h-[18px] items-center bg-sky-100 text-[10px] font-medium text-sky-800 dark:bg-sky-500/20 dark:text-sky-200';

    if (continuesFromPrev && continuesToNext) {
        return `${base} -mx-1.5 rounded-none px-1.5`;
    }

    if (continuesFromPrev) {
        return `${base} -ml-1.5 rounded-l-none rounded-r-md pl-1.5 pr-1.5`;
    }

    if (continuesToNext) {
        return `${base} -mr-1.5 rounded-r-none rounded-l-md pl-1.5 pr-1.5`;
    }

    return `${base} rounded-md px-1.5`;
}

function holidayStyles(country) {
    if (country === 'ph') {
        return 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200';
    }
    if (country === 'wa') {
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200';
    }
    return 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200';
}

function holidayBadge(country) {
    if (country === 'ph') {
        return 'PH';
    }
    if (country === 'wa') {
        return 'WA';
    }
    return 'SG';
}

function DayCell({
    day,
    todayKey,
    leaveCount = 0,
    holidays = [],
    birthdays = [],
    events = [],
    calendarEvents = {},
    canAddEvent = false,
    canDeleteEvent,
    onAddEvent,
}) {
    const isToday = day.key === todayKey;
    const isSelectedMonth = day.isCurrentMonth;
    const visibleEvents = events.slice(0, 2);
    const hiddenEventCount = Math.max(events.length - visibleEvents.length, 0);

    const handleDeleteEvent = (event) => {
        if (!canDeleteEvent?.(event)) {
            return;
        }

        if (
            !window.confirm(`Remove "${event.title}" from the calendar?`)
        ) {
            return;
        }

        router.delete(route('calendar-events.destroy', event.id), {
            preserveScroll: true,
            preserveState: false,
            only: RELOAD_PROPS,
        });
    };

    return (
        <div
            role={canAddEvent ? 'button' : undefined}
            tabIndex={canAddEvent ? 0 : undefined}
            onClick={canAddEvent ? () => onAddEvent?.(day.key) : undefined}
            onKeyDown={
                canAddEvent
                    ? (event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              onAddEvent?.(day.key);
                          }
                      }
                    : undefined
            }
            className={
                'min-h-[5.5rem] border-b border-r border-slate-100 p-1.5 dark:border-slate-800 ' +
                (!isSelectedMonth
                    ? 'bg-slate-50/60 dark:bg-slate-900/40'
                    : day.isWeekend
                      ? 'bg-slate-50/90 dark:bg-slate-800/30'
                      : 'bg-white dark:bg-slate-900/90') +
                (isToday ? ' ring-1 ring-inset ring-sky-500/60' : '') +
                (canAddEvent
                    ? ' cursor-pointer transition hover:bg-sky-50/50 dark:hover:bg-sky-500/5'
                    : '') +
                ' overflow-visible'
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

            <div className="relative mt-1 space-y-1 overflow-visible">
                {holidays.slice(0, 2).map((holiday) => (
                    <div
                        key={`${holiday.country}-${holiday.name}`}
                        className={`truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium ${holidayStyles(holiday.country)}`}
                        title={`${holiday.country_label}: ${holiday.name}`}
                    >
                        <span className="font-bold">
                            {holidayBadge(holiday.country)}
                        </span>{' '}
                        {holiday.name}
                    </div>
                ))}
                {holidays.length > 2 && (
                    <p className="px-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                        +{holidays.length - 2} more holidays
                    </p>
                )}

                {birthdays.slice(0, 2).map((person) => (
                    <div
                        key={person.id}
                        className="truncate rounded-md bg-pink-100 px-1.5 py-0.5 text-[10px] font-medium text-pink-800 dark:bg-pink-500/20 dark:text-pink-200"
                        title={`Birthday: ${person.name}`}
                    >
                        {person.name}
                    </div>
                ))}
                {birthdays.length > 2 && (
                    <p className="px-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                        +{birthdays.length - 2} more birthdays
                    </p>
                )}

                {visibleEvents.map((event) => {
                    const continuesFromPrev = eventContinuesOnDay(
                        calendarEvents,
                        getAdjacentDayKey(day.key, -1),
                        event.id,
                    );
                    const continuesToNext = eventContinuesOnDay(
                        calendarEvents,
                        getAdjacentDayKey(day.key, 1),
                        event.id,
                    );
                    const isSegmentStart = !continuesFromPrev;

                    return (
                        <div
                            key={`${event.id}-${day.key}`}
                            className={eventBarClasses(
                                continuesFromPrev,
                                continuesToNext,
                            )}
                            title={[event.title, event.category_label, event.description]
                                .filter(Boolean)
                                .join(' · ')}
                            onClick={(clickEvent) => clickEvent.stopPropagation()}
                        >
                            {isSegmentStart ? (
                                <span className="min-w-0 flex-1 truncate">
                                    {event.title}
                                </span>
                            ) : (
                                <span className="flex-1" aria-hidden />
                            )}
                            {isSegmentStart && canDeleteEvent?.(event) && (
                                <button
                                    type="button"
                                    onClick={() => handleDeleteEvent(event)}
                                    className="shrink-0 rounded p-0.5 text-sky-600 opacity-0 transition hover:bg-sky-200/80 group-hover:opacity-100 dark:text-sky-300 dark:hover:bg-sky-500/30"
                                    aria-label={`Remove ${event.title}`}
                                >
                                    <XMarkIcon className="h-3 w-3" aria-hidden />
                                </button>
                            )}
                        </div>
                    );
                })}
                {hiddenEventCount > 0 && (
                    <p className="px-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                        +{hiddenEventCount} more events
                    </p>
                )}

                {leaveCount > 0 && (
                    <p className="px-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                        {leaveCount} on leave
                    </p>
                )}
            </div>
        </div>
    );
}

export default function LeaveHolidayCalendar({
    users = [],
    holidays = {},
    calendarEvents = {},
    canApplyLeave = false,
    canAddCalendarEvent = false,
    currentUserId = null,
    canDeleteAnyEvent = false,
    calendarMonth,
}) {
    const today = new Date();
    const todayKey = dateKey(today);
    const activeMonth =
        calendarMonth ||
        `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [showEventModal, setShowEventModal] = useState(false);
    const [eventDefaultDate, setEventDefaultDate] = useState('');

    const weeks = useMemo(
        () => buildMonthWeeks(activeMonth),
        [activeMonth],
    );

    const canDeleteEvent = (event) =>
        canDeleteAnyEvent || event.created_by_id === currentUserId;

    const openEventModal = (date = '') => {
        setEventDefaultDate(date);
        setShowEventModal(true);
    };

    const dayBirthdays = useMemo(() => {
        const map = {};

        users.forEach((user) => {
            Object.entries(user.marks ?? {}).forEach(([key, mark]) => {
                if (mark !== 'birthday') {
                    return;
                }

                if (!map[key]) {
                    map[key] = [];
                }

                map[key].push({
                    id: user.id,
                    name: user.name,
                });
            });
        });

        return map;
    }, [users]);

    const dayLeaveCounts = useMemo(() => {
        const map = {};

        users.forEach((user) => {
            Object.entries(user.marks ?? {}).forEach(([key, mark]) => {
                if (mark === 'leave' || mark === 'leave_pending') {
                    map[key] = (map[key] ?? 0) + 1;
                }
            });
        });

        return map;
    }, [users]);

    const changeMonth = (direction) => {
        router.get(
            route('dashboard', { calendar_month: shiftMonth(activeMonth, direction) }),
            {},
            {
                preserveState: false,
                preserveScroll: true,
                only: RELOAD_PROPS,
            },
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

                    <div className="flex flex-wrap items-center gap-2">
                        {canAddCalendarEvent && (
                            <button
                                type="button"
                                onClick={() => openEventModal('')}
                                className="inline-flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-100 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-300 dark:hover:bg-sky-500/20"
                            >
                                <CalendarDaysIcon className="h-4 w-4" aria-hidden />
                                Add event
                            </button>
                        )}

                        {canApplyLeave && (
                            <button
                                type="button"
                                onClick={() => setShowLeaveModal(true)}
                                className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500"
                            >
                                <PlusIcon className="h-4 w-4" aria-hidden />
                                Leave request
                                <ChevronDownIcon className="h-4 w-4" aria-hidden />
                            </button>
                        )}
                    </div>
                </div>

                <div className="p-4 sm:p-5">
                    {canAddCalendarEvent && (
                        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                            Click any day to add an event on that date.
                        </p>
                    )}

                    <div className="overflow-visible rounded-xl border border-slate-100 dark:border-slate-800">
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
                                        leaveCount={dayLeaveCounts[day.key] ?? 0}
                                        holidays={holidays[day.key] ?? []}
                                        birthdays={dayBirthdays[day.key] ?? []}
                                        events={calendarEvents[day.key] ?? []}
                                        calendarEvents={calendarEvents}
                                        canAddEvent={canAddCalendarEvent}
                                        canDeleteEvent={canDeleteEvent}
                                        onAddEvent={openEventModal}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1.5">
                            <span className="rounded px-1 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                                PH
                            </span>
                            Philippines holiday
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <span className="rounded px-1 text-[10px] font-bold text-rose-700 dark:text-rose-300">
                                SG
                            </span>
                            Singapore holiday
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <span className="rounded px-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                                WA
                            </span>
                            Western Australia holiday
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-pink-500" />
                            Birthday
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-sky-500" />
                            Team event
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-slate-400" />
                            On leave
                        </span>
                    </div>
                </div>
            </div>

            {canApplyLeave && (
                <LeaveRequestModal
                    show={showLeaveModal}
                    onClose={() => setShowLeaveModal(false)}
                />
            )}

            {canAddCalendarEvent && (
                <CalendarEventModal
                    key={eventDefaultDate || 'new-event'}
                    show={showEventModal}
                    defaultDate={eventDefaultDate}
                    onClose={() => {
                        setShowEventModal(false);
                        setEventDefaultDate('');
                    }}
                />
            )}
        </>
    );
}
