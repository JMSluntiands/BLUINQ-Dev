import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';

export default function LeaveRequestModal({ show, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        start_date: '',
        end_date: '',
        type: 'leave',
        reason: '',
    });

    const submit = (event) => {
        event.preventDefault();
        post(route('leave.store'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    return (
        <Modal show={show} onClose={handleClose} maxWidth="lg">
            <form onSubmit={submit} className="p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Create leave request
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Submit your request for admin approval. It will appear on the
                    team calendar once approved.
                </p>

                <div className="mt-6 space-y-4">
                    <div>
                        <InputLabel htmlFor="leave_type" value="Type" />
                        <select
                            id="leave_type"
                            value={data.type}
                            onChange={(event) =>
                                setData('type', event.target.value)
                            }
                            className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                        >
                            <option value="leave">Leave</option>
                            <option value="remote">Remote work</option>
                        </select>
                        <InputError message={errors.type} className="mt-1" />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <InputLabel
                                htmlFor="start_date"
                                value="Start date"
                            />
                            <TextInput
                                id="start_date"
                                type="date"
                                value={data.start_date}
                                onChange={(event) =>
                                    setData('start_date', event.target.value)
                                }
                                className="mt-1 block w-full"
                                required
                            />
                            <InputError
                                message={errors.start_date}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <InputLabel htmlFor="end_date" value="End date" />
                            <TextInput
                                id="end_date"
                                type="date"
                                value={data.end_date}
                                onChange={(event) =>
                                    setData('end_date', event.target.value)
                                }
                                className="mt-1 block w-full"
                                required
                            />
                            <InputError
                                message={errors.end_date}
                                className="mt-1"
                            />
                        </div>
                    </div>

                    <div>
                        <InputLabel htmlFor="reason" value="Reason (optional)" />
                        <textarea
                            id="reason"
                            value={data.reason}
                            onChange={(event) =>
                                setData('reason', event.target.value)
                            }
                            rows={3}
                            className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                            placeholder="Brief reason for your request..."
                        />
                        <InputError message={errors.reason} className="mt-1" />
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <SecondaryButton type="button" onClick={handleClose}>
                        Cancel
                    </SecondaryButton>
                    <PrimaryButton disabled={processing}>
                        Submit request
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
