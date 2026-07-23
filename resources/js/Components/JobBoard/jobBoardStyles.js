/** @type {Record<string, string>} */
export const JOB_STATUS_STYLES = {
    new: 'border border-slate-300 bg-slate-100 !text-slate-800 dark:border-slate-500 dark:!bg-slate-600 dark:!text-white',
    assigned:
        'border border-blue-300 bg-blue-100 !text-blue-900 dark:border-blue-400 dark:!bg-blue-600 dark:!text-white',
    design_wip:
        'border border-fuchsia-300 bg-fuchsia-100 !text-fuchsia-900 dark:border-fuchsia-400 dark:!bg-fuchsia-600 dark:!text-white',
    drafting_wip:
        'border border-rose-300 bg-rose-100 !text-rose-900 dark:border-rose-400 dark:!bg-[#f08080] dark:!text-white',
    wip: 'border border-rose-300 bg-rose-100 !text-rose-900 dark:border-rose-400 dark:!bg-[#f08080] dark:!text-white',
    for_checking:
        'border border-cyan-300 bg-cyan-100 !text-cyan-900 dark:border-cyan-400 dark:!bg-cyan-600 dark:!text-white',
    query: 'border border-amber-300 bg-amber-100 !text-amber-900 dark:border-amber-400 dark:!bg-amber-500 dark:!text-white',
    submitted:
        'border border-emerald-300 bg-emerald-100 !text-emerald-900 dark:border-emerald-400 dark:!bg-emerald-600 dark:!text-white',
    on_hold:
        'border border-violet-300 bg-violet-100 !text-violet-900 dark:border-violet-400 dark:!bg-violet-600 dark:!text-white',
    cancelled:
        'border border-rose-300 bg-rose-100 !text-rose-900 dark:border-rose-400 dark:!bg-rose-600 dark:!text-white',
    for_quote:
        'border border-indigo-300 bg-indigo-100 !text-indigo-900 dark:border-indigo-400 dark:!bg-indigo-600 dark:!text-white',
    quote_sent:
        'border border-purple-300 bg-purple-100 !text-purple-900 dark:border-purple-400 dark:!bg-purple-600 dark:!text-white',
    invoiced:
        'border border-teal-300 bg-teal-100 !text-teal-900 dark:border-teal-400 dark:!bg-teal-600 dark:!text-white',
    paid: 'border border-green-300 bg-green-100 !text-green-900 dark:border-green-400 dark:!bg-green-600 dark:!text-white',
};

/** @type {Record<string, string>} */
export const JOB_STATUS_LABELS = {
    new: 'New',
    assigned: 'Assigned',
    design_wip: 'Design WIP',
    drafting_wip: 'Drafting WIP',
    wip: 'WIP',
    for_checking: 'For Checking',
    query: 'Query',
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
    'design_wip',
    'drafting_wip',
    'wip',
    'for_checking',
    'query',
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
