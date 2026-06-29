/** @type {Record<string, string>} */
export const JOB_STATUS_STYLES = {
    new: 'bg-slate-500/90 text-white dark:bg-slate-500 dark:text-white',
    assigned: 'bg-blue-500/90 text-white dark:bg-blue-500 dark:text-white',
    wip: 'bg-[#f08080] text-white dark:bg-[#f08080] dark:text-white',
    for_checking:
        'bg-cyan-500/90 text-white dark:bg-cyan-500 dark:text-white',
    submitted:
        'bg-emerald-500/90 text-white dark:bg-emerald-500 dark:text-white',
    on_hold:
        'bg-violet-600/90 text-white dark:bg-violet-600 dark:text-white',
    cancelled: 'bg-rose-500/90 text-white dark:bg-rose-500 dark:text-white',
    for_quote:
        'bg-indigo-500/90 text-white dark:bg-indigo-500 dark:text-white',
    quote_sent:
        'bg-purple-500/90 text-white dark:bg-purple-500 dark:text-white',
    invoiced: 'bg-teal-500/90 text-white dark:bg-teal-500 dark:text-white',
    paid: 'bg-green-600/90 text-white dark:bg-green-600 dark:text-white',
};

/** @type {Record<string, string>} */
export const JOB_STATUS_LABELS = {
    new: 'New',
    assigned: 'Assigned',
    wip: 'WIP',
    for_checking: 'For Checking',
    submitted: 'Submitted',
    on_hold: 'On Hold',
    cancelled: 'Cancelled',
    for_quote: 'For Quote',
    quote_sent: 'Quote Sent',
    invoiced: 'Invoiced',
    paid: 'Paid',
};

/** Board column order when jobs are split into status tables. */
export const JOB_BOARD_STATUS_ORDER = [
    'new',
    'assigned',
    'wip',
    'for_checking',
    'submitted',
    'on_hold',
    'cancelled',
    'for_quote',
    'quote_sent',
    'invoiced',
    'paid',
];

/** Job list page sections. */
export const JOB_LIST_SECTIONS = [
    { key: 'drafting_wip', label: 'Drafting - Work In Progress' },
    { key: 'design_wip', label: 'Design - Work In Progress' },
    { key: 'for_quotes', label: 'For Quotes' },
    { key: 'completed_projects', label: 'Completed Projects' },
    { key: 'cancelled_jobs', label: 'Cancelled Jobs' },
];

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
