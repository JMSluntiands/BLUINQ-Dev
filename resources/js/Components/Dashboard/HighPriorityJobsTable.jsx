import JobBoardGrid from '@/Components/JobBoard/JobBoardGrid';
import { Link, router } from '@inertiajs/react';

export default function HighPriorityJobsTable({ boardPreviewJobs = [] }) {
    return (
        <div className="mt-8">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                        Drafting requests
                    </h3>
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                        Recent requests on the project board
                    </p>
                </div>
                <Link
                    href={route('job.board')}
                    className="shrink-0 text-sm font-medium text-[#1890ff] transition hover:text-[#1478e0] dark:text-[#1890ff]"
                >
                    View full board
                </Link>
            </div>
            <div className="overflow-hidden rounded-xl border border-[#2a2d3e] dark:border-[#2f3347]">
                <JobBoardGrid
                    jobs={boardPreviewJobs}
                    emptyMessage="No drafting requests yet."
                    getJobHref={(row) =>
                        route('job.drafting.show', row.id)
                    }
                    showFilesInTotal
                    showAddJobRow={false}
                    onCommentsUpdated={() =>
                        router.reload({
                            only: ['boardPreviewJobs'],
                            preserveScroll: true,
                        })
                    }
                    onPriorityUpdated={() =>
                        router.reload({
                            only: ['boardPreviewJobs'],
                            preserveScroll: true,
                        })
                    }
                />
            </div>
        </div>
    );
}
