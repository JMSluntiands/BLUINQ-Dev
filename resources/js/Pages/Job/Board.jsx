import JobBoardGrid from '@/Components/JobBoard/JobBoardGrid';
import JobBoardPendingRequests from '@/Components/JobBoard/JobBoardPendingRequests';
import AddFromMasterlistControl from '@/Components/JobBoard/AddFromMasterlistControl';
import DraftingRevisionAddModal from '@/Components/Drafting/DraftingRevisionAddModal';
import FlashNoticeModal from '@/Components/FlashNoticeModal';
import Pagination from '@/Components/Pagination';
import TableSearchToolbar from '@/Components/TableSearchToolbar';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

export default function JobBoard({
    jobs,
    filters = {},
    canViewAllRequests = false,
    assignableUsers = [],
    statusOptions = [],
    categoryOptions = [],
    groupByStatus = false,
    jobListSections = {},
    canReviewPublicRequests = false,
    canForwardFromMasterlist = false,
    masterlistCandidates = [],
    pendingRequests = [],
}) {
    const revisionCode = usePage().props.flash?.revision_code ?? null;
    const flashMessages = useMemo(
        () => ({
            'drf-submitted':
                'Your drafting request was submitted successfully.',
            'drf-archived': 'Drafting request moved to archive.',
            'drf-accepted':
                'Drafting request accepted and added to the masterlist.',
            'drf-already-reviewed': 'This request was already reviewed.',
            'masterlist-forwarded':
                'Project added to Archi Project Management from the masterlist.',
            'drf-revision-added': 'Revision added.',
            'board-reopened': revisionCode
                ? `Project reopened on board with revision ${revisionCode}.`
                : 'Project reopened on board with a new revision.',
        }),
        [revisionCode],
    );

    const rows = jobs?.data ?? [];
    const [liveSearch, setLiveSearch] = useState('');
    const [revisionJob, setRevisionJob] = useState(null);
    const hasSearch = Boolean(liveSearch.trim());
    const searchRoute = groupByStatus ? 'job.list' : 'job.board';
    const pageTitle = groupByStatus
        ? 'Archi Project Management'
        : 'Archi Team — Job board';
    const pageDescription = groupByStatus
        ? canViewAllRequests
            ? 'All jobs on the project board, grouped by status.'
            : 'Your jobs on the project board, grouped by status.'
        : canViewAllRequests
          ? 'All submitted drafting requests in the project board.'
          : 'Your submitted drafting requests on the project board.';

    const showAddRevisionActions = useMemo(
        () => rows.some((job) => job.can_add_revision),
        [rows],
    );

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

    useEffect(() => {
        if (!canForwardFromMasterlist) {
            return undefined;
        }

        const q = liveSearch.trim();
        const handle = window.setTimeout(() => {
            const params = Object.fromEntries(
                new URLSearchParams(window.location.search).entries(),
            );
            const currentQ = params.q ?? '';
            if (q === currentQ) {
                return;
            }

            if (q) {
                params.q = q;
            } else {
                delete params.q;
            }

            router.get(route(searchRoute), params, {
                only: ['masterlistCandidates'],
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }, 300);

        return () => window.clearTimeout(handle);
    }, [liveSearch, canForwardFromMasterlist, searchRoute]);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                        <h2 className="text-xl font-semibold leading-tight text-[#323338] dark:text-white">
                            {pageTitle}
                        </h2>
                        <p className="mt-1 text-sm text-[#676879] dark:text-[#94a3b8]">
                            {pageDescription}
                        </p>
                    </div>
                    {canForwardFromMasterlist && (
                        <AddFromMasterlistControl
                            candidates={masterlistCandidates}
                        />
                    )}
                </div>
            }
        >
            <Head title={pageTitle} />

            <FlashNoticeModal messages={flashMessages} />

            <DraftingRevisionAddModal
                show={revisionJob != null}
                onClose={() => setRevisionJob(null)}
                draftingRequestId={revisionJob?.id}
                jobNumber={revisionJob?.job_no ?? revisionJob?.reference ?? ''}
                revisions={revisionJob?.revisions ?? []}
                statusOptions={statusOptions}
                categoryOptions={categoryOptions}
                defaultJobStatus={revisionJob?.status ?? 'new'}
            />

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
                            : 'No drafting requests yet. Add a project from the masterlist to get started.'
                    }
                    getJobHref={(row) =>
                        route('job.drafting.show', row.id)
                    }
                    showFilesInTotal
                    assignableUsers={assignableUsers}
                    statusOptions={statusOptions}
                    onCommentsUpdated={() =>
                        router.reload({
                            only: ['jobs', 'masterlistCandidates'],
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
                    jobListSections={jobListSections}
                    renderActions={
                        showAddRevisionActions
                            ? (job) =>
                                  job.can_add_revision ? (
                                      <button
                                          type="button"
                                          onClick={() => setRevisionJob(job)}
                                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[#0073ea] transition hover:bg-[#e6f0ff] dark:text-[#1890ff] dark:hover:bg-[#1e3a5f]"
                                          title="Add revision"
                                          aria-label={`Add revision for ${job.job_no}`}
                                      >
                                          <PlusIcon className="h-4 w-4" />
                                          <span className="hidden sm:inline">
                                              Add
                                          </span>
                                      </button>
                                  ) : null
                            : null
                    }
                />
                <Pagination pagination={jobs} />
            </div>

            {canReviewPublicRequests && (
                <JobBoardPendingRequests requests={pendingRequests} />
            )}
        </AuthenticatedLayout>
    );
}
