import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { router, useForm } from '@inertiajs/react';
import { useEffect } from 'react';

const selectClass =
    'mt-1 block w-full rounded-md border border-[#c5c7d0] bg-white px-3 py-2 text-sm text-[#323338] shadow-sm focus:border-[#0073ea] focus:outline-none focus:ring-1 focus:ring-[#0073ea] dark:border-[#2f3347] dark:bg-[#151622] dark:text-slate-200 dark:focus:border-[#3b82f6] dark:focus:ring-[#3b82f6]';

function roleLabel(role) {
    return role === 'checking' ? 'Checking' : 'Drafting';
}

/**
 * @param {{
 *   show: boolean;
 *   job: { id: number; job: string; job_no: string } | null;
 *   role: 'drafting' | 'checking';
 *   slot: number;
 *   assignment?: { user_id?: number; hours?: string | null } | null;
 *   assignableUsers?: Array<{ id: number; name: string; initials?: string }>;
 *   onClose: () => void;
 *   onSaved?: () => void;
 * }} props
 */
export default function JobBoardAssignmentModal({
    show,
    job,
    role,
    slot,
    assignment = null,
    assignableUsers = [],
    onClose,
    onSaved,
}) {
    const form = useForm({
        role,
        slot,
        user_id: '',
        hours: '',
    });

    useEffect(() => {
        if (!show || !job) {
            return;
        }

        form.clearErrors();
        form.setData({
            role,
            slot,
            user_id: assignment?.user_id ? String(assignment.user_id) : '',
            hours: assignment?.hours
                ? String(assignment.hours).replace(/\s*h$/i, '')
                : '',
        });
    }, [show, job?.id, role, slot, assignment?.user_id, assignment?.hours]);

    const submit = (event) => {
        event.preventDefault();
        if (!job?.id) {
            return;
        }

        form.patch(route('job.drafting.assignments.update', job.id), {
            preserveScroll: true,
            onSuccess: () => {
                onSaved?.();
                onClose();
            },
        });
    };

    const clearAssignment = () => {
        if (!job?.id) {
            return;
        }

        router.patch(
            route('job.drafting.assignments.update', job.id),
            {
                role,
                slot,
                user_id: null,
                hours: null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    onSaved?.();
                    onClose();
                },
            },
        );
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <form onSubmit={submit} className="p-6">
                <h2 className="text-lg font-semibold text-[#323338] dark:text-white">
                    Assign {roleLabel(role)}
                </h2>
                <p className="mt-1 text-sm text-[#676879] dark:text-slate-400">
                    {job?.job_no} — {job?.job}
                </p>

                <div className="mt-6 space-y-4">
                    <div>
                        <InputLabel htmlFor="assignment-user" value="Person" />
                        <select
                            id="assignment-user"
                            value={form.data.user_id}
                            onChange={(event) =>
                                form.setData('user_id', event.target.value)
                            }
                            className={selectClass}
                            required
                        >
                            <option value="">Select person…</option>
                            {assignableUsers.map((user) => (
                                <option key={user.id} value={String(user.id)}>
                                    {user.name}
                                    {user.initials ? ` (${user.initials})` : ''}
                                </option>
                            ))}
                        </select>
                        <InputError
                            message={form.errors.user_id}
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <InputLabel htmlFor="assignment-hours" value="Hours" />
                        <TextInput
                            id="assignment-hours"
                            type="number"
                            min="0"
                            step="0.25"
                            value={form.data.hours}
                            onChange={(event) =>
                                form.setData('hours', event.target.value)
                            }
                            className="mt-1 block w-full"
                            placeholder="e.g. 4"
                        />
                        <InputError
                            message={form.errors.hours}
                            className="mt-1"
                        />
                    </div>
                </div>

                <div className="mt-6 flex flex-wrap justify-between gap-2">
                    {assignment ? (
                        <SecondaryButton
                            type="button"
                            onClick={clearAssignment}
                            disabled={form.processing}
                            className="rounded-lg normal-case tracking-normal text-rose-600 dark:text-rose-400"
                        >
                            Clear
                        </SecondaryButton>
                    ) : (
                        <span />
                    )}
                    <div className="flex flex-wrap gap-2">
                        <SecondaryButton
                            type="button"
                            onClick={onClose}
                            className="rounded-lg normal-case tracking-normal"
                        >
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton
                            loading={form.processing}
                            className="rounded-lg normal-case tracking-normal"
                        >
                            Save
                        </PrimaryButton>
                    </div>
                </div>
            </form>
        </Modal>
    );
}
