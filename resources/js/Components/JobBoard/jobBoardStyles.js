/** @type {Record<string, string>} */
export const JOB_STATUS_STYLES = {
    for_checking:
        'bg-cyan-500/90 text-white dark:bg-cyan-500 dark:text-white',
    wip: 'bg-[#f08080] text-white dark:bg-[#f08080] dark:text-white',
    new: 'bg-slate-500/90 text-white dark:bg-slate-500 dark:text-white',
    on_hold:
        'bg-violet-600/90 text-white dark:bg-violet-600 dark:text-white',
    pending:
        'border border-amber-400/80 bg-amber-50 text-amber-700 dark:border-amber-500/70 dark:bg-[#1a1b2e] dark:text-amber-400',
    allocated:
        'bg-slate-500/90 text-white dark:bg-slate-500 dark:text-white',
    in_progress:
        'bg-[#f08080] text-white dark:bg-[#f08080] dark:text-white',
    completed:
        'bg-cyan-500/90 text-white dark:bg-cyan-500 dark:text-white',
};

/** @type {Record<string, string>} */
export const JOB_STATUS_LABELS = {
    for_checking: 'For Checking',
    wip: 'WIP',
    new: 'New',
    on_hold: 'On Hold',
    pending: 'Pending',
    allocated: 'Allocated',
    in_progress: 'In progress',
    completed: 'Completed',
};

/** @type {string[]} */
export const STAFF_BADGE_COLORS = [
    'bg-violet-500',
    'bg-pink-500',
    'bg-fuchsia-500',
    'bg-orange-500',
    'bg-cyan-500',
    'bg-amber-400',
    'bg-emerald-500',
    'bg-rose-500',
    'bg-indigo-500',
    'bg-teal-500',
];

export function staffBadgeColor(initials) {
    const code = (initials ?? '')
        .split('')
        .reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return STAFF_BADGE_COLORS[code % STAFF_BADGE_COLORS.length];
}

export const TAG_PILL_CLASS =
    'inline-flex max-w-[7.5rem] items-center truncate rounded-md bg-[#e6f4ff] px-2 py-0.5 text-[11px] font-medium text-[#0073ea] dark:bg-[#2c5282] dark:text-blue-100';
