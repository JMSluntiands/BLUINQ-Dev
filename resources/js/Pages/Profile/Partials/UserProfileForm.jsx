import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import UserAvatar from '@/Components/UserAvatar';
import { Transition } from '@headlessui/react';
import {
    ArrowTopRightOnSquareIcon,
    PhotoIcon,
} from '@heroicons/react/24/outline';
import { Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const fieldInputClass =
    'block w-full !border-0 !bg-transparent p-0 text-[13px] leading-snug !shadow-none focus:!border-0 focus:!ring-0 ' +
    'text-slate-800 placeholder:text-slate-400 ' +
    'dark:text-gray-200 dark:placeholder:text-gray-500';

function ProfileWideFieldCard({ label, children, className = '' }) {
    return (
        <div
            className={
                'overflow-hidden rounded-xl border border-slate-200/90 bg-slate-50/50 dark:border-gray-800 dark:bg-[#0f1729] ' +
                className
            }
        >
            <div className="border-b border-slate-200/90 px-4 py-3 dark:border-gray-800">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-500">
                    {label}
                </p>
            </div>
            <div className="p-4">{children}</div>
        </div>
    );
}

function ProfileFieldCard({ label, children, className = '' }) {
    return (
        <div
            className={
                'group flex flex-col rounded-xl border border-slate-200/90 bg-slate-50/50 p-3.5 transition-colors duration-200 ' +
                'hover:border-blue-400/40 dark:border-gray-800 dark:bg-[#0f1729] dark:hover:border-blue-500/30 ' +
                className
            }
        >
            <div className="mb-2 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.6)]" />
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-500">
                    {label}
                </p>
            </div>
            <div className="min-h-0">{children}</div>
        </div>
    );
}

function ExternalLink({ href, children }) {
    if (!href) {
        return (
            <p className="text-xs text-slate-400 dark:text-gray-600">
                No link added yet
            </p>
        );
    }

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-500 transition hover:text-blue-400 hover:underline"
        >
            {children}
            <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 shrink-0" />
        </a>
    );
}

function StaffPhotoPanel({
    photoPreview,
    profileImageUrl,
    name,
    onPhotoChange,
    error,
}) {
    const hasPhoto = photoPreview || profileImageUrl;

    return (
        <div className="flex h-full min-h-[300px] flex-col overflow-hidden rounded-xl border border-slate-200 dark:border-gray-800 lg:min-h-full">
            <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-gradient-to-b from-slate-100 to-slate-50 p-6 dark:from-[#0a0e17] dark:to-[#070b12]">
                <div
                    className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-60"
                    style={{
                        background:
                            'radial-gradient(circle at 50% 40%, rgba(59,130,246,0.15) 0%, transparent 65%)',
                    }}
                />
                {hasPhoto ? (
                    <img
                        src={photoPreview || profileImageUrl}
                        alt=""
                        className="relative z-10 h-40 w-40 rounded-full object-cover shadow-lg shadow-blue-500/10 ring-4 ring-blue-500/20 sm:h-44 sm:w-44 xl:h-48 xl:w-48"
                    />
                ) : (
                    <UserAvatar
                        user={{ name }}
                        className="relative z-10 h-40 w-40 text-5xl shadow-lg shadow-blue-500/20 sm:h-44 sm:w-44 xl:h-48 xl:w-48"
                        ringClassName="ring-4 ring-blue-500/25"
                    />
                )}
            </div>
            <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3.5 dark:border-gray-800 dark:bg-[#0f1729]">
                <p className="mb-2.5 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-gray-500">
                    Staff photo
                </p>
                <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50/80 px-3 py-2.5 text-xs font-medium text-slate-500 transition hover:border-blue-500 hover:bg-blue-500/5 hover:text-blue-500 dark:border-gray-700 dark:bg-[#0a0e17]/60 dark:text-gray-400 dark:hover:border-blue-500/60 dark:hover:text-blue-400">
                    <PhotoIcon className="h-4 w-4 shrink-0" />
                    Upload photo
                    <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={onPhotoChange}
                    />
                </label>
                <InputError className="mt-2 text-center" message={error} />
            </div>
        </div>
    );
}

export default function UserProfileForm({
    profile,
    mustVerifyEmail,
    status,
    className = '',
}) {
    const [photoPreview, setPhotoPreview] = useState(null);

    const { data, setData, post, errors, processing, recentlySuccessful } =
        useForm({
            name: profile.name ?? '',
            email: profile.email ?? '',
            company_name: profile.company_name ?? '',
            employee_number: profile.employee_number ?? '',
            job_title: profile.job_title ?? '',
            birthday: profile.birthday ?? '',
            personal_details: profile.personal_details ?? '',
            personal_file_url: profile.personal_file_url ?? '',
            claims_excel_url: profile.claims_excel_url ?? '',
            achievements_milestones: profile.achievements_milestones ?? '',
            profile_image: null,
            _method: 'patch',
        });

    useEffect(() => {
        if (!data.profile_image) {
            setPhotoPreview(null);
            return;
        }

        const objectUrl = URL.createObjectURL(data.profile_image);
        setPhotoPreview(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [data.profile_image]);

    const submit = (e) => {
        e.preventDefault();
        post(route('profile.update'), {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    const roleLabel = (
        profile.role_display_name || 'Team member'
    ).toUpperCase();

    return (
        <section className={className}>
            <form onSubmit={submit} className="space-y-4">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-gray-800/80 dark:bg-[#0a0e14] dark:shadow-xl dark:shadow-black/30">
                    <div className="p-5 sm:p-6">
                        <div className="border-b border-slate-100 pb-4 dark:border-gray-800/70">
                            <span className="inline-flex rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-500">
                                User profile
                            </span>

                            <div className="mt-3 space-y-1">
                                <div>
                                    <InputLabel
                                        htmlFor="name"
                                        value="Full name"
                                        className="sr-only"
                                    />
                                    <TextInput
                                        id="name"
                                        value={data.name}
                                        onChange={(e) =>
                                            setData('name', e.target.value)
                                        }
                                        required
                                        className={
                                            '!border-0 !bg-transparent p-0 text-xl font-bold uppercase tracking-[0.06em] !shadow-none focus:!ring-0 sm:text-2xl ' +
                                            'text-slate-900 dark:text-white'
                                        }
                                    />
                                    <InputError
                                        className="mt-1"
                                        message={errors.name}
                                    />
                                </div>

                                <div>
                                    <InputLabel
                                        htmlFor="job_title"
                                        value="Job title"
                                        className="sr-only"
                                    />
                                    <TextInput
                                        id="job_title"
                                        value={data.job_title}
                                        onChange={(e) =>
                                            setData('job_title', e.target.value)
                                        }
                                        placeholder={roleLabel}
                                        className={
                                            '!border-0 !bg-transparent p-0 text-[11px] font-semibold uppercase tracking-[0.1em] !shadow-none focus:!ring-0 ' +
                                            'text-slate-500 placeholder:text-slate-400 ' +
                                            'dark:text-gray-500 dark:placeholder:text-gray-500'
                                        }
                                    />
                                    <InputError
                                        className="mt-1"
                                        message={errors.job_title}
                                    />
                                </div>

                                <div>
                                    <InputLabel
                                        htmlFor="employee_number"
                                        value="Employee number"
                                        className="sr-only"
                                    />
                                    <TextInput
                                        id="employee_number"
                                        value={data.employee_number}
                                        onChange={(e) =>
                                            setData(
                                                'employee_number',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Employee #"
                                        className={
                                            'inline-block w-auto min-w-[8rem] !border-0 !bg-transparent p-0 text-[10px] font-semibold uppercase tracking-[0.14em] !shadow-none focus:!ring-0 ' +
                                            'text-slate-400 placeholder:text-slate-400 ' +
                                            'dark:text-gray-600 dark:placeholder:text-gray-600'
                                        }
                                    />
                                    <InputError
                                        className="mt-1"
                                        message={errors.employee_number}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 grid gap-3 lg:grid-cols-3 lg:items-stretch">
                            <div className="space-y-3">
                                <ProfileFieldCard label="Personal details">
                                    <textarea
                                        id="personal_details"
                                        value={data.personal_details}
                                        onChange={(e) =>
                                            setData(
                                                'personal_details',
                                                e.target.value,
                                            )
                                        }
                                        rows={2}
                                        placeholder="Address, contact number, emergency contact, etc."
                                        className={
                                            'w-full resize-none border-0 bg-transparent p-0 text-[13px] leading-snug focus:ring-0 ' +
                                            'text-slate-800 placeholder:text-slate-400 ' +
                                            'dark:text-gray-200 dark:placeholder:text-gray-500'
                                        }
                                    />
                                    <InputError
                                        className="mt-1"
                                        message={errors.personal_details}
                                    />
                                </ProfileFieldCard>

                                <ProfileFieldCard label="Birthday">
                                    <TextInput
                                        id="birthday"
                                        type="date"
                                        value={data.birthday}
                                        onChange={(e) =>
                                            setData('birthday', e.target.value)
                                        }
                                        className={
                                            fieldInputClass +
                                            ' rounded-md bg-slate-100/80 px-2 py-1 dark:bg-black/25 ' +
                                            '[color-scheme:light] dark:[color-scheme:dark]'
                                        }
                                    />
                                    <InputError
                                        className="mt-1"
                                        message={errors.birthday}
                                    />
                                </ProfileFieldCard>

                                <ProfileFieldCard label="Personal file link to SharePoint">
                                    <TextInput
                                        id="personal_file_url"
                                        type="url"
                                        value={data.personal_file_url}
                                        onChange={(e) =>
                                            setData(
                                                'personal_file_url',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="https://... SharePoint folder"
                                        className={'mb-1.5 ' + fieldInputClass}
                                    />
                                    <ExternalLink href={data.personal_file_url}>
                                        Open personal file
                                    </ExternalLink>
                                    <InputError
                                        className="mt-1"
                                        message={errors.personal_file_url}
                                    />
                                </ProfileFieldCard>
                            </div>

                            <div className="space-y-3">
                                <ProfileFieldCard label="Claims">
                                    <TextInput
                                        id="claims_excel_url"
                                        type="url"
                                        value={data.claims_excel_url}
                                        onChange={(e) =>
                                            setData(
                                                'claims_excel_url',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="https://... (Excel / SharePoint link)"
                                        className={'mb-1.5 ' + fieldInputClass}
                                    />
                                    <ExternalLink href={data.claims_excel_url}>
                                        Open claims spreadsheet
                                    </ExternalLink>
                                    <InputError
                                        className="mt-1"
                                        message={errors.claims_excel_url}
                                    />
                                </ProfileFieldCard>

                                <ProfileFieldCard label="Email">
                                    <TextInput
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) =>
                                            setData('email', e.target.value)
                                        }
                                        required
                                        autoComplete="username"
                                        className={fieldInputClass}
                                    />
                                    <InputError
                                        className="mt-1"
                                        message={errors.email}
                                    />
                                </ProfileFieldCard>

                                <ProfileFieldCard label="Company">
                                    <TextInput
                                        id="company_name"
                                        value={data.company_name}
                                        onChange={(e) =>
                                            setData(
                                                'company_name',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Company name"
                                        autoComplete="organization"
                                        className={fieldInputClass}
                                    />
                                    <InputError
                                        className="mt-1"
                                        message={errors.company_name}
                                    />
                                </ProfileFieldCard>
                            </div>

                            <div className="flex flex-col lg:min-h-0">
                                <StaffPhotoPanel
                                    photoPreview={photoPreview}
                                    profileImageUrl={profile.profile_image_url}
                                    name={data.name}
                                    onPhotoChange={(e) =>
                                        setData(
                                            'profile_image',
                                            e.target.files?.[0] ?? null,
                                        )
                                    }
                                    error={errors.profile_image}
                                />
                            </div>
                        </div>

                        <ProfileWideFieldCard
                            label="Achievements / Milestones"
                            className="mt-4"
                        >
                            <textarea
                                id="achievements_milestones"
                                value={data.achievements_milestones}
                                onChange={(e) =>
                                    setData(
                                        'achievements_milestones',
                                        e.target.value,
                                    )
                                }
                                rows={5}
                                placeholder="List certifications, awards, project milestones, and other achievements…"
                                className={
                                    'w-full min-h-[8rem] resize-y rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-[#0a0e14] dark:text-gray-200 dark:placeholder:text-gray-500 dark:focus:border-blue-500/60 dark:focus:ring-blue-500/20'
                                }
                            />
                            <InputError
                                className="mt-2"
                                message={errors.achievements_milestones}
                            />
                        </ProfileWideFieldCard>
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

                <div className="flex items-center gap-4 pt-1">
                    <PrimaryButton loading={processing}>
                        Save profile
                    </PrimaryButton>
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
            </form>
        </section>
    );
}
