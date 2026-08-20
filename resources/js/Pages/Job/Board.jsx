import JobBoardGrid from '@/Components/JobBoard/JobBoardGrid';
import JobBoardPendingRequests from '@/Components/JobBoard/JobBoardPendingRequests';
import DraftingRevisionAddModal from '@/Components/Drafting/DraftingRevisionAddModal';
import FlashNoticeModal from '@/Components/FlashNoticeModal';
import Pagination from '@/Components/Pagination';
import TableSearchToolbar from '@/Components/TableSearchToolbar';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

export default function JobBoard({
    jobs,
    filters = {},
    canViewAllRequests = false,
    assignableUsers = [],
    statusOptions = [],
    statusGroupOptions = [],
    categoryOptions = [],
    groupByStatus = false,
    jobListSections = {},
    canReviewPublicRequests = false,
    canForwardFromMasterlist = false,
    showAddFromMasterlist = true,
    showPendingRequests = true,
    masterlistCandidates = [],
    pendingRequests = [],
    pageTitle = 'Archi Project Management',
    pageDescription = null,
    searchRoute = 'job.list',
    board = 'apm',
}) {
    const page = usePage();
    const revisionCode = page.props.flash?.revision_code ?? null;
    const permissions = page.props.auth?.user?.permissions ?? [];
    const canAddRevision = permissions.includes('job.drafting.revision.add');
    const canOpenAddModal = canForwardFromMasterlist || canAddRevision;

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
            'design-masterlist-forwarded':
                'Project added to Design Project Management from the masterlist.',
            'drf-revision-added': 'Revision added.',
            'drf-revision-deleted': 'Revision deleted.',
            'drf-revision-deleted-returned-to-masterlist':
                'Revision deleted. Project removed from APM and is available again in Add from masterlist.',
            'board-reopened': revisionCode
                ? `Project reopened on board with revision ${revisionCode}.`
                : 'Project reopened on board with a new revision.',
        }),
        [revisionCode],
    );

    const rows = jobs?.data ?? [];
    const [liveSearch, setLiveSearch] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const hasSearch = Boolean(liveSearch.trim());
    const resolvedDescription =
        pageDescription ??
        (canViewAllRequests
            ? 'All jobs on the project board, grouped by status.'
            : 'Your jobs on the project board, grouped by status.');
    const canOpenAddFromMasterlist =
        showAddFromMasterlist && canOpenAddModal;

    const projectOptions = useMemo(
        () =>
            (masterlistCandidates ?? []).map((candidate) => ({
                id: candidate.id,
                label: candidate.label,
                job_no: candidate.lead_no ?? '',
                revisions: [],
                status: 'new',
                source: candidate.source ?? 'masterlist',
            })),
        [masterlistCandidates],
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
                            {resolvedDescription}
                        </p>
                    </div>
                    {canOpenAddFromMasterlist && (
                        <button
                            type="button"
                            onClick={() => setShowAddModal(true)}
                            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#0073ea] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0060c4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0073ea] focus-visible:ring-offset-1 dark:hover:bg-[#1478e0]"
                        >
                            Add item
                        </button>
                    )}
                </div>
            }
        >
            <Head title={pageTitle} />

            <FlashNoticeModal messages={flashMessages} />

            <DraftingRevisionAddModal
                show={showAddModal}
                onClose={() => setShowAddModal(false)}
                mode="forward"
                board={board}
                projectOptions={projectOptions}
                statusOptions={statusOptions}
                categoryOptions={categoryOptions}
            />

            <div className="overflow-hidden rounded-xl border border-[#e6e9ef] bg-white shadow-sm dark:border-[#2f3347] dark:bg-[#1a1b2e] dark:shadow-none">
                <TableSearchToolbar
                    key={String(filters.per_page ?? 10)}
                    ziggyRouteName={searchRoute}
                    filters={filters}
                    liveSearch
                    liveSearchOnly={['jobs', 'filters', 'masterlistCandidates']}
                    onLiveSearchChange={setLiveSearch}
                />
                <JobBoardGrid
                    jobs={rows}
                    groupByStatus={groupByStatus}
                    hideEmptyStatusGroups={hasSearch}
                    emptyMessage={
                        hasSearch
                            ? 'No drafting requests match your search.'
                            : 'No drafting requests yet.'
                    }
                    getJobHref={(row) =>
                        route('job.drafting.show', row.id)
                    }
                    showFilesInTotal
                    assignableUsers={assignableUsers}
                    statusOptions={statusOptions}
                    statusGroupOptions={statusGroupOptions}
                    onCommentsUpdated={() => reloadBoard(['jobs'])}
                    onPriorityUpdated={() => reloadBoard(['jobs'])}
                    onAssignmentsUpdated={() => reloadBoard(['jobs'])}
                    jobListSections={jobListSections}
                />
                <Pagination pagination={jobs} />
            </div>

            {showPendingRequests && canReviewPublicRequests && (
                <JobBoardPendingRequests requests={pendingRequests} />
            )}
        </AuthenticatedLayout>
    );
}
