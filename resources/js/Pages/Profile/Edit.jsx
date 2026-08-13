import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ArrowLeftIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { Head, Link } from '@inertiajs/react';
import UserProfileForm from './Partials/UserProfileForm';

export default function Edit({
    profile,
    canViewPrivate = false,
    mustVerifyEmail,
    status,
    backUrl = null,
    editAccountUrl = null,
}) {
    const title = backUrl ? `${profile.name} — Profile` : 'Profile';

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        {backUrl ? (
                            <Link
                                href={backUrl}
                                className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400"
                            >
                                <ArrowLeftIcon className="h-4 w-4" />
                                Back to user accounts
                            </Link>
                        ) : null}
                        <h2 className="text-xl font-semibold leading-tight text-slate-800 dark:text-slate-100">
                            {backUrl ? profile.name : 'Profile'}
                        </h2>
                        {backUrl ? (
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Full user profile
                            </p>
                        ) : null}
                    </div>
                    {editAccountUrl ? (
                        <Link
                            href={editAccountUrl}
                            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                            <PencilSquareIcon className="h-4 w-4" />
                            Edit account
                        </Link>
                    ) : null}
                </div>
            }
        >
            <Head title={title} />

            <div className="mx-auto max-w-6xl">
                <UserProfileForm
                    profile={profile}
                    canViewPrivate={canViewPrivate}
                    mustVerifyEmail={mustVerifyEmail}
                    status={status}
                />
            </div>
        </AuthenticatedLayout>
    );
}
