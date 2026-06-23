import FlashNoticeModal from '@/Components/FlashNoticeModal';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import Pagination from '@/Components/Pagination';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import UserAvatar from '@/Components/UserAvatar';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const FLASH_MESSAGES = {
    'leave-credits-added': 'Leave credits added successfully.',
};

function AddCreditsModal({ employee, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        user_id: employee.id,
        amount: '',
        notes: '',
    });

    useEffect(() => {
        setData((current) => ({ ...current, user_id: employee.id }));
    }, [employee.id, setData]);

    const submit = (event) => {
        event.preventDefault();
        post(route('leave.credits.store'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    if (!employee) {
        return null;
    }

    return (
        <Modal show onClose={onClose} maxWidth="md">
            <form onSubmit={submit} className="p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Add leave credits
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {employee.name} · Current balance:{' '}
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {employee.leave_credits}
                    </span>
                </p>

                <div className="mt-5 space-y-4">
                    <div>
                        <InputLabel htmlFor="amount" value="Credits to add" />
                        <TextInput
                            id="amount"
                            type="number"
                            min="1"
                            max="365"
                            value={data.amount}
                            onChange={(event) =>
                                setData('amount', event.target.value)
                            }
                            className="mt-1 block w-full"
                            required
                        />
                        <InputError message={errors.amount} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel
                            htmlFor="notes"
                            value="Notes (optional)"
                        />
                        <textarea
                            id="notes"
                            value={data.notes}
                            onChange={(event) =>
                                setData('notes', event.target.value)
                            }
                            rows={2}
                            className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                            placeholder="Reason for adding credits..."
                        />
                        <InputError message={errors.notes} className="mt-1" />
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <SecondaryButton type="button" onClick={onClose}>
                        Cancel
                    </SecondaryButton>
                    <PrimaryButton disabled={processing}>
                        Add credits
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}

export default function Index({ employees, filters = {} }) {
    const rows = employees?.data ?? [];
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    const handleSearch = (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        router.get(
            route('leave.credits.index'),
            { search: formData.get('search') ?? '' },
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-slate-800 dark:text-slate-100">
                    Leave credits
                </h2>
            }
        >
            <Head title="Leave credits" />
            <FlashNoticeModal messages={FLASH_MESSAGES} />

            <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700/70 dark:bg-slate-900/90">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Manually add leave credits for employees. Credits are
                        deducted automatically when leave is approved.
                    </p>
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <input
                            type="search"
                            name="search"
                            defaultValue={filters.search ?? ''}
                            placeholder="Search employee..."
                            className="rounded-lg border-slate-300 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                        />
                        <SecondaryButton type="submit">Search</SecondaryButton>
                    </form>
                </div>

                {rows.length === 0 ? (
                    <div className="px-5 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                        No employees found.
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                        {rows.map((employee) => (
                            <li
                                key={employee.id}
                                className="flex flex-wrap items-center gap-4 px-5 py-4"
                            >
                                <UserAvatar
                                    user={employee}
                                    className="h-10 w-10 text-sm"
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-slate-900 dark:text-white">
                                        {employee.name}
                                    </p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {employee.job_title || employee.role} ·{' '}
                                        {employee.email}
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                        Credits
                                    </p>
                                    <p
                                        className={
                                            'text-2xl font-bold tabular-nums ' +
                                            (employee.leave_credits < 0
                                                ? 'text-rose-500'
                                                : 'text-emerald-600 dark:text-emerald-400')
                                        }
                                    >
                                        {employee.leave_credits}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedEmployee(employee)}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-sky-500"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                    Add credits
                                </button>
                            </li>
                        ))}
                    </ul>
                )}

                {employees?.links?.length > 3 && (
                    <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-800">
                        <Pagination links={employees.links} />
                    </div>
                )}
            </div>

            {selectedEmployee && (
                <AddCreditsModal
                    employee={selectedEmployee}
                    onClose={() => setSelectedEmployee(null)}
                />
            )}
        </AuthenticatedLayout>
    );
}
