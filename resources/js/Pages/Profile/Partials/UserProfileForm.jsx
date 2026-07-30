import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import UserAvatar from '@/Components/UserAvatar';
import { Transition } from '@headlessui/react';
import {
    ArrowTopRightOnSquareIcon,
    BriefcaseIcon,
    LinkIcon,
    PencilSquareIcon,
    PhotoIcon,
    SparklesIcon,
    UserIcon,
} from '@heroicons/react/24/outline';
import { resolveBadgeInitials } from '@/utils/badgeInitials';
import { Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

function displayValue(value) {
    return value?.trim() ? value : '—';
}

function ProfileDetailsSection({ title, icon: Icon, children }) {
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

function ProfileWideSection({ title, icon: Icon, value, children }) {
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
                {children ?? displayValue(value)}
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

function formatBirthday(value) {
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

function profileFormDefaults(profile) {
    return {
        name: profile.name ?? '',
        initials: profile.initials ?? '',
        email: profile.email ?? '',
        company_name: profile.company_name ?? '',
        employee_number: profile.employee_number ?? '',
        job_title: profile.job_title ?? '',
        date_hired: profile.date_hired ?? '',
        birthday: profile.birthday ?? '',
        personal_details: profile.personal_details ?? '',
        personal_file_url: profile.personal_file_url ?? '',
        claims_excel_url: profile.claims_excel_url ?? '',
        profile_image: null,
        _method: 'patch',
    };
}

export default function UserProfileForm({
    profile,
    mustVerifyEmail,
    status,
    className = '',
}) {
    const [editOpen, setEditOpen] = useState(false);
    const [photoPreview, setPhotoPreview] = useState(null);

    const { data, setData, post, errors, processing, recentlySuccessful, reset } =
        useForm(profileFormDefaults(profile));

    useEffect(() => {
        if (!data.profile_image) {
            setPhotoPreview(null);
            return;
        }

        const objectUrl = URL.createObjectURL(data.profile_image);
        setPhotoPreview(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [data.profile_image]);

    const openEdit = () => {
        reset(profileFormDefaults(profile));
        setPhotoPreview(null);
        setEditOpen(true);
    };

    const closeEdit = () => {
        reset(profileFormDefaults(profile));
        setPhotoPreview(null);
        setEditOpen(false);
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('profile.update'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setEditOpen(false);
                setPhotoPreview(null);
            },
        });
    };

    const nameInitials = resolveBadgeInitials(profile);
    const positionLabel = profile.position?.trim() ?? '';
    const photoPreviewUrl =
        photoPreview || profile.profile_image_url || null;

    return (
        <section className={className}>
            <div className="space-y-4">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-gray-800/80 dark:bg-[#0a0e14] dark:shadow-xl dark:shadow-black/30">
                    <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-5 py-5 dark:border-gray-800/70 dark:from-[#0c111a] dark:via-[#0a0e14] dark:to-[#0c111a] sm:px-6">
                        <div className="flex flex-wrap items-start justify-between gap-4">
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

                            <button
                                type="button"
                                onClick={openEdit}
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm transition hover:border-blue-500/40 hover:text-blue-500 dark:border-gray-700 dark:bg-[#0f1729] dark:text-gray-300 dark:hover:border-blue-500/50 dark:hover:text-blue-400"
                            >
                                <PencilSquareIcon className="h-4 w-4" />
                                Edit profile
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4 p-5 sm:p-6">
                        <div className="grid gap-4 lg:grid-cols-2">
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
                                <ProfileDetailItem
                                    label="Date hired"
                                    value={formatBirthday(profile.date_hired)}
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

                            <ProfileDetailsSection
                                title="Personal"
                                icon={UserIcon}
                            >
                                <ProfileDetailItem
                                    label="Birthday"
                                    value={formatBirthday(profile.birthday)}
                                />
                                <ProfileDetailItem
                                    label="Details"
                                    value={profile.personal_details}
                                    className="sm:items-start"
                                />
                            </ProfileDetailsSection>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">
                            <ProfileDetailsSection
                                title="Links & resources"
                                icon={LinkIcon}
                            >
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
                                    <div className="overflow-x-auto -mx-4 sm:mx-0">
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

                <Transition
                    show={recentlySuccessful}
                    enter="transition ease-in-out"
                    enterFrom="opacity-0"
                    leave="transition ease-in-out"
                    leaveTo="opacity-0"
                >
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">
                        Profile saved.
                    </p>
                </Transition>
            </div>

            <Modal show={editOpen} onClose={closeEdit} maxWidth="lg">
                <form
                    onSubmit={submit}
                    className="flex max-h-[min(85vh,36rem)] flex-col"
                >
                    <div className="shrink-0 border-b border-slate-200 px-4 py-3 dark:border-gray-800">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                            Edit profile
                        </h3>
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
                        <div>
                            <InputLabel htmlFor="edit-name" value="Full name" />
                            <TextInput
                                id="edit-name"
                                className="mt-1 block w-full"
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                required
                                autoComplete="name"
                            />
                            <InputError
                                className="mt-1"
                                message={errors.name}
                            />
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="edit-initials"
                                value="Initials"
                            />
                            <TextInput
                                id="edit-initials"
                                className="mt-1 block w-full uppercase"
                                value={data.initials}
                                onChange={(e) =>
                                    setData(
                                        'initials',
                                        e.target.value.toUpperCase(),
                                    )
                                }
                                maxLength={10}
                                placeholder="e.g. JD"
                                autoComplete="off"
                            />
                            <p className="mt-1 text-xs text-slate-500 dark:text-gray-500">
                                Shown on APM board, revisions, and badges. Leave
                                blank to use initials from your name.
                            </p>
                            <InputError
                                className="mt-1"
                                message={errors.initials}
                            />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <InputLabel
                                    htmlFor="edit-job_title"
                                    value="Job title"
                                />
                                <TextInput
                                    id="edit-job_title"
                                    className="mt-1 block w-full"
                                    value={data.job_title}
                                    onChange={(e) =>
                                        setData('job_title', e.target.value)
                                    }
                                />
                                <InputError
                                    className="mt-1"
                                    message={errors.job_title}
                                />
                            </div>

                            <div>
                                <InputLabel
                                    htmlFor="edit-date_hired"
                                    value="Date hired"
                                />
                                <TextInput
                                    id="edit-date_hired"
                                    type="date"
                                    className="mt-1 block w-full"
                                    value={data.date_hired}
                                    onChange={(e) =>
                                        setData('date_hired', e.target.value)
                                    }
                                />
                                <InputError
                                    className="mt-1"
                                    message={errors.date_hired}
                                />
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="edit-email" value="Email" />
                            <TextInput
                                id="edit-email"
                                type="email"
                                className="mt-1 block w-full"
                                value={data.email}
                                onChange={(e) =>
                                    setData('email', e.target.value)
                                }
                                required
                                autoComplete="username"
                            />
                            <InputError
                                className="mt-1"
                                message={errors.email}
                            />
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="edit-birthday"
                                value="Birthday"
                            />
                            <TextInput
                                id="edit-birthday"
                                type="date"
                                className="mt-1 block w-full"
                                value={data.birthday}
                                onChange={(e) =>
                                    setData('birthday', e.target.value)
                                }
                            />
                            <InputError
                                className="mt-1"
                                message={errors.birthday}
                            />
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="edit-personal_details"
                                value="Personal details"
                            />
                            <textarea
                                id="edit-personal_details"
                                value={data.personal_details}
                                onChange={(e) =>
                                    setData(
                                        'personal_details',
                                        e.target.value,
                                    )
                                }
                                rows={2}
                                className="mt-1 block w-full rounded-md border-slate-300 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500 dark:border-gray-700 dark:bg-slate-900 dark:text-gray-200"
                            />
                            <InputError
                                className="mt-1"
                                message={errors.personal_details}
                            />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <InputLabel
                                    htmlFor="edit-personal_file_url"
                                    value="SharePoint file"
                                />
                                <TextInput
                                    id="edit-personal_file_url"
                                    type="url"
                                    className="mt-1 block w-full"
                                    value={data.personal_file_url}
                                    onChange={(e) =>
                                        setData(
                                            'personal_file_url',
                                            e.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    className="mt-1"
                                    message={errors.personal_file_url}
                                />
                            </div>

                            <div>
                                <InputLabel
                                    htmlFor="edit-claims_excel_url"
                                    value="Claims link"
                                />
                                <TextInput
                                    id="edit-claims_excel_url"
                                    type="url"
                                    className="mt-1 block w-full"
                                    value={data.claims_excel_url}
                                    onChange={(e) =>
                                        setData(
                                            'claims_excel_url',
                                            e.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    className="mt-1"
                                    message={errors.claims_excel_url}
                                />
                            </div>
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="edit-profile_image"
                                value="Staff photo"
                            />
                            <div className="mt-1.5 flex items-center gap-3">
                                {photoPreviewUrl ? (
                                    <img
                                        src={photoPreviewUrl}
                                        alt=""
                                        className="h-12 w-12 rounded-full object-cover ring-2 ring-blue-500/20"
                                    />
                                ) : (
                                    <UserAvatar
                                        user={{
                                            name: data.name,
                                            initials: data.initials,
                                        }}
                                        className="h-12 w-12 text-sm"
                                    />
                                )}
                                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-dashed border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-500 transition hover:border-blue-500 hover:text-blue-500 dark:border-gray-700 dark:text-gray-400">
                                    <PhotoIcon className="h-3.5 w-3.5" />
                                    Upload
                                    <input
                                        id="edit-profile_image"
                                        type="file"
                                        accept="image/*"
                                        className="sr-only"
                                        onChange={(e) =>
                                            setData(
                                                'profile_image',
                                                e.target.files?.[0] ?? null,
                                            )
                                        }
                                    />
                                </label>
                            </div>
                            <InputError
                                className="mt-1"
                                message={errors.profile_image}
                            />
                        </div>
                    </div>

                    <div className="flex shrink-0 justify-end gap-2 border-t border-slate-200 px-4 py-3 dark:border-gray-800">
                        <SecondaryButton type="button" onClick={closeEdit}>
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton loading={processing}>
                            Save
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </section>
    );
}
