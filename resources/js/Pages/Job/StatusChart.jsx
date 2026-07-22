import { JobStatusChart } from '@/Components/Dashboard/DashboardCharts';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function StatusChart({ jobStatusChart = null }) {
    return (
        <AuthenticatedLayout
            header={
                <div className="min-w-0">
                    <h2 className="text-xl font-semibold leading-tight text-[#323338] dark:text-white">
                        Statistic
                    </h2>
                    <p className="mt-1 text-sm text-[#676879] dark:text-[#94a3b8]">
                        Daily job counts by status.
                    </p>
                </div>
            }
        >
            <Head title="Statistic" />

            <JobStatusChart
                jobStatusChart={jobStatusChart}
                reloadRoute="job.status-chart"
                reloadOnly={['jobStatusChart']}
            />
        </AuthenticatedLayout>
    );
}
