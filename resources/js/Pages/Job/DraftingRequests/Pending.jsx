import FlashNoticeModal from '@/Components/FlashNoticeModal';
import Pagination from '@/Components/Pagination';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { Head, router, useForm } from '@inertiajs/react';

const FLASH_MESSAGES = {
    'drf-accepted': 'Drafting request accepted and added to the job board.',
    'drf-already-reviewed': 'This request was already reviewed.',
};

export default function Pending({
    requests,
    filters = {},
    pendingCount = 0,
}) {
    const rows = requests?.data ?? [];
    const { post, processing } = useForm({});

    const handleSearch = (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        router.get(
            route('job.drafting-requests.pending'),
            { search: formData.get('search') ?? '' },
            { preserveState: true, preserveScroll: true },
        );
    };

    const acceptRequest = (id) => {
        post(route('job.drafting-requests.accept', id), {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-semibold leading-tight text-slate-800 dark:text-slate-100">
                        Pending drafting requests
                    </h2>
                    {pendingCount > 0 && (
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                            {pendingCount} pending
                        </span>
                    )}
                </div>
            }
        >
            <Head title="Pending drafting requests" />
            <FlashNoticeModal messages={FLASH_MESSAGES} />

            <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700/70 dark:bg-slate-900/90">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Public form submissions awaiting review. Accept to add
                        them to the job board.
                    </p>

                    <form onSubmit={handleSearch} className="flex gap-2">
                        <input
                            type="search"
                            name="search"
                            defaultValue={filters.search ?? ''}
                            placeholder="Search name, company, email..."
                            className="rounded-lg border-slate-300 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                        />
                        <SecondaryButton type="submit">Search</SecondaryButton>
                    </form>
                </div>

                {rows.length === 0 ? (
                    <div className="px-5 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                        No pending drafting requests.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                            <thead className="bg-slate-50 dark:bg-slate-800/50">
                                <tr>
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                        Job No.
                                    </th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                        Name
                                    </th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                        Company
                                    </th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                        Email
                                    </th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                        Building type
                                    </th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                        Date in
                                    </th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                        Files
                                    </th>
                                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {rows.map((request) => (
                                    <tr key={request.id}>
                                        <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-slate-900 dark:text-white">
                                            {request.reference}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700 dark:text-slate-200">
                                            {request.your_name}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700 dark:text-slate-200">
                                            {request.company_name}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700 dark:text-slate-200">
                                            {request.email}
                                        </td>
                                        <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-200">
                                            {request.building_type ?? '—'}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700 dark:text-slate-200">
                                            {request.requested_at ?? '—'}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700 dark:text-slate-200">
                                            {request.files_count}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-4 text-right">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    acceptRequest(request.id)
                                                }
                                                disabled={processing}
                                                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <CheckCircleIcon className="h-4 w-4" />
                                                Accept
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {requests?.links?.length > 3 && (
                    <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-800">
                        <Pagination links={requests.links} />
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
