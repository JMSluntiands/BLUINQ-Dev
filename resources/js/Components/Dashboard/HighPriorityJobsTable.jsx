import JobBoardGrid from '@/Components/JobBoard/JobBoardGrid';
import { Link, router } from '@inertiajs/react';

export default function HighPriorityJobsTable({ boardPreviewJobs = [] }) {
    return (
        <div className="mt-8 min-w-0 max-w-full">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                        For Checking
                    </h3>
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                        Jobs waiting for checking on the project board
                    </p>
                </div>
                <Link
                    href={route('job.board')}
                    className="shrink-0 text-sm font-medium text-[#1890ff] transition hover:text-[#1478e0] dark:text-[#1890ff]"
                >
                    View full board
                </Link>
            </div>
            <div className="min-w-0 max-w-full overflow-x-auto rounded-xl border border-[#2a2d3e] dark:border-[#2f3347]">
                <JobBoardGrid
                    jobs={boardPreviewJobs}
                    emptyMessage="No jobs for checking."
                    getJobHref={(row) =>
                        route('job.drafting.show', row.id)
                    }
                    showFilesInTotal
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
