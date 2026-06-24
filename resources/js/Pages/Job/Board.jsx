import JobBoardGrid from '@/Components/JobBoard/JobBoardGrid';
import FlashNoticeModal from '@/Components/FlashNoticeModal';
import Pagination from '@/Components/Pagination';
import TableSearchToolbar from '@/Components/TableSearchToolbar';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const FLASH_MESSAGES = {
    'drf-submitted':
        'Your drafting request was submitted successfully.',
    'drf-archived': 'Drafting request moved to archive.',
};

export default function JobBoard({
    jobs,
    filters = {},
    canViewAllRequests = false,
    assignableUsers = [],
    groupByStatus = false,
    jobListSections = {},
}) {
    const { auth } = usePage().props;
    const canCreateDraftRequest =
        auth.user?.permissions?.includes('job.drafting-request.view') ??
        false;
    const rows = jobs?.data ?? [];
    const [liveSearch, setLiveSearch] = useState('');
    const hasSearch = Boolean(liveSearch.trim());
    const searchRoute = groupByStatus ? 'job.list' : 'job.board';
    const pageTitle = groupByStatus ? 'Job list' : 'Archi Team — Job board';
    const pageDescription = groupByStatus
        ? canViewAllRequests
            ? 'All jobs on the project board, grouped by status.'
            : 'Your jobs on the project board, grouped by status.'
        : canViewAllRequests
          ? 'All submitted drafting requests in the project board.'
          : 'Your submitted drafting requests on the project board.';

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (!params.has('search')) {
            return;
        }

        params.delete('search');
        params.delete('page');
        const query = Object.fromEntries(params.entries());
        router.get(route(searchRoute), query, { replace: true });
    }, [searchRoute]);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <h2 className="text-xl font-semibold leading-tight text-[#323338] dark:text-white">
                            {pageTitle}
                        </h2>
                        <p className="mt-1 text-sm text-[#676879] dark:text-[#94a3b8]">
                            {pageDescription}
                        </p>
                    </div>
                    {canCreateDraftRequest && (
                        <Link
                            href={route('job.drafting-request-form')}
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#0073ea] px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0060c4] dark:bg-[#1890ff] dark:hover:bg-[#1478e0]"
                        >
                            <PlusIcon className="h-4 w-4" aria-hidden />
                            New request
                        </Link>
                    )}
                </div>
            }
        >
            <Head title={pageTitle} />

            <FlashNoticeModal messages={FLASH_MESSAGES} />

            <div className="overflow-hidden rounded-xl border border-[#e6e9ef] bg-white shadow-sm dark:border-[#2f3347] dark:bg-[#1a1b2e] dark:shadow-none">
                <TableSearchToolbar
                    key={String(filters.per_page ?? 10)}
                    ziggyRouteName={searchRoute}
                    filters={filters}
                    liveSearch
                    onLiveSearchChange={setLiveSearch}
                />
                <JobBoardGrid
                    jobs={rows}
                    groupByStatus={groupByStatus}
                    emptyMessage={
                        hasSearch
                            ? 'No drafting requests match your search.'
                            : 'No drafting requests yet. Submit a new request to start processing.'
                    }
                    getJobHref={(row) =>
                        route('job.drafting.show', row.id)
                    }
                    showFilesInTotal
                    onCommentsUpdated={() =>
                        router.reload({
                            only: ['jobs'],
                            preserveScroll: true,
                        })
                    }
                    onPriorityUpdated={() =>
                        router.reload({
                            only: ['jobs'],
                            preserveScroll: true,
                        })
                    }
                    onAssignmentsUpdated={() =>
                        router.reload({
                            only: ['jobs'],
                            preserveScroll: true,
                        })
                    }
                    assignableUsers={assignableUsers}
                    jobListSections={jobListSections}
                />
                <Pagination pagination={jobs} />
            </div>
        </AuthenticatedLayout>
    );
}
