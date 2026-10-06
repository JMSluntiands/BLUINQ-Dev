import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { KeyIcon } from '@heroicons/react/24/outline';
import { useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function PasswordChangeRequestButton({ passwordRequest = null }) {
    const [open, setOpen] = useState(false);
    const form = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const close = () => {
        if (form.processing) {
            return;
        }

        setOpen(false);
        form.reset();
        form.clearErrors();
    };

    const submit = (event) => {
        event.preventDefault();
        form.post(route('profile.password-request.store'), {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                form.reset();
            },
        });
    };

    return (
        <>
            <div className="flex flex-col items-start gap-1 sm:items-end">
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#0073ea] px-4 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-[#0060c4]"
                >
                    <KeyIcon className="h-4 w-4" />
                    Request password
                </button>
                {passwordRequest?.status === 'pending' ? (
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                        Waiting for approval
                        {passwordRequest.requested_at
                            ? ` · requested ${passwordRequest.requested_at}`
                            : ''}
                    </p>
                ) : null}
            </div>

            <Modal show={open} onClose={close} maxWidth="md">
                <form onSubmit={submit} className="p-6">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Request password change
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        An administrator must approve this before your password
                        changes.
                        {passwordRequest?.status === 'pending'
                            ? ' Submitting again replaces your pending request.'
                            : ''}
                    </p>

                    <div className="mt-4 space-y-4">
                        <div>
                            <InputLabel
                                htmlFor="current_password"
                                value="Current password"
                            />
                            <TextInput
                                id="current_password"
                                type="password"
                                className="mt-1 block w-full"
                                value={form.data.current_password}
                                onChange={(event) =>
                                    form.setData(
                                        'current_password',
                                        event.target.value,
                                    )
                                }
                                autoComplete="current-password"
                                required
                            />
                            <InputError
                                className="mt-2"
                                message={form.errors.current_password}
                            />
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="password"
                                value="New password"
                            />
                            <TextInput
                                id="password"
                                type="password"
                                className="mt-1 block w-full"
                                value={form.data.password}
                                onChange={(event) =>
                                    form.setData('password', event.target.value)
                                }
                                autoComplete="new-password"
                                required
                            />
                            <InputError
                                className="mt-2"
                                message={form.errors.password}
                            />
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="password_confirmation"
                                value="Confirm new password"
                            />
                            <TextInput
                                id="password_confirmation"
                                type="password"
                                className="mt-1 block w-full"
                                value={form.data.password_confirmation}
                                onChange={(event) =>
                                    form.setData(
                                        'password_confirmation',
                                        event.target.value,
                                    )
                                }
                                autoComplete="new-password"
                                required
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-2">
                        <SecondaryButton type="button" onClick={close}>
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton loading={form.processing}>
                            Submit request
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </>
    );
}
