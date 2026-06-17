import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import WeeklyTimesheet from '@/Pages/Profile/Partials/WeeklyTimesheet';
import { Head } from '@inertiajs/react';

export default function Index() {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-slate-800 dark:text-slate-100">
                    Timesheet
                </h2>
            }
        >
            <Head title="Timesheet" />

            <div className="mx-auto max-w-6xl">
                <WeeklyTimesheet />
            </div>
        </AuthenticatedLayout>
    );
}
