import {
    Combobox,
    ComboboxButton,
    ComboboxInput,
    ComboboxOption,
    ComboboxOptions,
} from '@headlessui/react';
import { ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { useMemo, useState } from 'react';

/**
 * @typedef {{ value: string, label: string, description?: string }} SearchableSelectOption
 */

/**
 * @param {{
 *   value: string;
 *   onChange: (value: string) => void;
 *   options?: SearchableSelectOption[];
 *   placeholder?: string;
 *   className?: string;
 * }} props
 */
export default function SearchableSelect({
    value,
    onChange,
    options = [],
    placeholder = 'Search...',
    className = '',
}) {
    const [query, setQuery] = useState('');

    const selectedOption = useMemo(
        () => options.find((option) => option.value === value) ?? null,
        [options, value],
    );

    const filteredOptions = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        if (!normalizedQuery) {
            return options;
        }

        return options.filter((option) => {
            const label = option.label.toLowerCase();
            const description = (option.description ?? '').toLowerCase();

            return (
                label.includes(normalizedQuery) ||
                description.includes(normalizedQuery)
            );
        });
    }, [options, query]);

    return (
        <Combobox
            value={selectedOption}
            onChange={(option) => {
                if (option) {
                    onChange(option.value);
                }
                setQuery('');
            }}
            onClose={() => setQuery('')}
        >
            <div className={`relative min-w-[14rem] ${className}`}>
                <ComboboxInput
                    className="w-full rounded-lg border-slate-300 bg-white py-1.5 pe-9 ps-2.5 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    displayValue={(option) => option?.label ?? ''}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={placeholder}
                />
                <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronUpDownIcon
                        className="h-4 w-4 text-slate-400"
                        aria-hidden
                    />
                </ComboboxButton>

                <ComboboxOptions
                    anchor="bottom start"
                    className="z-50 mt-1 max-h-60 w-[var(--input-width)] overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg empty:invisible dark:border-slate-600 dark:bg-slate-800"
                >
                    {filteredOptions.length === 0 ? (
                        <p className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
                            No users found.
                        </p>
                    ) : (
                        filteredOptions.map((option) => (
                            <ComboboxOption
                                key={option.value}
                                value={option}
                                className="cursor-pointer px-3 py-2 text-sm text-slate-700 data-[focus]:bg-sky-50 data-[focus]:text-sky-700 dark:text-slate-200 dark:data-[focus]:bg-sky-500/10 dark:data-[focus]:text-sky-300"
                            >
                                <span className="block font-medium">
                                    {option.label}
                                </span>
                                {option.description && (
                                    <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                                        {option.description}
                                    </span>
                                )}
                            </ComboboxOption>
                        ))
                    )}
                </ComboboxOptions>
            </div>
        </Combobox>
    );
}
