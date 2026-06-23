import WorkflowSettingsSidebar from '@/Components/Settings/WorkflowSettingsSidebar';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function WorkflowSettingsIndex() {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-slate-800 dark:text-white">
                    Workflow settings
                </h2>
            }
        >
            <Head title="Workflow settings" />

            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                <WorkflowSettingsSidebar />
                <div className="min-w-0 flex-1">
                    <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-[#1a222e]">
                        <p className="text-base font-medium text-slate-800 dark:text-white">
                            Select a setting from the sidebar
                        </p>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            Choose a category, then open Create, List, or
                            Archive.
                        </p>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
