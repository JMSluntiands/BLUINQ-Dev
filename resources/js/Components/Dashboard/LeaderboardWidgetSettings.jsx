import {
    ChevronDownIcon,
    Cog6ToothIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'bluinq-leaderboard-widget-settings';

export const DEFAULT_LEADERBOARD_WIDGET_SETTINGS = {
    chartType: 'stacked',
    selectedDrafters: [],
    visibleSeries: [],
    showLegend: true,
    showGrid: true,
    showBarLabels: true,
    panelOpen: true,
};

function SettingsSection({ title, defaultOpen = false, children }) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="border-b border-slate-200 dark:border-slate-700">
            <button
                type="button"
                onClick={() => setOpen((current) => !current)}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-slate-800 transition hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800/60"
            >
                <span>{title}</span>
                <ChevronDownIcon
                    className={
                        'h-4 w-4 shrink-0 text-slate-400 transition-transform ' +
                        (open ? 'rotate-180' : '')
                    }
                    aria-hidden
                />
            </button>
            {open && <div className="space-y-3 px-4 pb-4">{children}</div>}
        </div>
    );
}

function FieldLabel({ children }) {
    return (
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {children}
        </p>
    );
}

export function saveLeaderboardWidgetSettings(settings) {
    if (typeof window === 'undefined') {
        return;
    }

    const { panelOpen: _panelOpen, ...persisted } = settings;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
}

export function loadLeaderboardWidgetSettings(seriesKeys) {
    if (typeof window === 'undefined') {
        return {
            ...DEFAULT_LEADERBOARD_WIDGET_SETTINGS,
            visibleSeries: seriesKeys,
        };
    }

    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return {
                ...DEFAULT_LEADERBOARD_WIDGET_SETTINGS,
                visibleSeries: seriesKeys,
            };
        }

        const parsed = JSON.parse(raw);

        return {
            ...DEFAULT_LEADERBOARD_WIDGET_SETTINGS,
            ...parsed,
            panelOpen: true,
            visibleSeries:
                Array.isArray(parsed.visibleSeries) &&
                parsed.visibleSeries.length > 0
                    ? parsed.visibleSeries.filter((key) =>
                          seriesKeys.includes(key),
                      )
                    : seriesKeys,
            selectedDrafters: Array.isArray(parsed.selectedDrafters)
                ? parsed.selectedDrafters
                : [],
        };
    } catch {
        return {
            ...DEFAULT_LEADERBOARD_WIDGET_SETTINGS,
            visibleSeries: seriesKeys,
        };
    }
}

export default function LeaderboardWidgetSettings({
    settings,
    onChange,
    onClose,
    drafters,
    series,
}) {
    const update = (patch) => {
        onChange({ ...settings, ...patch });
    };

    const allDraftersSelected =
        settings.selectedDrafters.length === 0 ||
        settings.selectedDrafters.length === drafters.length;
    const allSeriesSelected =
        settings.visibleSeries.length === series.length;

    const toggleDrafter = (drafter) => {
        const active =
            settings.selectedDrafters.length === 0
                ? [...drafters]
                : [...settings.selectedDrafters];
        const next = active.includes(drafter)
            ? active.filter((item) => item !== drafter)
            : [...active, drafter];

        update({
            selectedDrafters:
                next.length === drafters.length ? [] : next,
        });
    };

    const toggleSeries = (key) => {
        const next = settings.visibleSeries.includes(key)
            ? settings.visibleSeries.filter((item) => item !== key)
            : [...settings.visibleSeries, key];

        if (next.length === 0) {
            return;
        }

        update({ visibleSeries: next });
    };

    return (
        <aside className="pointer-events-auto relative z-10 flex max-h-[32rem] w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                <div className="flex items-center gap-2">
                    <Cog6ToothIcon
                        className="h-4 w-4 text-slate-500 dark:text-slate-400"
                        aria-hidden
                    />
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                        Widget settings
                    </h4>
                </div>
            <button
                type="button"
                onClick={onClose}
                className="relative z-10 cursor-pointer rounded-md p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                aria-label="Close widget settings"
            >
                    <XMarkIcon className="h-4 w-4" aria-hidden />
                </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
                <SettingsSection title="Chart type">
                    <FieldLabel>Visualization</FieldLabel>
                    <select
                        value={settings.chartType}
                        onChange={(event) =>
                            update({ chartType: event.target.value })
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                    >
                        <option value="stacked">Stacked bar</option>
                        <option value="grouped">Grouped bar</option>
                    </select>
                </SettingsSection>

                <SettingsSection title="X-axis" defaultOpen>
                    <FieldLabel>People</FieldLabel>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => update({ selectedDrafters: [] })}
                            className={
                                'rounded-full px-2.5 py-1 text-xs font-medium transition ' +
                                (allDraftersSelected
                                    ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300'
                                    : 'bg-white text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-600')
                            }
                        >
                            All drafters
                        </button>
                    </div>
                    <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
                        {drafters.length === 0 ? (
                            <p className="px-1 py-2 text-xs text-slate-500 dark:text-slate-400">
                                No drafters for this month.
                            </p>
                        ) : (
                            drafters.map((drafter) => {
                                const checked =
                                    settings.selectedDrafters.length === 0 ||
                                    settings.selectedDrafters.includes(
                                        drafter,
                                    );

                                return (
                                    <label
                                        key={drafter}
                                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() =>
                                                toggleDrafter(drafter)
                                            }
                                            className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 dark:border-slate-600"
                                        />
                                        <span>{drafter}</span>
                                    </label>
                                );
                            })
                        )}
                    </div>
                </SettingsSection>

                <SettingsSection title="Stack by">
                    <FieldLabel>Category</FieldLabel>
                    <div className="space-y-1.5">
                        {series.map((item) => (
                            <label
                                key={item.key}
                                className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-sm text-slate-700 dark:text-slate-200"
                            >
                                <input
                                    type="checkbox"
                                    checked={settings.visibleSeries.includes(
                                        item.key,
                                    )}
                                    onChange={() => toggleSeries(item.key)}
                                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 dark:border-slate-600"
                                />
                                <span
                                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                                    style={{ backgroundColor: item.color }}
                                />
                                <span>{item.label}</span>
                            </label>
                        ))}
                    </div>
                </SettingsSection>

                <SettingsSection title="Y-axis">
                    <FieldLabel>Measure</FieldLabel>
                    <select
                        value="count"
                        disabled
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                    >
                        <option value="count">Count</option>
                    </select>
                </SettingsSection>

                <SettingsSection title="Customize">
                    <label className="flex items-center justify-between gap-3 text-sm text-slate-700 dark:text-slate-200">
                        <span>Show legend</span>
                        <input
                            type="checkbox"
                            checked={settings.showLegend}
                            onChange={(event) =>
                                update({ showLegend: event.target.checked })
                            }
                            className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 dark:border-slate-600"
                        />
                    </label>
                    <label className="flex items-center justify-between gap-3 text-sm text-slate-700 dark:text-slate-200">
                        <span>Show grid lines</span>
                        <input
                            type="checkbox"
                            checked={settings.showGrid}
                            onChange={(event) =>
                                update({ showGrid: event.target.checked })
                            }
                            className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 dark:border-slate-600"
                        />
                    </label>
                    <label className="flex items-center justify-between gap-3 text-sm text-slate-700 dark:text-slate-200">
                        <span>Show bar labels</span>
                        <input
                            type="checkbox"
                            checked={settings.showBarLabels}
                            onChange={(event) =>
                                update({
                                    showBarLabels: event.target.checked,
                                })
                            }
                            className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 dark:border-slate-600"
                        />
                    </label>
                </SettingsSection>

                <SettingsSection title="Choose which columns to show">
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() =>
                                update({
                                    visibleSeries: series.map(
                                        (item) => item.key,
                                    ),
                                })
                            }
                            className={
                                'rounded-full px-2.5 py-1 text-xs font-medium transition ' +
                                (allSeriesSelected
                                    ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300'
                                    : 'bg-white text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-600')
                            }
                        >
                            All categories
                        </button>
                    </div>
                    <div className="space-y-1.5">
                        {series.map((item) => (
                            <label
                                key={`column-${item.key}`}
                                className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-sm text-slate-700 dark:text-slate-200"
                            >
                                <input
                                    type="checkbox"
                                    checked={settings.visibleSeries.includes(
                                        item.key,
                                    )}
                                    onChange={() => toggleSeries(item.key)}
                                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 dark:border-slate-600"
                                />
                                <span>{item.label}</span>
                            </label>
                        ))}
                    </div>
                </SettingsSection>
            </div>
        </aside>
    );
}

export function useLeaderboardWidgetSettings(seriesKeys) {
    const [settings, setSettings] = useState(() =>
        loadLeaderboardWidgetSettings(seriesKeys),
    );

    useEffect(() => {
        saveLeaderboardWidgetSettings(settings);
    }, [settings]);

    return [settings, setSettings];
}
