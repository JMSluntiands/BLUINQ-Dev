import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function RolesCreate() {
    const form = useForm({
        name: '',
        slug: '',
    });

    const submit = (e) => {
        e.preventDefault();
        form.post(route('settings.roles.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-slate-800">
                        Roles — Create
                    </h2>
                    <Link
                        href={route('settings.roles.index')}
                        className="text-sm font-medium text-sky-700 hover:text-sky-800"
                    >
                        Back to list
                    </Link>
                </div>
            }
        >
            <Head title="Roles — Create" />

            <div className="max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="mb-6 text-sm text-slate-600">
                    After creating a role, assign permissions under{' '}
                    <strong>Role permissions</strong> and assign users under{' '}
                    <strong>User accounts</strong>.
                </p>
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

                    <div>
                        <InputLabel htmlFor="slug" value="Slug" />
                        <p className="mt-1 text-xs text-slate-500">
                            Lowercase letters, numbers, and hyphens only. Used
                            internally and for permissions (cannot be changed
                            later).
                        </p>
                        <TextInput
                            id="slug"
                            className="mt-1 block w-full font-mono text-sm"
                            value={form.data.slug}
                            onChange={(e) =>
                                form.setData(
                                    'slug',
                                    e.target.value
                                        .toLowerCase()
                                        .replace(/[^a-z0-9-]/g, ''),
                                )
                            }
                            required
                            placeholder="e.g. project-manager"
                        />
                        <InputError
                            className="mt-2"
                            message={form.errors.slug}
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <PrimaryButton loading={form.processing}>
                            Save
                        </PrimaryButton>
                        <Link
                            href={route('settings.roles.index')}
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
