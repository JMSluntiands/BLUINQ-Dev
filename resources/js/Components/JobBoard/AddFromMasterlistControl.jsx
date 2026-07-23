import Select2 from '@/Components/Select2';
import { PlusIcon, QueueListIcon } from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';
import { useState } from 'react';

/**
 * @param {{
 *   candidates?: Array<{ id: number; value: string; label: string; lead_no: string }>;
 * }} props
 */
export default function AddFromMasterlistControl({ candidates = [] }) {
    const [selectedId, setSelectedId] = useState('');
    const [busy, setBusy] = useState(false);

    const submit = () => {
        if (!selectedId || busy) {
            return;
        }

        setBusy(true);
        router.post(
            route('job.masterlist.forward', selectedId),
            { redirect: 'show' },
            {
                preserveScroll: true,
                onFinish: () => setBusy(false),
            },
        );
    };

    const options = candidates.map((row) => ({
        value: row.value,
        label: row.label,
    }));
    const empty = options.length === 0;
    const canSubmit = Boolean(selectedId) && !busy && !empty;

    return (
        <div className="w-full max-w-md lg:max-w-lg">
            <div className="mb-1.5 flex items-center gap-2">
                <QueueListIcon
                    className="h-3.5 w-3.5 text-[#676879] dark:text-slate-400"
                    aria-hidden
                />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[#676879] dark:text-slate-400">
                    Add from masterlist
                </span>
                {!empty && (
                    <span className="rounded-full bg-[#e6e9ef] px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-[#676879] dark:bg-[#2a2d3e] dark:text-slate-300">
                        {options.length}
                    </span>
                )}
            </div>

            <div className="flex overflow-hidden rounded-lg border border-[#c5c7d0] bg-white shadow-sm dark:border-[#2f3347] dark:bg-[#151622] dark:shadow-none">
                <div className="select2-field add-from-masterlist-select min-w-0 flex-1">
                    <Select2
                        id="add-from-masterlist"
                        value={selectedId}
                        onChange={setSelectedId}
                        options={options}
                        placeholder={
                            empty
                                ? 'No projects available'
                                : 'Select project…'
                        }
                        allowClear
                        disabled={busy || empty}
                        className="w-full"
                    />
                </div>
                <button
                    type="button"
                    onClick={submit}
                    disabled={!canSubmit}
                    className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 border-l border-[#c5c7d0] bg-[#0073ea] px-3.5 text-xs font-semibold text-white transition hover:bg-[#0060c4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0073ea] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-[#c5c7d0] disabled:text-white/80 dark:border-[#2f3347] dark:hover:bg-[#1478e0] dark:disabled:bg-[#2a2d3e] dark:disabled:text-slate-500"
                >
                    <PlusIcon className="h-4 w-4" aria-hidden />
                    <span className="hidden sm:inline">
                        {busy ? 'Adding…' : 'Add to board'}
                    </span>
                    <span className="sm:hidden">{busy ? '…' : 'Add'}</span>
                </button>
            </div>
        </div>
    );
}
