import FlashNoticeModal from '@/Components/FlashNoticeModal';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import UserAvatar from '@/Components/UserAvatar';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    ArrowLeftIcon,
    PencilSquareIcon,
    PlusIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

const FLASH_MESSAGES = {
    'milestone-created': 'Milestone added successfully.',
    'milestone-updated': 'Milestone updated successfully.',
    'milestone-deleted': 'Milestone deleted successfully.',
};

function toMonthInputValue(dateValue) {
    if (!dateValue) {
        return '';
    }

    return dateValue.slice(0, 7);
}

function MilestoneFormModal({ user, milestone, onClose }) {
    const isEditing = Boolean(milestone);
    const { data, setData, post, patch, processing, errors, reset } = useForm({
        milestone_date: toMonthInputValue(milestone?.milestone_date ?? ''),
        title: milestone?.title ?? '',
        impact_result: milestone?.impact_result ?? '',
    });

    const submit = (event) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onClose();
            },
        };

        if (isEditing) {
            patch(
                route('settings.user-milestones.update', [
                    user.id,
                    milestone.id,
                ]),
                options,
            );
            return;
        }

        post(route('settings.user-milestones.store', user.id), options);
    };

    return (
        <Modal show onClose={onClose} maxWidth="lg">
            <form onSubmit={submit} className="p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {isEditing ? 'Edit milestone' : 'Add milestone'}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {user.name}
                </p>

                <div className="mt-5 space-y-4">
                    <div>
                        <InputLabel
                            htmlFor="milestone_date"
                            value="Date (month / year)"
                        />
                        <input
                            id="milestone_date"
                            type="month"
                            value={data.milestone_date}
                            onChange={(event) =>
                                setData('milestone_date', event.target.value)
                            }
                            className="mt-1 block w-full rounded-lg border-slate-300 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                            required
                        />
                        <InputError
                            message={errors.milestone_date}
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <InputLabel
                            htmlFor="title"
                            value="Achievement / milestone"
                        />
                        <TextInput
                            id="title"
                            value={data.title}
                            onChange={(event) =>
                                setData('title', event.target.value)
                            }
                            className="mt-1 block w-full"
                            placeholder="e.g. Promoted to Senior Designer"
                            required
                        />
                        <InputError message={errors.title} className="mt-1" />
                    </div>

                    <div>
                        <InputLabel
                            htmlFor="impact_result"
                            value="Impact / result"
                        />
                        <textarea
                            id="impact_result"
                            value={data.impact_result}
                            onChange={(event) =>
                                setData('impact_result', event.target.value)
                            }
                            rows={3}
                            className="mt-1 block w-full rounded-lg border-slate-300 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                            placeholder="Describe the outcome or impact..."
                        />
                        <InputError
                            message={errors.impact_result}
                            className="mt-1"
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <SecondaryButton type="button" onClick={onClose}>
                        Cancel
                    </SecondaryButton>
                    <PrimaryButton disabled={processing}>
                        {isEditing ? 'Save changes' : 'Add milestone'}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}

export default function Show({ user, milestones }) {
    const [formOpen, setFormOpen] = useState(false);
    const [editingMilestone, setEditingMilestone] = useState(null);

    const openCreate = () => {
        setEditingMilestone(null);
        setFormOpen(true);
    };

    const openEdit = (milestone) => {
        setEditingMilestone(milestone);
        setFormOpen(true);
    };

    const closeForm = () => {
        setFormOpen(false);
        setEditingMilestone(null);
    };

    const destroyMilestone = (milestone) => {
        if (
            !window.confirm(
                'Delete this milestone? This action cannot be undone.',
            )
        ) {
            return;
        }

        router.delete(
            route('settings.user-milestones.destroy', [user.id, milestone.id]),
            { preserveScroll: true },
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center gap-3">
                    <Link
                        href={route('settings.user-milestones.index')}
                        className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                    >
                        <ArrowLeftIcon className="h-4 w-4" />
                        Back
                    </Link>
                    <h2 className="text-xl font-semibold leading-tight text-slate-800 dark:text-slate-100">
                        User milestones
                    </h2>
                </div>
            }
        >
            <Head title={`Milestones · ${user.name}`} />
            <FlashNoticeModal messages={FLASH_MESSAGES} />

            <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white px-5 py-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/90">
                    <div className="flex items-center gap-4">
                        <UserAvatar user={user} className="h-12 w-12 text-sm" />
                        <div>
                            <p className="font-semibold text-slate-900 dark:text-white">
                                {user.name}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {user.position || user.job_title || user.role} ·{' '}
                                {user.email}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={openCreate}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-sky-500"
                    >
                        <PlusIcon className="h-4 w-4" />
                        Add milestone
                    </button>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700/70 dark:bg-slate-900/90">
                    {milestones.length === 0 ? (
                        <div className="px-5 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                            No milestones yet. Click &ldquo;Add milestone&rdquo;
                            to record the first one.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                                <thead className="bg-slate-50 dark:bg-slate-800/60">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                            Date
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                            Achievement / milestone
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                            Impact / result
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {milestones.map((milestone) => (
                                        <tr
                                            key={milestone.id}
                                            className="text-sm text-slate-800 dark:text-slate-200"
                                        >
                                            <td className="whitespace-nowrap px-4 py-3 font-medium tabular-nums">
                                                {milestone.milestone_date_label}
                                            </td>
                                            <td className="px-4 py-3">
                                                {milestone.title}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                                                {milestone.impact_result?.trim()
                                                    ? milestone.impact_result
                                                    : '—'}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right">
                                                <div className="inline-flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openEdit(milestone)
                                                        }
                                                        className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-sky-600 dark:hover:bg-slate-800 dark:hover:text-sky-400"
                                                        title="Edit milestone"
                                                    >
                                                        <PencilSquareIcon className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            destroyMilestone(
                                                                milestone,
                                                            )
                                                        }
                                                        className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                                                        title="Delete milestone"
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {formOpen && (
                <MilestoneFormModal
                    key={editingMilestone?.id ?? 'new'}
                    user={user}
                    milestone={editingMilestone}
                    onClose={closeForm}
                />
            )}
        </AuthenticatedLayout>
    );
}
