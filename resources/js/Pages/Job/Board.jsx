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
    const searchRoute = 'job.list';
    const pageTitle = 'Archi Project Management';
    const pageDescription = canViewAllRequests
        ? 'All jobs on the project board, grouped by status.'
        : 'Your jobs on the project board, grouped by status.';

    const showAddRevisionActions = useMemo(
        () => rows.some((job) => job.can_add_revision),
        [rows],
    );

    const reloadBoard = (only = ['jobs']) => {
        const q = liveSearch.trim();
        router.get(
            route(searchRoute),
            {
                ...(q ? { search: q } : {}),
                per_page: filters.per_page ?? 10,
            },
            {
                only,
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    useEffect(() => {
        // Keep search ephemeral in the URL without a second Inertia visit —
        // a router.get() here races live search and clears filtered jobs.
        const url = new URL(window.location.href);
        if (!url.searchParams.has('search') && !url.searchParams.has('q')) {
            return;
        }

        url.searchParams.delete('search');
        url.searchParams.delete('q');
        url.searchParams.delete('page');
        const query = url.searchParams.toString();
        window.history.replaceState(
            {},
            '',
            query ? `${url.pathname}?${query}` : url.pathname,
        );
    }, [searchRoute]);

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
                    liveSearchOnly={['jobs', 'filters']}
                    onLiveSearchChange={setLiveSearch}
                />
                <JobBoardGrid
                    jobs={rows}
                    groupByStatus={groupByStatus}
                    hideEmptyStatusGroups={hasSearch}
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
                        reloadBoard(['jobs', 'masterlistCandidates'])
                    }
                    onPriorityUpdated={() => reloadBoard(['jobs'])}
                    onAssignmentsUpdated={() => reloadBoard(['jobs'])}
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
