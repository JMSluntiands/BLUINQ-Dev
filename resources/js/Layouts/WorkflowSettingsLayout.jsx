import WorkflowSettingsSidebar from '@/Components/Settings/WorkflowSettingsSidebar';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function WorkflowSettingsLayout({
    header,
    children,
    moduleKey = null,
}) {
    return (
        <AuthenticatedLayout header={header}>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                <WorkflowSettingsSidebar activeModuleKey={moduleKey} />
                <div className="min-w-0 flex-1">{children}</div>
            </div>
        </AuthenticatedLayout>
    );
}
