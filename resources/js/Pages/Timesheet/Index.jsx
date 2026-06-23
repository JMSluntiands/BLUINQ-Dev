import TeamLeaveTimesheet from '@/Components/Timesheet/TeamLeaveTimesheet';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Index({
    leaveCalendar = [],
    teamMembers = [],
    calendarMonth,
    filters = {},
}) {
    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className="text-xl font-semibold leading-tight text-slate-800 dark:text-slate-100">
                        Timesheet
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Team leave overview — approved leave only
                    </p>
                </div>
            }
        >
            <Head title="Timesheet" />

            <TeamLeaveTimesheet
                users={leaveCalendar}
                teamMembers={teamMembers}
                calendarMonth={calendarMonth}
                filters={filters}
            />
        </AuthenticatedLayout>
    );
}
