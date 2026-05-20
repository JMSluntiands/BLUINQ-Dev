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

export default function UsersEdit({ user, roles = [], listFilters = {} }) {
    const listQs = filterQueryString(listFilters);

    const form = useForm({
        name: user.name,
        email: user.email,
        role_id: user.role_id,
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        form.patch(
            route('settings.users.update', user.id) + listQs,
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-slate-800">
                        User accounts — Edit
                    </h2>
                    <Link
                        href={route('settings.users.index') + listQs}
                        className="text-sm font-medium text-sky-700 hover:text-sky-800"
                    >
                        Back to list
                    </Link>
                </div>
            }
        >
            <Head title="User accounts — Edit" />

            <div className="max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <form onSubmit={submit} className="space-y-6">
                    <div>
                        <InputLabel htmlFor="name" value="Name" />
                        <TextInput
                            id="name"
                            className="mt-1 block w-full"
                            value={form.data.name}
                            onChange={(e) => form.setData('name', e.target.value)}
                            required
                            autoComplete="name"
                        />
                        <InputError className="mt-2" message={form.errors.name} />
                    </div>

                    <div>
                        <InputLabel htmlFor="email" value="Email" />
                        <TextInput
                            id="email"
                            type="email"
                            className="mt-1 block w-full"
                            value={form.data.email}
                            onChange={(e) =>
                                form.setData('email', e.target.value)
                            }
                            required
                            autoComplete="username"
                        />
                        <InputError className="mt-2" message={form.errors.email} />
                    </div>

                    <div>
                        <InputLabel htmlFor="role_id" value="Role" />
                        <select
                            id="role_id"
                            className="mt-1 block w-full rounded-md border-slate-300 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500"
                            value={form.data.role_id}
                            onChange={(e) =>
                                form.setData(
                                    'role_id',
                                    Number(e.target.value),
                                )
                            }
                        >
                            {roles.map((r) => (
                                <option key={r.id} value={r.id}>
                                    {r.name}
                                </option>
                            ))}
                        </select>
                        <InputError className="mt-2" message={form.errors.role_id} />
                    </div>

                    <div className="border-t border-slate-200 pt-4">
                        <p className="text-sm text-slate-600">
                            Leave password fields blank to keep the current
                            password.
                        </p>
                    </div>

                    <div>
                        <InputLabel htmlFor="password" value="New password" />
                        <TextInput
                            id="password"
                            type="password"
                            className="mt-1 block w-full"
                            value={form.data.password}
                            onChange={(e) =>
                                form.setData('password', e.target.value)
                            }
                            autoComplete="new-password"
                        />
                        <InputError
                            className="mt-2"
                            message={form.errors.password}
                        />
                    </div>

                    <div>
                        <InputLabel
                            htmlFor="password_confirmation"
                            value="Confirm new password"
                        />
                        <TextInput
                            id="password_confirmation"
                            type="password"
                            className="mt-1 block w-full"
                            value={form.data.password_confirmation}
                            onChange={(e) =>
                                form.setData(
                                    'password_confirmation',
                                    e.target.value,
                                )
                            }
                            autoComplete="new-password"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <PrimaryButton loading={form.processing}>
                            Update
                        </PrimaryButton>
                        <Link
                            href={route('settings.users.index') + listQs}
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
