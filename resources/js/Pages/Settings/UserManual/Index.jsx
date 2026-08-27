import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

const SECTIONS = [
    {
        id: 'getting-started',
        title: '1. Getting started',
        body: [
            'Sign in with your BLUINQ account email and password.',
            'After login you land on the Dashboard. Use the left sidebar to open modules. You can minimize or hide the sidebar with the controls at the top.',
            'Open your profile from the bottom of the sidebar (or the account menu) to update your photo, password, and personal details.',
        ],
    },
    {
        id: 'dashboard',
        title: '2. Dashboard — clock in, activities & leave',
        body: [
            'Clock in: use Confirm Clock In, pick an activity, and if the activity is drafting or checking, select a project (searchable). Add an optional note, then save.',
            'While clocked in you can start/stop break, log more activities, and clock out when done.',
            'Save activity: logs work against your weekly timesheet. Drafting/checking activities also require a project.',
            'Leave: request leave from the dashboard leave controls. Managers approve requests under HR → Approvals (if you have access).',
            'Calendar: view leave/holidays and add personal calendar events where available.',
        ],
    },
    {
        id: 'announcements',
        title: '3. Announcements',
        body: [
            'Open Announcement from the sidebar to read company posts.',
            'You can like posts. Users with manage access can create, edit, archive, or restore announcements.',
        ],
    },
    {
        id: 'masterlist',
        title: '4. Project Masterlist',
        body: [
            'The masterlist holds accepted projects that are not yet on APM/DPM as active work.',
            'Encode or edit masterlist projects here (permission required).',
            'Projects stay on the masterlist until someone adds them to Archi or Design Project Management via Add item.',
        ],
    },
    {
        id: 'apm',
        title: '5. Archi Project Management (APM)',
        body: [
            'Open Workflow → Archi menu → Archi Project Management.',
            'Jobs are grouped by status: New, Work In Progress, For Checking, Submitted, Cancelled.',
            'Add item: choose a masterlist project, or a job that is already Submitted or Cancelled (to reopen with a new revision). Jobs in New / Assigned / WIP / For Checking do not appear here.',
            'Fill revision number, date, category, status, and optional link, then save. You return to the APM board table.',
            'Change status, assignees, priority, and other board fields directly on the table when you have edit permission.',
            'Open a job row to see full details, revisions, files, comments, and the job activity log.',
        ],
    },
    {
        id: 'dpm',
        title: '6. Design Project Management (DPM)',
        body: [
            'Open Workflow → Design menu → Design Project Management.',
            'Works like APM: status groups, Add item from masterlist or submitted/cancelled jobs, and board editing.',
            'Design Memos and Design Catalogue are under the same Design menu for design notes and catalogue items.',
        ],
    },
    {
        id: 'job-details',
        title: '7. Job details & revisions',
        body: [
            'From APM/DPM, open a job to view site details, checklist, files, comments, account links, and revisions.',
            'Add revisions from the job page when allowed. Deleting the last revision can return a job to the masterlist for Add item again.',
            'Archive moves finished or unused jobs out of the active board; restore them from Archive when needed.',
        ],
    },
    {
        id: 'timesheet',
        title: '8. Timesheet',
        body: [
            'Open Timesheet from the sidebar to review weekly hours from clock-in and logged activities.',
            'Users with view-all access can review other people’s timesheets. Approvals follow your role permissions.',
        ],
    },
    {
        id: 'statistic',
        title: '9. Statistic',
        body: [
            'Statistic shows job status charts for reporting (permission required).',
        ],
    },
    {
        id: 'hr',
        title: '10. HR (Approvals, Credits, Milestones)',
        body: [
            'Approvals: managers review leave requests (approve/reject).',
            'Credits: view or edit leave credit balances.',
            'Milestones: manage user milestone records where enabled.',
        ],
    },
    {
        id: 'settings',
        title: '11. Settings (admins & managers)',
        body: [
            'Workflow settings: building types, storey levels, statuses, categories, and other lookup lists used on forms and boards.',
            'Client list: maintain clients used on jobs.',
            'Other settings: user accounts, password change requests, roles, role permissions, and activity logs of write actions in the system.',
            'Only users with the matching permissions see each settings page.',
        ],
    },
    {
        id: 'tips',
        title: '12. Tips',
        body: [
            'Use the header search to find jobs and related records quickly.',
            'If a live page looks outdated after a deploy, hard refresh the browser (Ctrl+Shift+R).',
            'VPN: some VPN exit IPs may be blocked by hosting/firewall. Try another server, bypass BLUINQ domains, or disconnect VPN if the site will not load.',
            'Need access you do not have? Ask an administrator to update your role permissions.',
        ],
    },
];

function ManualSection({ id, title, body }) {
    return (
        <section id={id} className="scroll-mt-24">
            <h3 className="text-base font-semibold text-[#323338] dark:text-white">
                {title}
            </h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[#676879] dark:text-slate-300">
                {body.map((item) => (
                    <li key={item}>{item}</li>
                ))}
            </ul>
        </section>
    );
}

export default function UserManualIndex() {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-[#323338] dark:text-white">
                    User manual
                </h2>
            }
        >
            <Head title="User manual" />

            <div className="space-y-6">
                <div className="rounded-xl border border-[#e6e6e6] bg-white p-6 shadow-sm dark:border-[#2f3347] dark:bg-[#1a222e] sm:p-8">
                    <p className="text-sm leading-relaxed text-[#676879] dark:text-slate-300">
                        How to use BLUINQ day to day — dashboard attendance,
                        masterlist, APM/DPM boards, timesheets, leave, and
                        settings. What you can open depends on your role
                        permissions.
                    </p>

                    <nav
                        aria-label="Manual sections"
                        className="mt-5 flex flex-wrap gap-2"
                    >
                        {SECTIONS.map((section) => (
                            <a
                                key={section.id}
                                href={`#${section.id}`}
                                className="rounded-full border border-[#c5c7d0] bg-white px-3 py-1 text-xs font-medium text-[#323338] transition hover:border-[#0073ea] hover:text-[#0073ea] dark:border-[#2f3347] dark:bg-[#151622] dark:text-slate-200 dark:hover:border-sky-500 dark:hover:text-sky-400"
                            >
                                {section.title.replace(/^\d+\.\s*/, '')}
                            </a>
                        ))}
                    </nav>
                </div>

                <div className="space-y-8 rounded-xl border border-[#e6e6e6] bg-white p-6 shadow-sm dark:border-[#2f3347] dark:bg-[#1a222e] sm:p-8">
                    {SECTIONS.map((section) => (
                        <ManualSection key={section.id} {...section} />
                    ))}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
