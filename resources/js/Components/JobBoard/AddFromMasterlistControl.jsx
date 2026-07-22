import Select2 from '@/Components/Select2';
import { PlusIcon } from '@heroicons/react/24/outline';
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

    return (
        <div className="flex w-full max-w-xl flex-col gap-2 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
                <Select2
                    id="add-from-masterlist"
                    value={selectedId}
                    onChange={setSelectedId}
                    options={options}
                    placeholder={
                        options.length
                            ? 'Select masterlist project…'
                            : 'No masterlist projects available'
                    }
                    allowClear
                    disabled={busy || options.length === 0}
                    className="w-full"
                />
            </div>
            <button
                type="button"
                onClick={submit}
                disabled={busy || !selectedId}
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#0073ea] px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0060c4] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#1890ff] dark:hover:bg-[#1478e0]"
            >
                <PlusIcon className="h-4 w-4" aria-hidden />
                {busy ? 'Adding…' : 'Add to board'}
            </button>
        </div>
    );
}
