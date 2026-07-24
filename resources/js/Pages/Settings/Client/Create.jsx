import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import WorkflowSettingsLayout from '@/Layouts/WorkflowSettingsLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function ClientCreate() {
    const form = useForm({
        name: '',
        contact_name: '',
        email: '',
        phone: '',
        status: 'active',
    });

    const submit = (e) => {
        e.preventDefault();
        form.post(route('settings.client.store'));
    };

    return (
        <WorkflowSettingsLayout
            moduleKey="client"
            header={
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-slate-800">
                        Clients — Create
                    </h2>
                    <Link
                        href={route('settings.client.index')}
                        className="text-sm font-medium text-sky-700 hover:text-sky-800"
                    >
                        Back to list
                    </Link>
                </div>
            }
        >
            <Head title="Clients — Create" />

            <div className="max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <form onSubmit={submit} className="space-y-6">
                    <div>
                        <InputLabel htmlFor="name" value="Client name" />
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
                        <InputLabel
                            htmlFor="contact_name"
                            value="Contact name"
                        />
                        <TextInput
                            id="contact_name"
                            className="mt-1 block w-full"
                            value={form.data.contact_name}
                            onChange={(e) =>
                                form.setData('contact_name', e.target.value)
                            }
                            autoComplete="name"
                        />
                        <InputError
                            className="mt-2"
                            message={form.errors.contact_name}
                        />
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
                            autoComplete="email"
                        />
                        <InputError
                            className="mt-2"
                            message={form.errors.email}
                        />
                    </div>

                    <div>
                        <InputLabel htmlFor="phone" value="Phone" />
                        <TextInput
                            id="phone"
                            className="mt-1 block w-full"
                            value={form.data.phone}
                            onChange={(e) =>
                                form.setData('phone', e.target.value)
                            }
                            autoComplete="tel"
                        />
                        <InputError
                            className="mt-2"
                            message={form.errors.phone}
                        />
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
                        <InputError
                            className="mt-2"
                            message={form.errors.status}
                        />
                        <p className="mt-1 text-xs text-slate-500">
                            Only active clients appear on the masterlist form.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <PrimaryButton loading={form.processing}>
                            Save
                        </PrimaryButton>
                        <Link
                            href={route('settings.client.index')}
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
