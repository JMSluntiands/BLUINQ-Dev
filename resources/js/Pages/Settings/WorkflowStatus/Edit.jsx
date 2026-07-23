import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import WorkflowSettingsLayout from '@/Layouts/WorkflowSettingsLayout';
import { Head, Link, useForm } from '@inertiajs/react';

function filterQueryString(filters) {
    const p = new URLSearchParams();
    if (filters?.search) {
        p.set('search', filters.search);
    }
    if (filters?.per_page) {
        p.set('per_page', String(filters.per_page));
    }
    const s = p.toString();
    return s ? `?${s}` : '';
}

export default function WorkflowStatusEdit({
    workflowStatus,
    kindOptions = {},
    listFilters = {},
}) {
    const listQs = filterQueryString(listFilters);

    const form = useForm({
        kind: workflowStatus.kind ?? 'archi',
        code: workflowStatus.code ?? '',
        name: workflowStatus.name,
        status: workflowStatus.status,
    });

    const submit = (e) => {
        e.preventDefault();
        form.patch(
            route('settings.workflow-status.update', workflowStatus.id) +
                listQs,
        );
    };

    const kindEntries = Object.entries(kindOptions);

    return (
        <WorkflowSettingsLayout
            moduleKey="workflow-status"
            header={
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-slate-800">
                        Status — Edit
                    </h2>
                    <Link
                        href={
                            route('settings.workflow-status.index') + listQs
                        }
                        className="text-sm font-medium text-sky-700 hover:text-sky-800"
                    >
                        Back to list
                    </Link>
                </div>
            }
        >
            <Head title="Status — Edit" />

            <div className="max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <form onSubmit={submit} className="space-y-6">
                    <div>
                        <InputLabel htmlFor="kind" value="Kind" />
                        <select
                            id="kind"
                            className="mt-1 block w-full rounded-md border-slate-300 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500"
                            value={form.data.kind}
                            onChange={(e) =>
                                form.setData('kind', e.target.value)
                            }
                            required
                        >
                            {kindEntries.map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                        <InputError className="mt-2" message={form.errors.kind} />
                    </div>

                    <div>
                        <InputLabel htmlFor="code" value="Code (short)" />
                        <TextInput
                            id="code"
                            className="mt-1 block w-full"
                            value={form.data.code}
                            onChange={(e) => form.setData('code', e.target.value)}
                            placeholder="e.g. new"
                            required
                        />
                        <p className="mt-1 text-xs text-slate-500">
                            Use only the short code when input in system.
                        </p>
                        <InputError className="mt-2" message={form.errors.code} />
                    </div>

                    <div>
                        <InputLabel htmlFor="name" value="Name" />
                        <TextInput
                            id="name"
                            className="mt-1 block w-full"
                            value={form.data.name}
                            onChange={(e) => form.setData('name', e.target.value)}
                            required
                        />
                        <InputError className="mt-2" message={form.errors.name} />
                    </div>

                    <div>
                        <InputLabel htmlFor="status" value="Status" />
                        <select
                            id="status"
                            className="mt-1 block w-full rounded-md border-slate-300 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500"
                            value={form.data.status}
                            onChange={(e) =>
                                form.setData('status', e.target.value)
                            }
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        <InputError className="mt-2" message={form.errors.status} />
                    </div>

                    <div className="flex items-center gap-3">
                        <PrimaryButton loading={form.processing}>
                            Update
                        </PrimaryButton>
                        <Link
                            href={
                                route('settings.workflow-status.index') + listQs
                            }
                            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-700 shadow-sm hover:bg-slate-50"
                        >
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </WorkflowSettingsLayout>
    );
}
