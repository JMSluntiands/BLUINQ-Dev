import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select2 from '@/Components/Select2';
import UserAvatar from '@/Components/UserAvatar';
import {
    ArrowRightOnRectangleIcon,
    CalendarDaysIcon,
    ClockIcon,
    PlusIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

const STATUS_MESSAGES = {
    'clocked-in': 'You have clocked in for the day.',
    'clocked-out': 'You have clocked out for the day.',
    'already-clocked-in': 'You are already clocked in for today.',
    'already-clocked-out': 'You have already clocked out for today.',
    'clock-in-required': 'Please clock in before clocking out.',
    'activity-logged': 'Activity saved to your weekly timesheet.',
};

const TIMEZONE_STORAGE_KEY = 'bluinq-attendance-timezone';
const ACTIVITIES_STORAGE_PREFIX = 'bluinq-attendance-activities:';
const BREAK_STORAGE_PREFIX = 'bluinq-attendance-break:';
const MAX_BREAK_MS = 60 * 60 * 1000;

function formatClockTime(iso, timeZone) {
    if (!iso || !timeZone) {
        return null;
    }

    return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone,
    }).format(new Date(iso));
}

function timezoneShortLabel(timeZone) {
    try {
        const parts = new Intl.DateTimeFormat('en-US', {
            timeZone,
            timeZoneName: 'short',
        }).formatToParts(new Date());

        return parts.find((part) => part.type === 'timeZoneName')?.value ?? timeZone;
    } catch {
        return timeZone;
    }
}

function todayKey() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${now.getFullYear()}-${month}-${day}`;
}

function formatElapsed(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatBreakCountdown(elapsedMs) {
    const remaining = Math.max(0, MAX_BREAK_MS - elapsedMs);
    const totalSeconds = Math.floor(remaining / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function breakStorageKey(workDate) {
    return `${BREAK_STORAGE_PREFIX}${workDate}`;
}

function readBreakState(workDate) {
    const raw = localStorage.getItem(breakStorageKey(workDate));
    if (!raw) {
        return { usedMs: 0, startedAt: null };
    }

    try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
            return {
                usedMs: Math.max(0, Number(parsed.usedMs) || 0),
                startedAt: parsed.startedAt ? Number(parsed.startedAt) : null,
            };
        }
    } catch {
        // Legacy format: raw timestamp means an active break started then.
        const startedAt = Number(raw);
        if (!Number.isNaN(startedAt) && startedAt > 0) {
            return { usedMs: 0, startedAt };
        }
    }

    return { usedMs: 0, startedAt: null };
}

function writeBreakState(workDate, usedMs, startedAt) {
    localStorage.setItem(
        breakStorageKey(workDate),
        JSON.stringify({
            usedMs: Math.max(0, usedMs),
            startedAt: startedAt || null,
        }),
    );
}


function emptyClockInForm() {
    return {
        date: todayKey(),
        activity: '',
        project: '',
        note: '',
    };
}

function emptyActivityForm() {
    return {
        hours: 0,
        minutes: 0,
        date: todayKey(),
        activity: '',
        project: '',
        note: '',
    };
}

function formatActivityDateLabel(dateValue) {
    if (!dateValue) {
        return 'Today';
    }

    if (dateValue === todayKey()) {
        return 'Today';
    }

    try {
        const [year, month, day] = dateValue.split('-').map(Number);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        }).format(new Date(year, month - 1, day));
    } catch {
        return dateValue;
    }
}

function formatDurationLabel(hours, minutes) {
    return `${Number(hours) || 0} h ${Number(minutes) || 0} m`;
}

function ActionCircleButton({
    label,
    onClick,
    className,
    icon: Icon,
    active = false,
    title,
    disabled = false,
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title ?? label}
            aria-label={label}
            aria-pressed={active || undefined}
            className={
                'group flex flex-col items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 dark:focus-visible:ring-offset-slate-900 ' +
                className
            }
        >
            <span
                className={
                    'inline-flex h-11 w-11 items-center justify-center rounded-full text-white shadow-sm transition group-hover:scale-105 group-active:scale-95 group-disabled:group-hover:scale-100 ' +
                    (active
                        ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 '
                        : '')
                }
            >
                <Icon className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                {label}
            </span>
        </button>
    );
}

function formatRemainingMs(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function BreakCircleButton({
    onBreak,
    elapsedMs,
    overLimit,
    remainingMs,
    onClick,
    disabled = false,
}) {
    const progress = Math.min(1, elapsedMs / MAX_BREAK_MS);
    const radius = 20;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - progress);
    const timerLabel = onBreak
        ? overLimit
            ? formatElapsed(elapsedMs)
            : formatBreakCountdown(elapsedMs)
        : null;

    let title = `Start break (${formatRemainingMs(remainingMs)} left today)`;
    if (onBreak) {
        title = overLimit
            ? `Break over 1 hour (${formatElapsed(elapsedMs)}) — click to resume`
            : `Break remaining ${formatBreakCountdown(elapsedMs)} — click to resume`;
    } else if (remainingMs <= 0) {
        title = 'Daily 1 hour break already used';
    }

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            aria-label={onBreak ? 'Resume from break' : 'Start break time'}
            aria-pressed={onBreak || undefined}
            className="group flex flex-col items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 dark:focus-visible:ring-offset-slate-900"
        >
            <span className="relative inline-flex h-11 w-11 items-center justify-center">
                {(onBreak || elapsedMs > 0) && (
                    <svg
                        className="absolute inset-0 h-11 w-11 -rotate-90"
                        viewBox="0 0 44 44"
                        aria-hidden
                    >
                        <circle
                            cx="22"
                            cy="22"
                            r={radius}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            className="text-amber-200 dark:text-amber-900/60"
                        />
                        <circle
                            cx="22"
                            cy="22"
                            r={radius}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={dashOffset}
                            className={
                                overLimit || remainingMs <= 0
                                    ? 'text-rose-500'
                                    : 'text-amber-500'
                            }
                        />
                    </svg>
                )}
                <span
                    className={
                        'relative inline-flex h-11 w-11 items-center justify-center rounded-full text-white shadow-sm transition group-hover:scale-105 group-active:scale-95 group-disabled:group-hover:scale-100 ' +
                        (onBreak
                            ? overLimit
                                ? 'bg-rose-500 ring-2 ring-rose-400 ring-offset-2 ring-offset-white dark:ring-offset-slate-900'
                                : 'bg-amber-500 ring-2 ring-amber-400 ring-offset-2 ring-offset-white dark:ring-offset-slate-900'
                            : remainingMs <= 0
                              ? 'bg-rose-400'
                              : 'bg-amber-400 hover:bg-amber-500')
                    }
                >
                    {onBreak ? (
                        <span className="font-mono text-[10px] font-bold tabular-nums leading-none tracking-tight">
                            {timerLabel}
                        </span>
                    ) : (
                        <ClockIcon className="h-5 w-5" aria-hidden />
                    )}
                </span>
            </span>
            <span
                className={
                    'text-[10px] font-semibold uppercase tracking-wide ' +
                    (onBreak
                        ? overLimit
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-amber-700 dark:text-amber-300'
                        : remainingMs <= 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-slate-600 dark:text-slate-300')
                }
            >
                {onBreak
                    ? overLimit
                        ? 'Over limit'
                        : 'Resume'
                    : remainingMs <= 0
                      ? 'No break left'
                      : 'Break time'}
            </span>
        </button>
    );
}

export default function ClockInOutPanel({
    clock = {},
    activityFormOptions = null,
}) {
    const page = usePage();
    const authUser = page.props.auth?.user ?? null;
    const status = page.props.flash?.status ?? null;
    const statusMessage =
        status && STATUS_MESSAGES[status] ? STATUS_MESSAGES[status] : null;

    const timezones = clock.timezones ?? [];
    const defaultTimezone = clock.timezone ?? 'Asia/Manila';
    const workDate = todayKey();
    const activityOptions = activityFormOptions?.activities ?? [];
    const projectOptions = activityFormOptions?.projects ?? [];
    const projectSelectOptions = useMemo(
        () =>
            projectOptions.map((item) => ({
                value: String(item.value ?? ''),
                label: String(item.label ?? item.value ?? ''),
            })),
        [projectOptions],
    );
    const canSelectProject = Boolean(
        activityFormOptions?.can_select_project,
    );

    const [selectedTimezone, setSelectedTimezone] = useState(defaultTimezone);
    const [clockInOpen, setClockInOpen] = useState(false);
    const [clockInForm, setClockInForm] = useState(emptyClockInForm);
    const [clockInSaving, setClockInSaving] = useState(false);
    const [activityOpen, setActivityOpen] = useState(false);
    const [activityForm, setActivityForm] = useState(emptyActivityForm);
    const [activitySaving, setActivitySaving] = useState(false);
    const [activities, setActivities] = useState([]);
    const [breakUsedMs, setBreakUsedMs] = useState(0);
    const [breakStartedAt, setBreakStartedAt] = useState(null);
    const [nowMs, setNowMs] = useState(() => Date.now());

    useEffect(() => {
        const stored = localStorage.getItem(TIMEZONE_STORAGE_KEY);
        const allowed = timezones.map((item) => item.value);

        if (stored && allowed.includes(stored)) {
            setSelectedTimezone(stored);
            return;
        }

        setSelectedTimezone(defaultTimezone);
    }, [defaultTimezone, timezones]);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(
                `${ACTIVITIES_STORAGE_PREFIX}${workDate}`,
            );
            setActivities(raw ? JSON.parse(raw) : []);
        } catch {
            setActivities([]);
        }

        const breakState = readBreakState(workDate);
        setBreakUsedMs(breakState.usedMs);
        setBreakStartedAt(breakState.startedAt);
    }, [workDate]);

    useEffect(() => {
        if (!breakStartedAt && !clockInOpen) {
            return undefined;
        }

        const timer = window.setInterval(() => setNowMs(Date.now()), 1000);

        return () => window.clearInterval(timer);
    }, [breakStartedAt, clockInOpen]);

    const handleTimezoneChange = (event) => {
        const value = event.target.value;
        setSelectedTimezone(value);
        localStorage.setItem(TIMEZONE_STORAGE_KEY, value);
    };

    const clockedIn = Boolean(clock.clocked_in);
    const clockedOut = Boolean(clock.clocked_out);
    const canClockIn = !clockedIn;
    const canClockOut = clockedIn && !clockedOut;
    const shiftActionsEnabled = clockedIn && !clockedOut;
    const onBreak = Boolean(breakStartedAt);
    const breakElapsedMs =
        breakUsedMs + (onBreak ? Math.max(0, nowMs - breakStartedAt) : 0);
    const breakRemainingMs = Math.max(0, MAX_BREAK_MS - breakElapsedMs);
    const breakOverLimit = breakElapsedMs > MAX_BREAK_MS;

    const clockInDisplay = useMemo(
        () =>
            formatClockTime(clock.clock_in_at, selectedTimezone) ??
            clock.clock_in_time,
        [clock.clock_in_at, clock.clock_in_time, selectedTimezone],
    );

    const clockOutDisplay = useMemo(
        () =>
            formatClockTime(clock.clock_out_at, selectedTimezone) ??
            clock.clock_out_time,
        [clock.clock_out_at, clock.clock_out_time, selectedTimezone],
    );

    const liveClockHm = useMemo(() => {
        try {
            return new Intl.DateTimeFormat('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
                timeZone: selectedTimezone,
            }).format(new Date(nowMs));
        } catch {
            return clock.current_local_time_hm ?? '--:--';
        }
    }, [clock.current_local_time_hm, nowMs, selectedTimezone]);

    const clockInNeedsProject =
        canSelectProject &&
        (clockInForm.activity === 'drafting' ||
            clockInForm.activity === 'checking');
    const clockInCanSubmit = Boolean(
        clockInForm.activity &&
            (!clockInNeedsProject || clockInForm.project) &&
            !clockInSaving,
    );

    const openClockInModal = () => {
        setClockInForm(emptyClockInForm());
        setNowMs(Date.now());
        setClockInOpen(true);
    };

    const closeClockInModal = () => {
        setClockInOpen(false);
        setClockInForm(emptyClockInForm());
    };

    const updateClockInField = (field, value) => {
        setClockInForm((current) => {
            const next = { ...current, [field]: value };
            if (
                field === 'activity' &&
                value !== 'drafting' &&
                value !== 'checking'
            ) {
                next.project = '';
            }
            return next;
        });
    };

    const submitClockIn = (event) => {
        event.preventDefault();

        if (!clockInCanSubmit) {
            return;
        }

        setClockInSaving(true);

        router.post(
            route('dashboard.clock-in'),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    closeClockInModal();
                },
                onError: () => {
                    window.alert('Could not clock in.');
                },
                onFinish: () => setClockInSaving(false),
            },
        );
    };

    const clockOut = () => {
        if (onBreak) {
            endBreak();
        }
        router.post(route('dashboard.clock-out'), {}, { preserveScroll: true });
    };

    const endBreak = () => {
        const segmentMs = breakStartedAt
            ? Math.max(0, Date.now() - breakStartedAt)
            : 0;
        const nextUsedMs = breakUsedMs + segmentMs;
        setBreakUsedMs(nextUsedMs);
        setBreakStartedAt(null);
        writeBreakState(workDate, nextUsedMs, null);
    };

    const toggleBreak = () => {
        if (onBreak) {
            endBreak();
            return;
        }

        if (breakUsedMs >= MAX_BREAK_MS) {
            return;
        }

        const startedAt = Date.now();
        setBreakStartedAt(startedAt);
        writeBreakState(workDate, breakUsedMs, startedAt);
        setNowMs(startedAt);
    };

    const openActivityModal = () => {
        if (onBreak) {
            endBreak();
        }
        setActivityForm(emptyActivityForm());
        setActivityOpen(true);
    };

    const closeActivityModal = () => {
        setActivityOpen(false);
        setActivityForm(emptyActivityForm());
    };

    const updateActivityField = (field, value) => {
        setActivityForm((current) => {
            const next = { ...current, [field]: value };
            if (
                field === 'activity' &&
                value !== 'drafting' &&
                value !== 'checking'
            ) {
                next.project = '';
            }
            return next;
        });
    };

    const saveActivity = (event) => {
        event.preventDefault();

        const hours = Math.max(0, Number(activityForm.hours) || 0);
        const minutes = Math.min(
            59,
            Math.max(0, Number(activityForm.minutes) || 0),
        );
        const activityValue = activityForm.activity;
        const projectValue = activityForm.project;
        const needsProject =
            canSelectProject &&
            (activityValue === 'drafting' || activityValue === 'checking');

        if (!activityValue || (needsProject && !projectValue)) {
            return;
        }

        if (hours === 0 && minutes === 0) {
            return;
        }

        if (activitySaving) {
            return;
        }

        const activityLabel =
            activityOptions.find((item) => item.value === activityValue)
                ?.label ?? activityValue;
        const projectLabel =
            projectOptions.find((item) => item.value === projectValue)
                ?.label ?? projectValue;
        const note = activityForm.note.trim();
        const durationLabel = formatDurationLabel(hours, minutes);
        const dateLabel = formatActivityDateLabel(activityForm.date);

        setActivitySaving(true);

        router.post(
            route('dashboard.activities.store'),
            {
                activity: activityValue,
                project_id: needsProject ? Number(projectValue) : null,
                date: activityForm.date,
                hours,
                minutes,
                note: note || null,
            },
            {
                preserveScroll: true,
                onError: (errors) => {
                    const message =
                        errors.hours ||
                        errors.activity ||
                        errors.project_id ||
                        errors.date ||
                        Object.values(errors)[0] ||
                        'Could not save activity.';
                    window.alert(
                        Array.isArray(message) ? message[0] : String(message),
                    );
                },
                onSuccess: () => {
                    const next = [
                        {
                            id: `${Date.now()}`,
                            hours,
                            minutes,
                            date: activityForm.date,
                            activity: activityValue,
                            activityLabel,
                            project: needsProject ? projectValue : '',
                            projectLabel: needsProject ? projectLabel : '',
                            note,
                            text: `${durationLabel} · ${activityLabel}${
                                needsProject && projectLabel
                                    ? ` · ${projectLabel}`
                                    : ''
                            }${note ? ` — ${note}` : ''}`,
                            at: new Date().toISOString(),
                            dateLabel,
                        },
                        ...activities,
                    ];
                    setActivities(next);
                    localStorage.setItem(
                        `${ACTIVITIES_STORAGE_PREFIX}${workDate}`,
                        JSON.stringify(next),
                    );
                    closeActivityModal();

                    if (onBreak) {
                        endBreak();
                    }
                },
                onFinish: () => setActivitySaving(false),
            },
        );
    };

    const selectedTimezoneLabel =
        timezones.find((item) => item.value === selectedTimezone)?.label ??
        timezoneShortLabel(selectedTimezone);

    return (
        <div className="mb-6 w-full min-w-0 max-w-full overflow-x-hidden">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/90 sm:p-5">
                {statusMessage && (
                    <div
                        className={
                            'mb-4 rounded-lg px-4 py-3 text-sm ' +
                            (status === 'clocked-in'
                                ? 'border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
                                : status === 'clocked-out'
                                  ? 'border border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200'
                                  : 'border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200')
                        }
                        role="status"
                    >
                        {statusMessage}
                    </div>
                )}

                <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                                Daily attendance
                            </h3>
                            {timezones.length > 0 && (
                                <select
                                    value={selectedTimezone}
                                    onChange={handleTimezoneChange}
                                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                                    aria-label="Attendance timezone"
                                >
                                    {timezones.map((item) => (
                                        <option
                                            key={item.value}
                                            value={item.value}
                                        >
                                            {item.label}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {clockedIn ? (
                                <>
                                    Clocked in at{' '}
                                    <span className="font-medium text-slate-700 dark:text-slate-200">
                                        {clockInDisplay}
                                    </span>{' '}
                                    <span className="text-slate-400 dark:text-slate-500">
                                        ({timezoneShortLabel(selectedTimezone)})
                                    </span>
                                    {clockedOut && clockOutDisplay && (
                                        <>
                                            {' · '}
                                            Clocked out at{' '}
                                            <span className="font-medium text-slate-700 dark:text-slate-200">
                                                {clockOutDisplay}
                                            </span>{' '}
                                            <span className="text-slate-400 dark:text-slate-500">
                                                (
                                                {timezoneShortLabel(
                                                    selectedTimezone,
                                                )}
                                                )
                                            </span>
                                        </>
                                    )}
                                    {shiftActionsEnabled && onBreak && (
                                        <>
                                            {' · '}
                                            <span
                                                className={
                                                    breakOverLimit
                                                        ? 'font-semibold text-rose-600 dark:text-rose-400'
                                                        : 'font-medium text-amber-700 dark:text-amber-300'
                                                }
                                            >
                                                {breakOverLimit ? (
                                                    <>
                                                        Break over limit{' '}
                                                        {formatElapsed(
                                                            breakElapsedMs,
                                                        )}
                                                    </>
                                                ) : (
                                                    <>
                                                        On break ·{' '}
                                                        {formatBreakCountdown(
                                                            breakElapsedMs,
                                                        )}{' '}
                                                        left
                                                    </>
                                                )}
                                            </span>
                                        </>
                                    )}
                                </>
                            ) : (
                                <>
                                    Staff who have not clocked in by 8:00 AM (
                                    {selectedTimezoneLabel}) will appear as
                                    absent. Local time now:{' '}
                                    <span className="font-medium text-slate-700 dark:text-slate-200">
                                        {clock.current_local_time}
                                    </span>
                                </>
                            )}
                        </p>
                        {shiftActionsEnabled && activities.length > 0 && (
                            <ul className="mt-2 space-y-1">
                                {activities.slice(0, 3).map((item) => (
                                    <li
                                        key={item.id}
                                        className="truncate text-xs text-slate-500 dark:text-slate-400"
                                    >
                                        <span className="font-medium text-emerald-700 dark:text-emerald-400">
                                            Activity:
                                        </span>{' '}
                                        {item.text}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="flex shrink-0 flex-wrap items-start justify-end gap-4">
                        {canClockIn && (
                            <button
                                type="button"
                                onClick={openClockInModal}
                                className="inline-flex min-w-[7.5rem] items-center justify-center rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500"
                            >
                                Clock in
                            </button>
                        )}

                        {shiftActionsEnabled && (
                            <>
                                <ActionCircleButton
                                    label="Add activity"
                                    title="Add activity (unlimited)"
                                    icon={PlusIcon}
                                    onClick={openActivityModal}
                                    className="[&>span:first-child]:bg-emerald-500 [&>span:first-child]:hover:bg-emerald-600"
                                />
                                <BreakCircleButton
                                    onBreak={onBreak}
                                    elapsedMs={breakElapsedMs}
                                    remainingMs={breakRemainingMs}
                                    overLimit={breakOverLimit}
                                    disabled={!onBreak && breakRemainingMs <= 0}
                                    onClick={toggleBreak}
                                />
                                <ActionCircleButton
                                    label="Clock out"
                                    title="Clock out"
                                    icon={ArrowRightOnRectangleIcon}
                                    onClick={clockOut}
                                    className="[&>span:first-child]:bg-rose-500 [&>span:first-child]:hover:bg-rose-600"
                                />
                            </>
                        )}
                    </div>
                </div>
            </div>

            <Modal
                show={clockInOpen}
                onClose={closeClockInModal}
                maxWidth="md"
            >
                <form onSubmit={submitClockIn} className="px-6 pb-6 pt-5">
                    <div className="flex items-start justify-between gap-3">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                            Confirm Clock In
                        </h2>
                        <button
                            type="button"
                            onClick={closeClockInModal}
                            className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                            aria-label="Close"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                        <UserAvatar
                            user={authUser}
                            className="h-11 w-11 text-sm"
                            ringClassName="ring-0"
                        />
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                                {authUser?.name ?? 'User'}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                Clocking from{' '}
                                {clock.timezone_offset_label ??
                                    timezoneShortLabel(selectedTimezone)}
                                {' · '}
                                {clock.last_out_label ?? 'No previous clock out'}
                                {' · '}
                                Split time: {clock.split_time_label ?? '00:00'}
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 flex gap-5 border-b border-slate-200 dark:border-slate-700">
                        <span className="border-b-2 border-amber-500 pb-2 text-sm font-semibold text-amber-600 dark:text-amber-400">
                            Clock in
                        </span>
                        <span
                            className="cursor-not-allowed pb-2 text-sm font-medium text-slate-400 dark:text-slate-500"
                            title="Coming soon"
                        >
                            Add hours
                        </span>
                    </div>

                    <div className="mt-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="relative flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-600 dark:bg-slate-900">
                                <span className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-100">
                                    {liveClockHm}
                                </span>
                                <ClockIcon
                                    className="h-4 w-4 text-slate-400"
                                    aria-hidden
                                />
                            </div>

                            <div className="relative">
                                <input
                                    type="date"
                                    value={clockInForm.date}
                                    onChange={(event) =>
                                        updateClockInField(
                                            'date',
                                            event.target.value,
                                        )
                                    }
                                    className="block w-full rounded-lg border-slate-200 bg-white py-2.5 pl-3 pr-10 text-sm text-slate-800 focus:border-sky-500 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                                    aria-label="Clock in date"
                                />
                                <CalendarDaysIcon
                                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                                    aria-hidden
                                />
                            </div>
                        </div>

                        <select
                            value={clockInForm.activity}
                            onChange={(event) =>
                                updateClockInField(
                                    'activity',
                                    event.target.value,
                                )
                            }
                            required
                            className="block w-full rounded-lg border-slate-200 bg-white text-sm text-slate-800 focus:border-sky-500 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                        >
                            <option value="">Select an activity</option>
                            {activityOptions.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </select>

                        {clockInNeedsProject ? (
                            <div className="select2-field">
                                <Select2
                                    id="clock-in-project"
                                    value={clockInForm.project}
                                    onChange={(value) =>
                                        updateClockInField(
                                            'project',
                                            String(value ?? ''),
                                        )
                                    }
                                    options={projectSelectOptions}
                                    placeholder={
                                        projectSelectOptions.length === 0
                                            ? 'No projects available'
                                            : 'Select a project'
                                    }
                                    enabled={
                                        clockInOpen &&
                                        projectSelectOptions.length > 0
                                    }
                                    required
                                />
                            </div>
                        ) : null}

                        <textarea
                            value={clockInForm.note}
                            onChange={(event) =>
                                updateClockInField('note', event.target.value)
                            }
                            rows={4}
                            placeholder="Add a note"
                            className="block w-full resize-y rounded-lg border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                        />
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            type="submit"
                            disabled={!clockInCanSubmit}
                            className={
                                'inline-flex min-w-[7.5rem] items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition ' +
                                (clockInCanSubmit
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                                    : 'cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500')
                            }
                        >
                            {clockInSaving
                                ? 'Saving…'
                                : clockInCanSubmit
                                  ? 'Confirm'
                                  : 'Disabled'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal
                show={activityOpen}
                onClose={closeActivityModal}
                maxWidth="md"
            >
                <form onSubmit={saveActivity} className="px-6 pb-6 pt-5">
                    <div className="border-b border-slate-200 pb-3 dark:border-slate-700">
                        <h2 className="text-base font-extrabold uppercase tracking-wide text-rose-600 dark:text-rose-400">
                            Add activity
                        </h2>
                        <div className="relative mt-2 h-0.5 w-full bg-slate-200 dark:bg-slate-700">
                            <span className="absolute right-0 top-0 h-0.5 w-16 bg-amber-500" />
                        </div>
                    </div>

                    <div className="mt-5 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="relative flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-600 dark:bg-slate-900">
                                <input
                                    type="number"
                                    min="0"
                                    max="24"
                                    value={activityForm.hours}
                                    onChange={(event) =>
                                        updateActivityField(
                                            'hours',
                                            event.target.value,
                                        )
                                    }
                                    className="w-8 border-0 bg-transparent p-0 text-sm text-slate-800 focus:outline-none focus:ring-0 dark:text-slate-100"
                                    aria-label="Hours"
                                />
                                <span className="pr-1 text-sm text-slate-500 dark:text-slate-400">
                                    h
                                </span>
                                <input
                                    type="number"
                                    min="0"
                                    max="59"
                                    value={activityForm.minutes}
                                    onChange={(event) =>
                                        updateActivityField(
                                            'minutes',
                                            event.target.value,
                                        )
                                    }
                                    className="w-8 border-0 bg-transparent p-0 text-sm text-slate-800 focus:outline-none focus:ring-0 dark:text-slate-100"
                                    aria-label="Minutes"
                                />
                                <span className="mr-5 text-sm text-slate-500 dark:text-slate-400">
                                    m
                                </span>
                                <ClockIcon
                                    className="pointer-events-none absolute right-3 h-4 w-4 text-slate-400"
                                    aria-hidden
                                />
                            </div>

                            <div className="relative">
                                <input
                                    type="date"
                                    value={activityForm.date}
                                    onChange={(event) =>
                                        updateActivityField(
                                            'date',
                                            event.target.value,
                                        )
                                    }
                                    className="block w-full rounded-lg border-slate-200 bg-white py-2.5 pl-3 pr-10 text-sm text-slate-800 focus:border-sky-500 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                                    aria-label="Activity date"
                                />
                                <CalendarDaysIcon
                                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                                    aria-hidden
                                />
                            </div>
                        </div>

                        <select
                            value={activityForm.activity}
                            onChange={(event) =>
                                updateActivityField(
                                    'activity',
                                    event.target.value,
                                )
                            }
                            required
                            className="block w-full rounded-lg border-slate-200 bg-white text-sm text-slate-800 focus:border-sky-500 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                        >
                            <option value="">Select an activity</option>
                            {activityOptions.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </select>

                        {canSelectProject &&
                        (activityForm.activity === 'drafting' ||
                            activityForm.activity === 'checking') ? (
                            <div className="select2-field">
                                <Select2
                                    id="activity-project"
                                    value={activityForm.project}
                                    onChange={(value) =>
                                        updateActivityField(
                                            'project',
                                            String(value ?? ''),
                                        )
                                    }
                                    options={projectSelectOptions}
                                    placeholder={
                                        projectSelectOptions.length === 0
                                            ? 'No projects available'
                                            : 'Select a project'
                                    }
                                    enabled={
                                        activityOpen &&
                                        projectSelectOptions.length > 0
                                    }
                                    required
                                />
                            </div>
                        ) : null}

                        <textarea
                            value={activityForm.note}
                            onChange={(event) =>
                                updateActivityField('note', event.target.value)
                            }
                            rows={4}
                            placeholder="Add a note"
                            className="block w-full resize-y rounded-lg border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                        />
                    </div>

                    <div className="mt-6 flex justify-end gap-2">
                        <SecondaryButton
                            type="button"
                            onClick={closeActivityModal}
                            className="rounded-lg normal-case tracking-normal"
                        >
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton
                            className="rounded-lg normal-case tracking-normal"
                            disabled={activitySaving}
                        >
                            {activitySaving ? 'Saving…' : 'Save activity'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
