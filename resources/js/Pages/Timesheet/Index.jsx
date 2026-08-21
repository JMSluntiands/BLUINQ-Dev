import TeamLeaveTimesheet from '@/Components/Timesheet/TeamLeaveTimesheet';
import WeeklyTimesheet from '@/Pages/Profile/Partials/WeeklyTimesheet';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Index({
    mode = 'personal',
    canViewAllTimesheets = false,
    leaveCalendar = [],
    teamMembers = [],
    calendarMonth,
    filters = {},
    weeklyTimesheet = null,
    canApproveTimesheet = false,
}) {
    const isTeamMode = canViewAllTimesheets || mode === 'team';
    const isWeeklyMode = !isTeamMode && mode === 'weekly';

    const headerTitle = isTeamMode ? 'Timesheet' : 'My timesheet';
    const headerDescription = isTeamMode
        ? 'Team leave overview — approved leave only'
        : isWeeklyMode
          ? 'Weekly hours, tasks, and overtime'
          : 'Your leave and public holidays';

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className="text-xl font-semibold leading-tight text-slate-800 dark:text-slate-100">
                        {headerTitle}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {headerDescription}
                    </p>
                </div>
            }
        >
            <Head title={headerTitle} />

            {isWeeklyMode ? (
                <WeeklyTimesheet
                    weeklyTimesheet={weeklyTimesheet}
                    canApprove={canApproveTimesheet}
                />
            ) : (
                <TeamLeaveTimesheet
                    users={leaveCalendar}
                    teamMembers={teamMembers}
                    calendarMonth={calendarMonth}
                    filters={filters}
                    showUserFilter={isTeamMode}
                />
            )}
        </AuthenticatedLayout>
    );
}
