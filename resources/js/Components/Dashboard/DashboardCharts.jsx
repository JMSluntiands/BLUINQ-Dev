import { useTheme } from '@/contexts/ThemeContext';
import {
    ChartBarIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    FunnelIcon,
    TrophyIcon,
} from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

const DRAFTER_SERIES = [
    { key: 'da_planning', label: 'DA/Planning', color: '#1e40af' },
    { key: 'prestart', label: 'Prestart', color: '#eab308' },
    { key: 'schematic_design', label: 'Schematic Design', color: '#8b5cf6' },
    { key: 'siting', label: 'Siting', color: '#ef4444' },
    { key: 'variation', label: 'Variation', color: '#22c55e' },
    { key: 'working_drawings', label: 'Working Drawings', color: '#38bdf8' },
];

const EMPTY_JOB_STATUS_DATA = [
    { status: 'On Hold', count: 0, color: '#8b5cf6' },
    { status: 'For Checking', count: 0, color: '#3b82f6' },
    { status: 'New', count: 0, color: '#94a3b8' },
    { status: 'WIP', count: 0, color: '#f87171' },
];

function parseChartDate(value) {
    const [year, month, day] = (value || '').split('-').map(Number);
    if (!year || !month || !day) {
        return new Date();
    }

    return new Date(year, month - 1, day);
}

function formatChartDate(value) {
    return parseChartDate(value).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function toDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function shiftChartDate(value, direction) {
    const date = parseChartDate(value);
    date.setDate(date.getDate() + direction);

    return toDateKey(date);
}

function parseLeaderboardMonth(value) {
    const [year, month] = (value || '').split('-').map(Number);
    if (!year || !month) {
        return new Date();
    }

    return new Date(year, month - 1, 1);
}

function formatLeaderboardMonth(value) {
    return parseLeaderboardMonth(value).toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
    });
}

function toMonthKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    return `${year}-${month}`;
}

function shiftLeaderboardMonth(value, direction) {
    const date = parseLeaderboardMonth(value);
    date.setMonth(date.getMonth() + direction);

    return toMonthKey(date);
}

function useChartColors() {
    const { isDark } = useTheme();

    return useMemo(
        () => ({
            grid: isDark ? '#334155' : '#e2e8f0',
            axis: isDark ? '#94a3b8' : '#64748b',
            legend: isDark ? '#cbd5e1' : '#475569',
            tooltipBg: isDark ? '#1e293b' : '#ffffff',
            tooltipBorder: isDark ? '#475569' : '#e2e8f0',
            tooltipTitle: isDark ? '#f8fafc' : '#0f172a',
            tooltipValue: isDark ? '#e2e8f0' : '#334155',
            tooltipMuted: isDark ? '#94a3b8' : '#64748b',
        }),
        [isDark],
    );
}

function ChartTooltip({ active, payload, label, chartColors, compact = false }) {
    if (!active || !payload?.length) {
        return null;
    }

    if (compact && payload.length === 1) {
        return (
            <div
                className="rounded-lg border px-2.5 py-1.5 shadow-lg"
                style={{
                    backgroundColor: chartColors.tooltipBg,
                    borderColor: chartColors.tooltipBorder,
                }}
            >
                <p
                    className="text-sm font-semibold leading-tight"
                    style={{ color: chartColors.tooltipTitle }}
                >
                    {label}
                </p>
                <p className="mt-0.5 text-xs leading-tight">
                    <span style={{ color: chartColors.tooltipMuted }}>
                        Count:{' '}
                    </span>
                    <span
                        className="font-semibold"
                        style={{ color: chartColors.tooltipValue }}
                    >
                        {payload[0].value}
                    </span>
                </p>
            </div>
        );
    }

    return (
        <div
            className="rounded-lg border px-2.5 py-1.5 shadow-lg"
            style={{
                backgroundColor: chartColors.tooltipBg,
                borderColor: chartColors.tooltipBorder,
            }}
        >
            {label && (
                <p
                    className="mb-1 text-sm font-semibold leading-tight"
                    style={{ color: chartColors.tooltipTitle }}
                >
                    {label}
                </p>
            )}
            <ul className="space-y-0.5">
                {payload.map((entry) => (
                    <li
                        key={`${entry.name}-${entry.dataKey}`}
                        className="flex items-center gap-1.5 text-xs leading-tight"
                    >
                        <span
                            className="h-2 w-2 shrink-0 rounded-sm"
                            style={{
                                backgroundColor: entry.color ?? entry.fill,
                            }}
                        />
                        <span style={{ color: chartColors.tooltipMuted }}>
                            {entry.name}:
                        </span>
                        <span
                            className="font-semibold"
                            style={{ color: chartColors.tooltipValue }}
                        >
                            {entry.value}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

const TOOLTIP_WRAPPER_STYLE = {
    padding: 0,
    margin: 0,
    border: 'none',
    background: 'transparent',
    outline: 'none',
    boxShadow: 'none',
};

const TOOLTIP_CONTENT_STYLE = {
    padding: 0,
    margin: 0,
    border: 'none',
    background: 'transparent',
    boxShadow: 'none',
};

function ChartPanel({ title, icon: Icon, iconClassName, children, toolbar }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700/70 dark:bg-slate-900/90">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                    <span
                        className={
                            'flex h-8 w-8 items-center justify-center rounded-lg ' +
                            iconClassName
                        }
                    >
                        <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                        {title}
                    </h3>
                </div>
                {toolbar}
            </div>
            <div className="p-4 sm:p-5">{children}</div>
        </div>
    );
}

function DrafterLeaderboardChart({ drafterLeaderboard, calendarMonth, jobStatusChart }) {
    const chartColors = useChartColors();
    const data = drafterLeaderboard?.data ?? [];
    const selectedMonth = drafterLeaderboard?.month ?? toMonthKey(new Date());
    const monthLabel = drafterLeaderboard?.label ?? formatLeaderboardMonth(selectedMonth);

    const reloadLeaderboard = (nextMonth) => {
        router.get(
            route('dashboard', {
                leaderboard_month: nextMonth,
                calendar_month: calendarMonth,
                job_status_date: jobStatusChart?.date,
            }),
            {},
            {
                preserveState: true,
                preserveScroll: true,
                only: ['drafterLeaderboard'],
            },
        );
    };

    return (
        <ChartPanel
            title="Drafter Leaderboard"
            icon={TrophyIcon}
            iconClassName="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
            toolbar={
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => reloadLeaderboard(shiftLeaderboardMonth(selectedMonth, -1))}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-sky-600 transition hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-500/10"
                        aria-label="Previous month"
                    >
                        <ChevronLeftIcon className="h-3.5 w-3.5" aria-hidden />
                        Prev
                    </button>
                    <button
                        type="button"
                        onClick={() => reloadLeaderboard(shiftLeaderboardMonth(selectedMonth, 1))}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-sky-600 transition hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-500/10"
                        aria-label="Next month"
                    >
                        Next
                        <ChevronRightIcon className="h-3.5 w-3.5" aria-hidden />
                    </button>
                </div>
            }
        >
            <div className="mb-4 flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {monthLabel}
                </p>
                <button
                    type="button"
                    onClick={() => reloadLeaderboard(toMonthKey(new Date()))}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                    aria-label="Filter leaderboard month"
                >
                    <FunnelIcon className="h-3.5 w-3.5" aria-hidden />
                    This month
                </button>
            </div>

            {data.length === 0 ? (
                <div className="flex h-80 items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    No drafting revisions for this month yet.
                </div>
            ) : (
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
                        >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={chartColors.grid}
                            vertical={false}
                        />
                        <XAxis
                            dataKey="drafter"
                            tick={{ fill: chartColors.axis, fontSize: 11 }}
                            axisLine={{ stroke: chartColors.grid }}
                            tickLine={false}
                        />
                        <YAxis
                            allowDecimals={false}
                            tick={{ fill: chartColors.axis, fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            label={{
                                value: 'Count',
                                angle: -90,
                                position: 'insideLeft',
                                fill: chartColors.axis,
                                fontSize: 11,
                            }}
                        />
                        <Tooltip
                            content={
                                <ChartTooltip chartColors={chartColors} />
                            }
                            wrapperStyle={TOOLTIP_WRAPPER_STYLE}
                            contentStyle={TOOLTIP_CONTENT_STYLE}
                            cursor={{ fill: chartColors.grid, opacity: 0.25 }}
                            offset={4}
                        />
                        <Legend
                            wrapperStyle={{
                                fontSize: '11px',
                                paddingTop: '12px',
                                color: chartColors.legend,
                            }}
                        />
                        {DRAFTER_SERIES.map((series) => (
                            <Bar
                                key={series.key}
                                dataKey={series.key}
                                name={series.label}
                                stackId="jobs"
                                fill={series.color}
                                radius={[0, 0, 0, 0]}
                            />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </div>
            )}
        </ChartPanel>
    );
}

function JobStatusChart({ jobStatusChart, calendarMonth }) {
    const chartColors = useChartColors();
    const [showDateFilter, setShowDateFilter] = useState(false);
    const chartData = jobStatusChart?.data?.length
        ? jobStatusChart.data
        : EMPTY_JOB_STATUS_DATA;
    const selectedDate = jobStatusChart?.date ?? toDateKey(new Date());
    const dateLabel = jobStatusChart?.label ?? formatChartDate(selectedDate);

    const reloadChart = (nextDate) => {
        router.get(
            route('dashboard', {
                job_status_date: nextDate,
                calendar_month: calendarMonth,
            }),
            {},
            {
                preserveState: true,
                preserveScroll: true,
                only: ['jobStatusChart'],
            },
        );
    };

    return (
        <ChartPanel
            title="Job Status Chart"
            icon={ChartBarIcon}
            iconClassName="bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400"
            toolbar={
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => reloadChart(shiftChartDate(selectedDate, -1))}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-sky-600 transition hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-500/10"
                        aria-label="Previous day"
                    >
                        <ChevronLeftIcon className="h-3.5 w-3.5" aria-hidden />
                        Prev
                    </button>
                    <button
                        type="button"
                        onClick={() => reloadChart(shiftChartDate(selectedDate, 1))}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-sky-600 transition hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-500/10"
                        aria-label="Next day"
                    >
                        Next
                        <ChevronRightIcon className="h-3.5 w-3.5" aria-hidden />
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowDateFilter((current) => !current)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                        aria-label="Filter job status chart by date"
                        aria-expanded={showDateFilter}
                    >
                        <FunnelIcon className="h-3.5 w-3.5" aria-hidden />
                        {dateLabel}
                    </button>
                </div>
            }
        >
            {showDateFilter && (
                <div className="mb-4 flex flex-wrap items-center gap-2">
                    <label
                        htmlFor="job-status-date"
                        className="text-xs font-medium text-slate-600 dark:text-slate-300"
                    >
                        Daily date
                    </label>
                    <input
                        id="job-status-date"
                        type="date"
                        value={selectedDate}
                        onChange={(event) => reloadChart(event.target.value)}
                        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                    />
                    <button
                        type="button"
                        onClick={() => reloadChart(toDateKey(new Date()))}
                        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                        Today
                    </button>
                </div>
            )}

            <p className="mb-4 text-sm font-medium text-slate-700 dark:text-slate-200">
                Chart by Status — {dateLabel}
            </p>

            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={chartColors.grid}
                            vertical={false}
                        />
                        <XAxis
                            dataKey="status"
                            tick={{ fill: chartColors.axis, fontSize: 11 }}
                            axisLine={{ stroke: chartColors.grid }}
                            tickLine={false}
                        />
                        <YAxis
                            allowDecimals={false}
                            tick={{ fill: chartColors.axis, fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            label={{
                                value: 'Count',
                                angle: -90,
                                position: 'insideLeft',
                                fill: chartColors.axis,
                                fontSize: 11,
                            }}
                        />
                        <Tooltip
                            content={
                                <ChartTooltip
                                    chartColors={chartColors}
                                    compact
                                />
                            }
                            wrapperStyle={TOOLTIP_WRAPPER_STYLE}
                            contentStyle={TOOLTIP_CONTENT_STYLE}
                            cursor={{ fill: chartColors.grid, opacity: 0.25 }}
                            offset={4}
                        />
                        <Bar
                            dataKey="count"
                            name="Count"
                            radius={[6, 6, 0, 0]}
                            label={{
                                position: 'top',
                                fill: chartColors.axis,
                                fontSize: 11,
                            }}
                        >
                            {chartData.map((entry) => (
                                <Cell
                                    key={entry.status}
                                    fill={entry.color}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </ChartPanel>
    );
}

export default function DashboardCharts({
    jobStatusChart,
    drafterLeaderboard,
    calendarMonth,
}) {
    return (
        <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <DrafterLeaderboardChart
                drafterLeaderboard={drafterLeaderboard}
                calendarMonth={calendarMonth}
                jobStatusChart={jobStatusChart}
            />
            <JobStatusChart
                jobStatusChart={jobStatusChart}
                calendarMonth={calendarMonth}
            />
        </div>
    );
}
