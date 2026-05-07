import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function CrmIndex() {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-slate-800">
                    CRM
                </h2>
            }
        >
            <Head title="CRM" />

            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
                CRM page is ready. You can add leads, contacts, and pipeline
                views here next.
            </div>
        </AuthenticatedLayout>
    );
}
