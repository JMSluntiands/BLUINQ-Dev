import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { KeyIcon } from '@heroicons/react/24/outline';
import { useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function AdminPasswordChangeButton({ url, userName }) {
    const [open, setOpen] = useState(false);
    const form = useForm({
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
        form.post(url, {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                form.reset();
            },
        });
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#0073ea] px-4 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-[#0060c4]"
            >
                <KeyIcon className="h-4 w-4" />
                Change password
            </button>

            <Modal show={open} onClose={close} maxWidth="md">
                <form onSubmit={submit} className="p-6">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Change password
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Set a new password for {userName}. Any pending password
                        request from this user is cancelled.
                    </p>

                    <div className="mt-4 space-y-4">
                        <div>
                            <InputLabel
                                htmlFor="admin_new_password"
                                value="New password"
                            />
                            <TextInput
                                id="admin_new_password"
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
                                htmlFor="admin_new_password_confirmation"
                                value="Confirm new password"
                            />
                            <TextInput
                                id="admin_new_password_confirmation"
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
                            Save password
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </>
    );
}
