import {
    MagnifyingGlassIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';
import { useEffect, useId, useRef, useState } from 'react';

/**
 * @typedef {{ id: number; title: string; subtitle: string|null; url: string }} SearchResult
 * @typedef {{ type: string; label: string; results: SearchResult[] }} SearchGroup
 */

export default function GlobalSearch() {
    const inputId = useId();
    const containerRef = useRef(null);
    const inputRef = useRef(null);
    const debounceRef = useRef(null);
    const abortRef = useRef(null);

    const [query, setQuery] = useState('');
    const [groups, setGroups] = useState(/** @type {SearchGroup[]} */ ([]));
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    const flatResults = groups.flatMap((group) =>
        group.results.map((result) => ({ ...result, groupLabel: group.label })),
    );

    useEffect(() => {
        const onKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
                setOpen(true);
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    useEffect(() => {
        const onPointerDown = (e) => {
            if (!containerRef.current?.contains(e.target)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', onPointerDown);
        return () => document.removeEventListener('mousedown', onPointerDown);
    }, []);

    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
            abortRef.current?.abort();
        };
    }, []);

    const runSearch = (value) => {
        const trimmed = value.trim();

        if (trimmed.length < 2) {
            abortRef.current?.abort();
            setGroups([]);
            setLoading(false);
            setActiveIndex(-1);
            return;
        }

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        setLoading(true);

        window.axios
            .get(route('search'), {
                params: { q: trimmed },
                signal: controller.signal,
            })
            .then(({ data }) => {
                setGroups(data.groups ?? []);
                setActiveIndex(-1);
            })
            .catch((error) => {
                if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') {
                    return;
                }
                setGroups([]);
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            });
    };

    const handleChange = (e) => {
        const value = e.target.value;
        setQuery(value);
        setOpen(true);

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            runSearch(value);
        }, 250);
    };

    const clear = () => {
        setQuery('');
        setGroups([]);
        setActiveIndex(-1);
        setLoading(false);
        abortRef.current?.abort();
        inputRef.current?.focus();
    };

    const goTo = (url) => {
        setOpen(false);
        setQuery('');
        setGroups([]);
        setActiveIndex(-1);
        router.visit(url);
    };

    const showPanel = open && query.trim().length >= 2;
    const hasResults = flatResults.length > 0;

    const handleKeyDown = (e) => {
        if (!showPanel) {
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex((i) =>
                flatResults.length === 0 ? -1 : (i + 1) % flatResults.length,
            );
            return;
        }

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((i) =>
                flatResults.length === 0
                    ? -1
                    : (i - 1 + flatResults.length) % flatResults.length,
            );
            return;
        }

        if (e.key === 'Enter' && activeIndex >= 0 && flatResults[activeIndex]) {
            e.preventDefault();
            goTo(flatResults[activeIndex].url);
            return;
        }

        if (e.key === 'Escape') {
            e.preventDefault();
            setOpen(false);
            inputRef.current?.blur();
        }
    };

    return (
        <div ref={containerRef} className="relative mx-auto w-full max-w-xl min-w-0 flex-1 px-1 sm:px-2">
            <label htmlFor={inputId} className="sr-only">
                Search
            </label>
            <div className="relative">
                <MagnifyingGlassIcon
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                    aria-hidden
                />
                <input
                    ref={inputRef}
                    id={inputId}
                    type="search"
                    value={query}
                    onChange={handleChange}
                    onFocus={() => setOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    role="combobox"
                    aria-expanded={showPanel}
                    aria-controls={`${inputId}-results`}
                    aria-autocomplete="list"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-20 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-400 dark:focus:bg-slate-800 dark:focus:ring-sky-400/25"
                />
                <div className="absolute inset-y-0 right-2 flex items-center gap-1">
                    {query !== '' && (
                        <button
                            type="button"
                            onClick={clear}
                            className="rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                            aria-label="Clear search"
                        >
                            <XMarkIcon className="h-4 w-4" aria-hidden />
                        </button>
                    )}
                    <kbd className="hidden rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-500 sm:inline">
                        {typeof navigator !== 'undefined' &&
                        /Mac|iPhone|iPad/.test(navigator.platform)
                            ? '⌘K'
                            : 'Ctrl K'}
                    </kbd>
                </div>
            </div>

            {showPanel && (
                <div
                    id={`${inputId}-results`}
                    role="listbox"
                    className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[min(24rem,70vh)] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900"
                >
                    {loading && !hasResults && (
                        <p className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                            Searching…
                        </p>
                    )}

                    {!loading && !hasResults && (
                        <p className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                            No results for “{query.trim()}”
                        </p>
                    )}

                    {hasResults &&
                        groups.map((group) => (
                            <div key={group.type} className="border-b border-slate-100 last:border-b-0 dark:border-slate-800">
                                <p className="px-3 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                                    {group.label}
                                </p>
                                <ul className="pb-1">
                                    {group.results.map((result) => {
                                        const flatIndex = flatResults.findIndex(
                                            (item) =>
                                                item.url === result.url &&
                                                item.id === result.id &&
                                                item.groupLabel === group.label,
                                        );
                                        const isActive = flatIndex === activeIndex;

                                        return (
                                            <li key={`${group.type}-${result.id}`}>
                                                <button
                                                    type="button"
                                                    role="option"
                                                    aria-selected={isActive}
                                                    onMouseEnter={() => setActiveIndex(flatIndex)}
                                                    onClick={() => goTo(result.url)}
                                                    className={
                                                        'flex w-full flex-col gap-0.5 px-3 py-2 text-left transition ' +
                                                        (isActive
                                                            ? 'bg-sky-50 dark:bg-sky-950/40'
                                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/80')
                                                    }
                                                >
                                                    <span className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                                                        {result.title}
                                                    </span>
                                                    {result.subtitle && (
                                                        <span className="truncate text-xs text-slate-500 dark:text-slate-400">
                                                            {result.subtitle}
                                                        </span>
                                                    )}
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
}
