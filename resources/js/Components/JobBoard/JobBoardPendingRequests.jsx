import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { router, useForm } from '@inertiajs/react';

export default function JobBoardPendingRequests({ requests = [] }) {
    const { post, processing } = useForm({});

    if (requests.length === 0) {
        return null;
    }

    const acceptRequest = (id) => {
        post(route('job.drafting-requests.accept', id), {
            preserveScroll: true,
            onSuccess: () => {
                router.reload({
                    only: ['jobs', 'pendingRequests', 'pendingDraftingRequestCount'],
                    preserveScroll: true,
                });
            },
        });
    };

    return (
        <div className="mt-6 overflow-hidden rounded-xl border border-amber-200/80 bg-white shadow-sm dark:border-amber-500/30 dark:bg-[#1a1b2e]">
            <div className="border-b border-amber-100 bg-amber-50/80 px-5 py-4 dark:border-amber-500/20 dark:bg-amber-500/10">
                <h3 className="text-base font-semibold text-amber-900 dark:text-amber-200">
                    Pending public form submissions
                </h3>
                <p className="mt-1 text-sm text-amber-800/80 dark:text-amber-200/70">
                    Submitted via the standalone Bluinq form. Accept to add
                    them to the job board above.
                </p>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#e6e9ef] dark:divide-[#2f3347]">
                    <thead className="bg-[#f6f7fb] dark:bg-[#252840]">
                        <tr>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#676879] dark:text-[#94a3b8]">
                                Job No.
                            </th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#676879] dark:text-[#94a3b8]">
                                Name
                            </th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#676879] dark:text-[#94a3b8]">
                                Company
                            </th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#676879] dark:text-[#94a3b8]">
                                Email
                            </th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#676879] dark:text-[#94a3b8]">
                                Building type
                            </th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#676879] dark:text-[#94a3b8]">
                                Date in
                            </th>
                            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#676879] dark:text-[#94a3b8]">
                                Action
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e6e9ef] dark:divide-[#2f3347]">
                        {requests.map((request) => (
                            <tr key={request.id}>
                                <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-[#323338] dark:text-white">
                                    {request.reference}
                                </td>
                                <td className="whitespace-nowrap px-5 py-4 text-sm text-[#323338] dark:text-[#c8cad5]">
                                    {request.your_name}
                                </td>
                                <td className="whitespace-nowrap px-5 py-4 text-sm text-[#323338] dark:text-[#c8cad5]">
                                    {request.company_name}
                                </td>
                                <td className="whitespace-nowrap px-5 py-4 text-sm text-[#323338] dark:text-[#c8cad5]">
                                    {request.email}
                                </td>
                                <td className="px-5 py-4 text-sm text-[#323338] dark:text-[#c8cad5]">
                                    {request.building_type ?? '—'}
                                </td>
                                <td className="whitespace-nowrap px-5 py-4 text-sm text-[#323338] dark:text-[#c8cad5]">
                                    {request.requested_at ?? '—'}
                                </td>
                                <td className="whitespace-nowrap px-5 py-4 text-right">
                                    <button
                                        type="button"
                                        onClick={() => acceptRequest(request.id)}
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
        </div>
    );
}
