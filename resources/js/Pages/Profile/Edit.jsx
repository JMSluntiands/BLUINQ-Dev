import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UserProfileForm from './Partials/UserProfileForm';
import WeeklyTimesheet from './Partials/WeeklyTimesheet';

export default function Edit({
    profile,
    weeklyTimesheet,
    passwordChangeRequest,
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

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-gray-800/80 dark:bg-[#0a0e14] dark:shadow-xl dark:shadow-black/20 sm:p-6">
                    <UpdatePasswordForm
                        className="max-w-xl"
                        passwordChangeRequest={passwordChangeRequest}
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
