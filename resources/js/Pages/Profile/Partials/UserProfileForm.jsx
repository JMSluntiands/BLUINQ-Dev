import UserAvatar from '@/Components/UserAvatar';
import {
    ArrowTopRightOnSquareIcon,
    BriefcaseIcon,
    BuildingLibraryIcon,
    HeartIcon,
    HomeIcon,
    IdentificationIcon,
    LinkIcon,
    LockClosedIcon,
    PhoneIcon,
    SparklesIcon,
    UserGroupIcon,
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

function ProfileAddressFields({ profile, prefix }) {
    const rows = [
        ['Unit / street', profile[`${prefix}_unit_street`]],
        ['Barangay', profile[`${prefix}_barangay`]],
        ['City', profile[`${prefix}_city`]],
        ['State / province', profile[`${prefix}_state`]],
        ['Region', profile[`${prefix}_region`]],
        ['Country', profile[`${prefix}_country`]],
        ['Post / ZIP', profile[`${prefix}_postcode`]],
    ];

    const formatted = profile[`${prefix}_address`];

    if (rows.every(([, value]) => !value) && formatted) {
        return (
            <ProfileDetailItem
                label="Address"
                value={formatted}
                className="sm:items-start"
            />
        );
    }

    return rows.map(([label, value]) => (
        <ProfileDetailItem
            key={`${prefix}-${label}`}
            label={`${label}`}
            value={value}
        />
    ));
}

function EmploymentSection({ profile }) {
    return (
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
                            <ExternalLink href={profile.claims_excel_url}>
                                Open claims spreadsheet
                            </ExternalLink>
                        </ProfileDetailItem>
                        <ProfileDetailItem label="SharePoint">
                            <ExternalLink href={profile.personal_file_url}>
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
            {profile.last_day ? (
                <ProfileDetailItem
                    label="Last day"
                    value={formatDate(profile.last_day)}
                />
            ) : null}
            <ProfileDetailItem
                label="Employment status"
                value={
                    profile.leave_balances?.employment_status_label ??
                    profile.employment_status ??
                    'Regular'
                }
            />
            <ProfileDetailItem
                label="Department"
                value={profile.department}
            />
            <ProfileDetailItem label="Branch" value={profile.branch} />
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
                value={String(profile.leave_balances?.sl_credits ?? 0)}
            />
            <ProfileDetailItem
                label="Medical remaining (SL+HL)"
                value={String(profile.leave_balances?.medical_remaining ?? 0)}
            />
        </ProfileDetailsSection>
    );
}

function MilestonesSection({ milestones = [] }) {
    return (
        <ProfileWideSection title="Achievements / milestones" icon={SparklesIcon}>
            {milestones.length === 0 ? (
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
                            {milestones.map((milestone) => (
                                <tr key={milestone.id} className="align-top">
                                    <td className="whitespace-nowrap px-4 py-2.5 font-medium tabular-nums">
                                        {milestone.milestone_date_label}
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
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </ProfileWideSection>
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
                                value={profile.job_title || profile.position}
                            />
                        </ProfileDetailsSection>
                    </div>
                </div>

                {canViewPrivate ? (
                    <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
                        <div className="space-y-4">
                            <EmploymentSection profile={profile} />

                            <ProfileDetailsSection
                                title="Personal information"
                                icon={UserIcon}
                            >
                                <ProfileDetailItem
                                    label="Birthday"
                                    value={formatDate(profile.birthday)}
                                />
                                <ProfileDetailItem
                                    label="Gender"
                                    value={profile.gender_label}
                                />
                                <ProfileDetailItem
                                    label="Nationality"
                                    value={profile.nationality}
                                />
                                <ProfileDetailItem
                                    label="Religion"
                                    value={profile.religion}
                                />
                                <ProfileDetailItem
                                    label="Marital status"
                                    value={profile.marital_status_label}
                                />
                                <ProfileDetailItem
                                    label="Details"
                                    value={profile.personal_details}
                                    className="sm:items-start"
                                />
                            </ProfileDetailsSection>

                            <ProfileDetailsSection
                                title="Contact information"
                                icon={PhoneIcon}
                            >
                                <ProfileDetailItem
                                    label="Mobile number"
                                    value={profile.mobile_number}
                                />
                                <ProfileDetailItem
                                    label="Personal email"
                                    value={profile.personal_email}
                                />
                            </ProfileDetailsSection>

                            <ProfileDetailsSection
                                title="Residential address"
                                icon={HomeIcon}
                            >
                                <ProfileAddressFields
                                    profile={profile}
                                    prefix="residential"
                                />
                            </ProfileDetailsSection>
                        </div>

                        <div className="space-y-4">
                            <ProfileDetailsSection
                                title="Government IDs & tax"
                                icon={IdentificationIcon}
                            >
                                <ProfileDetailItem
                                    label="SSS number"
                                    value={profile.sss_number}
                                />
                                <ProfileDetailItem
                                    label="Pag-IBIG number"
                                    value={profile.pagibig_number}
                                />
                                <ProfileDetailItem
                                    label="PhilHealth number"
                                    value={profile.philhealth_number}
                                />
                                <ProfileDetailItem
                                    label="HMO number"
                                    value={profile.hmo_number}
                                />
                                <ProfileDetailItem
                                    label="TIN number"
                                    value={profile.tin_number}
                                />
                                <ProfileDetailItem
                                    label="Tax code"
                                    value={profile.tax_code_label}
                                />
                            </ProfileDetailsSection>

                            <ProfileDetailsSection
                                title="Banking & e-wallet"
                                icon={BuildingLibraryIcon}
                            >
                                <ProfileDetailItem
                                    label="Bank name"
                                    value={profile.bank_name}
                                />
                                <ProfileDetailItem
                                    label="Bank account number"
                                    value={profile.bank_account_number}
                                />
                                <ProfileDetailItem
                                    label="E-wallet account number"
                                    value={profile.ewallet_account_number}
                                />
                            </ProfileDetailsSection>

                            <ProfileDetailsSection
                                title="Hometown address"
                                icon={HomeIcon}
                            >
                                <ProfileAddressFields
                                    profile={profile}
                                    prefix="hometown"
                                />
                            </ProfileDetailsSection>

                            <ProfileDetailsSection
                                title="Emergency contact"
                                icon={HeartIcon}
                            >
                                <ProfileDetailItem
                                    label="Person to notify"
                                    value={profile.emergency_contact_name}
                                />
                                <ProfileDetailItem
                                    label="Relationship"
                                    value={profile.emergency_relationship}
                                />
                                <ProfileDetailItem
                                    label="Contact number"
                                    value={profile.emergency_contact_number}
                                />
                            </ProfileDetailsSection>

                            <ProfileDetailsSection
                                title="Spouse details"
                                icon={UserGroupIcon}
                            >
                                <ProfileDetailItem
                                    label="Name"
                                    value={profile.spouse_name}
                                />
                                <ProfileDetailItem
                                    label="Nationality"
                                    value={profile.spouse_nationality}
                                />
                                <ProfileDetailItem
                                    label="Contact number"
                                    value={profile.spouse_contact_number}
                                />
                                <ProfileDetailItem
                                    label="Email"
                                    value={profile.spouse_email}
                                />
                                <ProfileDetailItem
                                    label="No. of children"
                                    value={profile.number_of_children}
                                />
                                <ProfileDetailItem
                                    label="Working?"
                                    value={profile.spouse_working_label}
                                />
                            </ProfileDetailsSection>
                        </div>
                    </div>
                ) : (
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
                    </div>
                )}

                <MilestonesSection milestones={profile.milestones} />

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
