import UserAvatar from '@/Components/UserAvatar';
import {
    ArrowTopRightOnSquareIcon,
    BriefcaseIcon,
    LinkIcon,
    LockClosedIcon,
    SparklesIcon,
    UserIcon,
} from '@heroicons/react/24/outline';
import { resolveBadgeInitials } from '@/utils/badgeInitials';
import { Link } from '@inertiajs/react';

function displayValue(value) {
    if (value === null || value === undefined || value === '') {
        return '—';
    }

    if (typeof value === 'string' && value.trim() === '') {
        return '—';
    }

    return String(value);
}

function ProfileDetailsSection({ title, icon: Icon, children, footer = null }) {
    return (
        <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white dark:border-gray-800/80 dark:bg-[#0b1018]">
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 dark:border-gray-800/80">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                    <Icon className="h-4 w-4" />
                </span>
                <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-gray-400">
                    {title}
                </h3>
            </div>
            <dl className="divide-y divide-slate-100 dark:divide-gray-800/80">
                {children}
            </dl>
            {footer}
        </section>
    );
}

function ProfileDetailItem({ label, value, children, className = '' }) {
    return (
        <div
            className={
                'grid gap-1 px-4 py-3 sm:grid-cols-[9.5rem_minmax(0,1fr)] sm:items-start sm:gap-4 ' +
                className
            }
        >
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-gray-500">
                {label}
            </dt>
            <dd className="text-sm leading-relaxed text-slate-800 dark:text-gray-200">
                {children ?? displayValue(value)}
            </dd>
        </div>
    );
}

function ProfileWideSection({ title, icon: Icon, children }) {
    return (
        <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white dark:border-gray-800/80 dark:bg-[#0b1018]">
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 dark:border-gray-800/80">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                    <Icon className="h-4 w-4" />
                </span>
                <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-gray-400">
                    {title}
                </h3>
            </div>
            <div className="px-4 py-3.5 text-sm leading-relaxed text-slate-800 dark:text-gray-200">
                {children}
            </div>
        </section>
    );
}

function ExternalLink({ href, children }) {
    if (!href) {
        return (
            <span className="text-slate-400 dark:text-gray-600">
                No link added yet
            </span>
        );
    }

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-blue-500 transition hover:text-blue-400 hover:underline"
        >
            {children}
            <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 shrink-0" />
        </a>
    );
}

function formatDate(value) {
    if (!value) {
        return '—';
    }

    try {
        return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
            dateStyle: 'medium',
        });
    } catch {
        return value;
    }
}

function StaffPhotoBadge({ profileImageUrl, name, initials }) {
    return (
        <div className="relative shrink-0">
            <div
                className="pointer-events-none absolute -inset-1 rounded-full bg-blue-500/20 blur-md"
                aria-hidden
            />
            {profileImageUrl ? (
                <img
                    src={profileImageUrl}
                    alt=""
                    className="relative h-20 w-20 rounded-full object-cover ring-2 ring-white dark:ring-[#0a0e14] sm:h-24 sm:w-24"
                />
            ) : (
                <UserAvatar
                    user={{ name, initials }}
                    className="relative h-20 w-20 text-2xl ring-2 ring-white dark:ring-[#0a0e14] sm:h-24 sm:w-24"
                />
            )}
        </div>
    );
}

export default function UserProfileForm({
    profile,
    canViewPrivate = false,
    mustVerifyEmail,
    status,
    className = '',
}) {
    const nameInitials = resolveBadgeInitials(profile);
    const positionLabel = profile.position?.trim() ?? '';

    return (
        <section className={className}>
            <div className="space-y-4">
                {/* PUBLIC: identity + work information */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-gray-800/80 dark:bg-[#0a0e14] dark:shadow-xl dark:shadow-black/30">
                    <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-5 py-5 dark:border-gray-800/70 dark:from-[#0c111a] dark:via-[#0a0e14] dark:to-[#0c111a] sm:px-6">
                        <div className="flex flex-wrap items-start gap-4">
                            <div className="flex min-w-0 items-center gap-4">
                                <StaffPhotoBadge
                                    profileImageUrl={profile.profile_image_url}
                                    name={profile.name}
                                    initials={profile.initials}
                                />

                                <div className="min-w-0 space-y-1">
                                    <p className="text-2xl font-bold uppercase tracking-[0.1em] text-slate-900 dark:text-white">
                                        {nameInitials}
                                    </p>

                                    <p className="truncate text-sm font-medium text-slate-700 dark:text-gray-300">
                                        {profile.name}
                                    </p>

                                    {positionLabel ? (
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-500/90">
                                            {positionLabel}
                                        </p>
                                    ) : null}

                                    <p className="truncate text-sm text-slate-500 dark:text-gray-400">
                                        {profile.email}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 sm:p-6">
                        <ProfileDetailsSection
                            title="Work information"
                            icon={BriefcaseIcon}
                        >
                            <ProfileDetailItem
                                label="Full name"
                                value={profile.name}
                            />
                            <ProfileDetailItem
                                label="Initials"
                                value={
                                    profile.badge_initials ||
                                    resolveBadgeInitials(profile)
                                }
                            />
                            <ProfileDetailItem
                                label="Job title"
                                value={profile.job_title}
                            />
                        </ProfileDetailsSection>
                    </div>
                </div>

                <div
                    className={
                        canViewPrivate
                            ? 'grid gap-4 lg:grid-cols-2 lg:items-start'
                            : 'grid gap-4'
                    }
                >
                    {canViewPrivate ? (
                        <ProfileDetailsSection
                            title="Employment details"
                            icon={LockClosedIcon}
                            footer={
                                <div className="border-t border-slate-100 dark:border-gray-800/80">
                                    <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 dark:border-gray-800/80">
                                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                                            <LinkIcon className="h-4 w-4" />
                                        </span>
                                        <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-gray-400">
                                            Links & resources
                                        </h3>
                                    </div>
                                    <dl className="divide-y divide-slate-100 dark:divide-gray-800/80">
                                        <ProfileDetailItem label="Claims">
                                            <ExternalLink
                                                href={profile.claims_excel_url}
                                            >
                                                Open claims spreadsheet
                                            </ExternalLink>
                                        </ProfileDetailItem>
                                        <ProfileDetailItem label="SharePoint">
                                            <ExternalLink
                                                href={
                                                    profile.personal_file_url
                                                }
                                            >
                                                Open personal file
                                            </ExternalLink>
                                        </ProfileDetailItem>
                                    </dl>
                                </div>
                            }
                        >
                            <ProfileDetailItem
                                label="Date hired"
                                value={formatDate(profile.date_hired)}
                            />
                            <ProfileDetailItem
                                label="Employment status"
                                value={
                                    profile.leave_balances
                                        ?.employment_status_label ??
                                    profile.employment_status ??
                                    'Regular'
                                }
                            />
                            <ProfileDetailItem
                                label="Annual Leave (AL)"
                                value={String(
                                    profile.leave_balances?.al_available ??
                                        profile.leave_credits ??
                                        0,
                                )}
                            />
                            <ProfileDetailItem
                                label="Sick Leave (SL)"
                                value={String(
                                    profile.leave_balances?.sl_credits ?? 0,
                                )}
                            />
                            <ProfileDetailItem
                                label="Medical remaining (SL+HL)"
                                value={String(
                                    profile.leave_balances
                                        ?.medical_remaining ?? 0,
                                )}
                            />
                        </ProfileDetailsSection>
                    ) : null}

                    <div className="space-y-4">
                        <ProfileDetailsSection title="Personal" icon={UserIcon}>
                            <ProfileDetailItem
                                label="Birthday"
                                value={formatDate(profile.birthday)}
                            />
                            <ProfileDetailItem
                                label="Details"
                                value={profile.personal_details}
                                className="sm:items-start"
                            />
                        </ProfileDetailsSection>

                        <ProfileWideSection
                            title="Achievements / milestones"
                            icon={SparklesIcon}
                        >
                            {(profile.milestones ?? []).length === 0 ? (
                                <p className="text-slate-400 dark:text-gray-600">
                                    No milestones recorded yet.
                                </p>
                            ) : (
                                <div className="-mx-4 overflow-x-auto sm:mx-0">
                                    <table className="min-w-full divide-y divide-slate-100 dark:divide-gray-800/80">
                                        <thead>
                                            <tr>
                                                <th className="px-4 pb-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-gray-500">
                                                    Date
                                                </th>
                                                <th className="px-4 pb-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-gray-500">
                                                    Achievement / milestone
                                                </th>
                                                <th className="px-4 pb-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-gray-500">
                                                    Impact / result
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-gray-800/80">
                                            {profile.milestones.map(
                                                (milestone) => (
                                                    <tr
                                                        key={milestone.id}
                                                        className="align-top"
                                                    >
                                                        <td className="whitespace-nowrap px-4 py-2.5 font-medium tabular-nums">
                                                            {
                                                                milestone.milestone_date_label
                                                            }
                                                        </td>
                                                        <td className="px-4 py-2.5">
                                                            {milestone.title}
                                                        </td>
                                                        <td className="px-4 py-2.5 text-slate-600 dark:text-gray-400">
                                                            {milestone.impact_result?.trim()
                                                                ? milestone.impact_result
                                                                : '—'}
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </ProfileWideSection>
                    </div>
                </div>

                {mustVerifyEmail && profile.email_verified_at === null && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                        Your email address is unverified.
                        <Link
                            href={route('verification.send')}
                            method="post"
                            as="button"
                            className="ms-1 underline hover:text-amber-950 dark:hover:text-white"
                        >
                            Click here to re-send the verification email.
                        </Link>
                        {status === 'verification-link-sent' && (
                            <p className="mt-2 font-medium">
                                A new verification link has been sent to your
                                email address.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}
