/** @type {Record<string, string>} */
export const DRAFTING_STATUS_PILL_STYLES = {
    allocated: 'border-blue-200 bg-blue-50 text-blue-800',
    pending: 'border-amber-200 bg-amber-50 text-amber-800',
    in_progress: 'border-violet-200 bg-violet-50 text-violet-800',
    completed: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    on_hold: 'border-slate-200 bg-slate-50 text-slate-700',
};

export function draftingStatusPillClass(status) {
    return (
        DRAFTING_STATUS_PILL_STYLES[status] ??
        'border-[#c5c7d0] bg-[#f6f7fb] text-[#676879]'
    );
}
