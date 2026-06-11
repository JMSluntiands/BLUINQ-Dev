import { useTheme } from '@/contexts/ThemeContext';
import {
    ChartBarIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    FunnelIcon,
    TrophyIcon,
} from '@heroicons/react/24/outline';
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

const LEADERBOARD_LAST_MONTH = [
    {
        drafter: 'JV',
        da_planning: 2,
        prestart: 1,
        schematic_design: 0,
        siting: 1,
        variation: 0,
        working_drawings: 3,
    },
    {
        drafter: 'RP',
        da_planning: 1,
        prestart: 2,
        schematic_design: 1,
        siting: 0,
        variation: 1,
        working_drawings: 2,
    },
    {
        drafter: 'SR',
        da_planning: 3,
        prestart: 0,
        schematic_design: 2,
        siting: 1,
        variation: 0,
        working_drawings: 1,
    },
    {
        drafter: 'VA',
        da_planning: 0,
        prestart: 1,
        schematic_design: 1,
        siting: 2,
        variation: 1,
        working_drawings: 2,
    },
    {
        drafter: 'HS',
        da_planning: 2,
        prestart: 1,
        schematic_design: 0,
        siting: 0,
        variation: 2,
        working_drawings: 1,
    },
    {
        drafter: 'CP',
        da_planning: 1,
        prestart: 0,
        schematic_design: 3,
        siting: 1,
        variation: 0,
        working_drawings: 0,
    },
    {
        drafter: 'VE',
        da_planning: 0,
        prestart: 2,
        schematic_design: 1,
        siting: 0,
        variation: 1,
        working_drawings: 3,
    },
    {
        drafter: 'JD',
        da_planning: 1,
        prestart: 1,
        schematic_design: 1,
        siting: 1,
        variation: 0,
        working_drawings: 1,
    },
    {
        drafter: 'AG',
        da_planning: 2,
        prestart: 0,
        schematic_design: 0,
        siting: 2,
        variation: 1,
        working_drawings: 2,
    },
    {
        drafter: 'AM',
        da_planning: 0,
        prestart: 1,
        schematic_design: 2,
        siting: 1,
        variation: 0,
        working_drawings: 1,
    },
    {
        drafter: 'DBO',
        da_planning: 1,
        prestart: 2,
        schematic_design: 0,
        siting: 0,
        variation: 1,
        working_drawings: 2,
    },
    {
        drafter: 'LM',
        da_planning: 0,
        prestart: 0,
        schematic_design: 1,
        siting: 2,
        variation: 2,
        working_drawings: 1,
    },
    {
        drafter: 'FV',
        da_planning: 1,
        prestart: 1,
        schematic_design: 1,
        siting: 0,
        variation: 0,
        working_drawings: 2,
    },
    {
        drafter: 'DB',
        da_planning: 2,
        prestart: 0,
        schematic_design: 1,
        siting: 1,
        variation: 1,
        working_drawings: 0,
    },
];

const LEADERBOARD_CURRENT_MONTH = [
    {
        drafter: 'JV',
        da_planning: 1,
        prestart: 2,
        schematic_design: 1,
        siting: 0,
        variation: 1,
        working_drawings: 2,
    },
    {
        drafter: 'RP',
        da_planning: 2,
        prestart: 1,
        schematic_design: 0,
        siting: 2,
        variation: 0,
        working_drawings: 3,
    },
    {
        drafter: 'SR',
        da_planning: 0,
        prestart: 1,
        schematic_design: 3,
        siting: 1,
        variation: 1,
        working_drawings: 1,
    },
    {
        drafter: 'VA',
        da_planning: 1,
        prestart: 0,
        schematic_design: 1,
        siting: 1,
        variation: 0,
        working_drawings: 2,
    },
    {
        drafter: 'HS',
        da_planning: 3,
        prestart: 1,
        schematic_design: 1,
        siting: 0,
        variation: 1,
        working_drawings: 2,
    },
    {
        drafter: 'CP',
        da_planning: 0,
        prestart: 2,
        schematic_design: 2,
        siting: 1,
        variation: 0,
        working_drawings: 1,
    },
    {
        drafter: 'VE',
        da_planning: 1,
        prestart: 1,
        schematic_design: 0,
        siting: 2,
        variation: 2,
        working_drawings: 0,
    },
    {
        drafter: 'JD',
        da_planning: 2,
        prestart: 0,
        schematic_design: 1,
        siting: 0,
        variation: 1,
        working_drawings: 2,
    },
    {
        drafter: 'AG',
        da_planning: 1,
        prestart: 2,
        schematic_design: 0,
        siting: 1,
        variation: 0,
        working_drawings: 3,
    },
    {
        drafter: 'AM',
        da_planning: 0,
        prestart: 1,
        schematic_design: 2,
        siting: 2,
        variation: 1,
        working_drawings: 0,
    },
    {
        drafter: 'DBO',
        da_planning: 2,
        prestart: 0,
        schematic_design: 1,
        siting: 1,
        variation: 0,
        working_drawings: 2,
    },
    {
        drafter: 'LM',
        da_planning: 1,
        prestart: 1,
        schematic_design: 0,
        siting: 0,
        variation: 2,
        working_drawings: 1,
    },
    {
        drafter: 'FV',
        da_planning: 0,
        prestart: 2,
        schematic_design: 2,
        siting: 1,
        variation: 0,
        working_drawings: 1,
    },
    {
        drafter: 'DB',
        da_planning: 1,
        prestart: 0,
        schematic_design: 1,
        siting: 2,
        variation: 1,
        working_drawings: 1,
    },
];

const JOB_STATUS_DATA = [
    { status: 'On Hold', count: 1, color: '#8b5cf6' },
    { status: 'For Checking', count: 4, color: '#3b82f6' },
    { status: 'New', count: 4, color: '#94a3b8' },
    { status: 'WIP', count: 5, color: '#f87171' },
];

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

function DrafterLeaderboardChart() {
    const [monthView, setMonthView] = useState('last');
    const chartColors = useChartColors();

    const data =
        monthView === 'last'
            ? LEADERBOARD_LAST_MONTH
            : LEADERBOARD_CURRENT_MONTH;

    const monthLabel =
        monthView === 'last' ? "Last Month's Leaderboard" : "Current Month's Leaderboard";

    return (
        <ChartPanel
            title="Drafter Leaderboard"
            icon={TrophyIcon}
            iconClassName="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
            toolbar={
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setMonthView('last')}
                        disabled={monthView === 'last'}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-sky-600 transition hover:bg-sky-50 disabled:cursor-default disabled:opacity-40 dark:text-sky-400 dark:hover:bg-sky-500/10"
                    >
                        <ChevronLeftIcon className="h-3.5 w-3.5" aria-hidden />
                        Prev
                    </button>
                    <button
                        type="button"
                        onClick={() => setMonthView('current')}
                        disabled={monthView === 'current'}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-sky-600 transition hover:bg-sky-50 disabled:cursor-default disabled:opacity-40 dark:text-sky-400 dark:hover:bg-sky-500/10"
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
                    onClick={() =>
                        setMonthView((current) =>
                            current === 'last' ? 'current' : 'last',
                        )
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                    aria-label="Filter leaderboard month"
                >
                    <FunnelIcon className="h-3.5 w-3.5" aria-hidden />
                    {monthView === 'last' ? 'Last month' : 'Current month'}
                </button>
            </div>

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
        </ChartPanel>
    );
}

function JobStatusChart() {
    const chartColors = useChartColors();

    return (
        <ChartPanel
            title="Job Status Chart"
            icon={ChartBarIcon}
            iconClassName="bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400"
            toolbar={
                <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                    aria-label="Filter job status chart"
                >
                    <FunnelIcon className="h-3.5 w-3.5" aria-hidden />
                    Filter
                </button>
            }
        >
            <p className="mb-4 text-sm font-medium text-slate-700 dark:text-slate-200">
                Chart by Status
            </p>

            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={JOB_STATUS_DATA}
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
                            {JOB_STATUS_DATA.map((entry) => (
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

export default function DashboardCharts() {
    return (
        <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <DrafterLeaderboardChart />
            <JobStatusChart />
        </div>
    );
}
