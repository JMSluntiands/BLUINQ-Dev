import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import UserProfileForm from './Partials/UserProfileForm';
import WeeklyTimesheet from './Partials/WeeklyTimesheet';

export default function Edit({
    profile,
    weeklyTimesheet,
    mustVerifyEmail,
    status,
}) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-slate-800 dark:text-slate-100">
                    Profile
                </h2>
            }
        >
            <Head title="Profile" />

            <div className="mx-auto max-w-6xl space-y-5">
                <UserProfileForm
                    profile={profile}
                    mustVerifyEmail={mustVerifyEmail}
                    status={status}
                />

                <WeeklyTimesheet weeklyTimesheet={weeklyTimesheet} />
            </div>
        </AuthenticatedLayout>
    );
}
