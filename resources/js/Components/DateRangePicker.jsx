import { philippineTodayInput } from '@/utils/philippineTime';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { useMemo, useState } from 'react';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function pad(value) {
    return String(value).padStart(2, '0');
}

function toKey(year, month, day) {
    return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function parseKey(key) {
    const [year, month, day] = String(key).split('-').map(Number);

    return { year, month: month - 1, day };
}

function formatKey(key) {
    if (!key) {
        return '';
    }

    const { year, month, day } = parseKey(key);

    return new Date(year, month, day).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function shiftMonth({ year, month }, delta) {
    const date = new Date(year, month + delta, 1);

    return { year: date.getFullYear(), month: date.getMonth() };
}

function daysBetweenInclusive(start, end) {
    const a = parseKey(start);
    const b = parseKey(end);
    const ms =
        Date.UTC(b.year, b.month, b.day) - Date.UTC(a.year, a.month, a.day);

    return Math.round(ms / 86400000) + 1;
}

function CalendarIcon({ className = '' }) {
    return (
        <svg
            className={className}
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            aria-hidden
        >
            <rect x="3" y="4.5" width="14" height="12.5" rx="2" />
            <path d="M3 8.5h14M7 2.5v4M13 2.5v4" strokeLinecap="round" />
        </svg>
    );
}

function ChevronIcon({ direction, className = '' }) {
    return (
        <svg
            className={className}
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden
        >
            <path
                d={direction === 'left' ? 'M12.5 4.5 7 10l5.5 5.5' : 'M7.5 4.5 13 10l-5.5 5.5'}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function MonthGrid({
    view,
    today,
    rangeStart,
    rangeEnd,
    holidaySet,
    onPick,
    onHover,
}) {
    const { year, month } = view;
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [
        ...Array.from({ length: firstWeekday }, () => null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    return (
        <div className="w-[16.5rem]">
            <p className="mb-2 text-center text-sm font-semibold text-slate-900 dark:text-white">
                {new Date(year, month, 1).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                })}
            </p>
            <div className="grid grid-cols-7 text-center text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                {WEEKDAYS.map((label) => (
                    <span key={label} className="py-1">
                        {label.slice(0, 2)}
                    </span>
                ))}
            </div>
            <div
                className="grid grid-cols-7"
                onMouseLeave={() => onHover(null)}
            >
                {cells.map((day, index) => {
                    if (day === null) {
                        return <span key={`blank-${index}`} />;
                    }

                    const key = toKey(year, month, day);
                    const weekday = (firstWeekday + day - 1) % 7;
                    const isWeekend = weekday === 0 || weekday === 6;
                    const isStart = key === rangeStart;
                    const isEnd = key === rangeEnd;
                    const isEdge = isStart || isEnd;
                    const inRange =
                        rangeStart &&
                        rangeEnd &&
                        key > rangeStart &&
                        key < rangeEnd;
                    const hasBand =
                        rangeStart && rangeEnd && rangeStart !== rangeEnd;

                    let bandClass = '';
                    if (inRange) {
                        bandClass = 'bg-sky-100 dark:bg-sky-500/20';
                    } else if (hasBand && isStart) {
                        bandClass =
                            'bg-gradient-to-r from-transparent from-50% to-sky-100 to-50% dark:to-sky-500/20';
                    } else if (hasBand && isEnd) {
                        bandClass =
                            'bg-gradient-to-l from-transparent from-50% to-sky-100 to-50% dark:to-sky-500/20';
                    }

                    let dayClass =
                        'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700';
                    if (isEdge) {
                        dayClass =
                            'bg-sky-500 font-semibold text-white shadow-sm hover:bg-sky-600';
                    } else if (inRange) {
                        dayClass =
                            'text-sky-800 hover:bg-sky-200 dark:text-sky-100 dark:hover:bg-sky-500/40';
                    } else if (isWeekend) {
                        dayClass =
                            'text-slate-400 hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-700';
                    }

                    return (
                        <div key={key} className={`py-0.5 ${bandClass}`}>
                            <button
                                type="button"
                                onClick={() => onPick(key)}
                                onMouseEnter={() => onHover(key)}
                                className={`relative mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm transition ${dayClass} ${
                                    key === today && !isEdge
                                        ? 'ring-1 ring-sky-400'
                                        : ''
                                }`}
                                aria-label={formatKey(key)}
                                aria-pressed={isEdge}
                            >
                                {day}
                                {holidaySet.has(key) ? (
                                    <span
                                        className={`absolute bottom-0.5 h-1 w-1 rounded-full ${
                                            isEdge ? 'bg-white' : 'bg-rose-500'
                                        }`}
                                        title="Holiday"
                                    />
                                ) : null}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function RangeCalendar({ startDate, endDate, holidaySet, onChange, close }) {
    const today = philippineTodayInput();
    const [view, setView] = useState(() => {
        const { year, month } = parseKey(startDate || today);

        return { year, month };
    });
    const [anchor, setAnchor] = useState(() =>
        startDate && !endDate ? startDate : null,
    );
    const [hovered, setHovered] = useState(null);

    let rangeStart = startDate || null;
    let rangeEnd = endDate || null;
    if (anchor) {
        const other = hovered ?? anchor;
        rangeStart = anchor < other ? anchor : other;
        rangeEnd = anchor < other ? other : anchor;
    }

    const pick = (key) => {
        if (!anchor) {
            setAnchor(key);
            onChange({ start: key, end: '' });
            return;
        }

        const start = anchor < key ? anchor : key;
        const end = anchor < key ? key : anchor;
        setAnchor(null);
        setHovered(null);
        onChange({ start, end });
        close();
    };

    const selectedDays =
        rangeStart && rangeEnd ? daysBetweenInclusive(rangeStart, rangeEnd) : 0;
    const gridProps = {
        today,
        rangeStart,
        rangeEnd,
        holidaySet,
        onPick: pick,
        onHover: (key) => anchor && setHovered(key),
    };

    return (
        <div className="p-4">
            <div className="relative flex gap-6">
                <button
                    type="button"
                    onClick={() => setView((v) => shiftMonth(v, -1))}
                    className="absolute left-0 top-0 rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
                    aria-label="Previous month"
                >
                    <ChevronIcon direction="left" className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    onClick={() => setView((v) => shiftMonth(v, 1))}
                    className="absolute right-0 top-0 rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
                    aria-label="Next month"
                >
                    <ChevronIcon direction="right" className="h-4 w-4" />
                </button>
                <MonthGrid view={view} {...gridProps} />
                <div className="hidden sm:block">
                    <MonthGrid view={shiftMonth(view, 1)} {...gridProps} />
                </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-200 pt-3 text-xs dark:border-slate-700">
                <p className="text-slate-500 dark:text-slate-400">
                    {anchor
                        ? 'Select the end date'
                        : selectedDays > 0
                          ? `${selectedDays} day${selectedDays === 1 ? '' : 's'} selected`
                          : 'Select the start date'}
                    {holidaySet.size > 0 ? (
                        <span className="ml-3 inline-flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            Holiday
                        </span>
                    ) : null}
                </p>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            setAnchor(null);
                            onChange({ start: today, end: today });
                            close();
                        }}
                        className="rounded-md px-2 py-1 font-medium text-sky-600 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-500/10"
                    >
                        Today
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setAnchor(null);
                            onChange({ start: '', end: '' });
                        }}
                        className="rounded-md px-2 py-1 font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                    >
                        Clear
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function DateRangePicker({
    id,
    startDate = '',
    endDate = '',
    onChange,
    holidayDates = [],
    placeholder = 'Select dates',
    className = '',
}) {
    const holidaySet = useMemo(() => new Set(holidayDates), [holidayDates]);

    let label = placeholder;
    if (startDate && endDate) {
        label =
            startDate === endDate
                ? formatKey(startDate)
                : `${formatKey(startDate)} – ${formatKey(endDate)}`;
    } else if (startDate) {
        label = `${formatKey(startDate)} – …`;
    }
    const hasValue = Boolean(startDate || endDate);

    return (
        <Popover className={`relative ${className}`}>
            {({ close }) => (
                <>
                    <div className="relative">
                        <PopoverButton
                            id={id}
                            type="button"
                            className="flex w-full items-center gap-2 rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-9 text-left text-sm shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 data-[open]:border-sky-500 data-[open]:ring-1 data-[open]:ring-sky-500 dark:border-slate-600 dark:bg-slate-800"
                        >
                            <CalendarIcon className="h-4 w-4 shrink-0 text-slate-400" />
                            <span
                                className={
                                    hasValue
                                        ? 'text-slate-900 dark:text-slate-100'
                                        : 'text-slate-400 dark:text-slate-500'
                                }
                            >
                                {label}
                            </span>
                        </PopoverButton>
                        {hasValue ? (
                            <button
                                type="button"
                                onClick={() => onChange({ start: '', end: '' })}
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                                aria-label="Clear dates"
                            >
                                <svg
                                    className="h-3.5 w-3.5"
                                    viewBox="0 0 20 20"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    aria-hidden
                                >
                                    <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
                                </svg>
                            </button>
                        ) : null}
                    </div>
                    <PopoverPanel
                        anchor={{ to: 'bottom start', gap: 6, padding: 12 }}
                        className="z-[60] rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800"
                    >
                        <RangeCalendar
                            startDate={startDate}
                            endDate={endDate}
                            holidaySet={holidaySet}
                            onChange={onChange}
                            close={close}
                        />
                    </PopoverPanel>
                </>
            )}
        </Popover>
    );
}
