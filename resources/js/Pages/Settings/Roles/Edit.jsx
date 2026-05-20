import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
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

export default function RolesEdit({ role, listFilters = {} }) {
    const listQs = filterQueryString(listFilters);

    const form = useForm({
        name: role.name,
    });

    const submit = (e) => {
        e.preventDefault();
        form.patch(
            route('settings.roles.update', role.id) + listQs,
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-slate-800">
                        Roles — Edit
                    </h2>
                    <Link
                        href={route('settings.roles.index') + listQs}
                        className="text-sm font-medium text-sky-700 hover:text-sky-800"
                    >
                        Back to list
                    </Link>
                </div>
            }
        >
            <Head title="Roles — Edit" />

            <div className="max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    <span className="font-medium text-slate-800">Slug:</span>{' '}
                    <code className="font-mono text-xs">{role.slug}</code>
                    <span className="block mt-1 text-xs">
                        Slug is fixed so permission mappings stay stable.
                    </span>
                </div>
                <form onSubmit={submit} className="space-y-6">
                    <div>
                        <InputLabel htmlFor="name" value="Display name" />
                        <TextInput
                            id="name"
                            className="mt-1 block w-full"
                            value={form.data.name}
                            onChange={(e) =>
                                form.setData('name', e.target.value)
                            }
                            required
                        />
                        <InputError
                            className="mt-2"
                            message={form.errors.name}
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <PrimaryButton loading={form.processing}>
                            Update
                        </PrimaryButton>
                        <Link
                            href={route('settings.roles.index') + listQs}
                            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-700 shadow-sm hover:bg-slate-50"
                        >
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
