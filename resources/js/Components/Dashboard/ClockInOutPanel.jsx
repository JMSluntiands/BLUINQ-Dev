import { router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

const STATUS_MESSAGES = {
    'clocked-in': 'You have clocked in for the day.',
    'clocked-out': 'You have clocked out for the day.',
    'already-clocked-in': 'You are already clocked in for today.',
    'already-clocked-out': 'You have already clocked out for today.',
    'clock-in-required': 'Please clock in before clocking out.',
};

const TIMEZONE_STORAGE_KEY = 'bluinq-attendance-timezone';

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

export default function ClockInOutPanel({ clock = {} }) {
    const status = usePage().props.flash?.status ?? null;
    const statusMessage =
        status && STATUS_MESSAGES[status] ? STATUS_MESSAGES[status] : null;

    const timezones = clock.timezones ?? [];
    const defaultTimezone = clock.timezone ?? 'Asia/Manila';

    const [selectedTimezone, setSelectedTimezone] = useState(defaultTimezone);

    useEffect(() => {
        const stored = localStorage.getItem(TIMEZONE_STORAGE_KEY);
        const allowed = timezones.map((item) => item.value);

        if (stored && allowed.includes(stored)) {
            setSelectedTimezone(stored);
            return;
        }

        setSelectedTimezone(defaultTimezone);
    }, [defaultTimezone, timezones]);

    const handleTimezoneChange = (event) => {
        const value = event.target.value;
        setSelectedTimezone(value);
        localStorage.setItem(TIMEZONE_STORAGE_KEY, value);
    };

    const clockedIn = Boolean(clock.clocked_in);
    const clockedOut = Boolean(clock.clocked_out);
    const canClockIn = !clockedIn;
    const canClockOut = clockedIn && !clockedOut;

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

    const clockIn = () => {
        router.post(route('dashboard.clock-in'), {}, { preserveScroll: true });
    };

    const clockOut = () => {
        router.post(route('dashboard.clock-out'), {}, { preserveScroll: true });
    };

    const selectedTimezoneLabel =
        timezones.find((item) => item.value === selectedTimezone)?.label ??
        timezoneShortLabel(selectedTimezone);

    return (
        <div className="mb-6 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/90 sm:p-5">
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

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
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
                            </>
                        ) : (
                            <>
                                Staff who have not clocked in by 9:00 AM (
                                {selectedTimezoneLabel}) will appear as
                                absent. Local time now:{' '}
                                <span className="font-medium text-slate-700 dark:text-slate-200">
                                    {clock.current_local_time}
                                </span>
                            </>
                        )}
                    </p>
                </div>

                <div className="flex shrink-0 gap-3">
                    <button
                        type="button"
                        onClick={clockIn}
                        disabled={!canClockIn}
                        className="inline-flex min-w-[7.5rem] items-center justify-center rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-sky-600 dark:hover:bg-sky-500"
                    >
                        Clock in
                    </button>
                    <button
                        type="button"
                        onClick={clockOut}
                        disabled={!canClockOut}
                        className="inline-flex min-w-[7.5rem] items-center justify-center rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-700 dark:hover:bg-slate-600"
                    >
                        Clock out
                    </button>
                </div>
            </div>
        </div>
    );
}
