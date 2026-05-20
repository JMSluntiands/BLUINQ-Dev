import Checkbox from '@/Components/Checkbox';
import FlashNoticeModal from '@/Components/FlashNoticeModal';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';

const ADMIN_REQUIRED_SLUGS = [
    'dashboard.view',
    'settings.permissions.manage',
    'settings.user-accounts.manage',
    'settings.roles.manage',
];

function isAdminLocked(roleValue, slug) {
    return roleValue === 'admin' && ADMIN_REQUIRED_SLUGS.includes(slug);
}

const FLASH_MESSAGES = {
    'permissions-saved': 'Permissions saved.',
};

export default function PermissionsIndex({ permissions, roles, assigned }) {
    const initialRoles = {};
    for (const r of roles) {
        initialRoles[r.value] = [...(assigned[r.value] ?? [])];
    }

    const form = useForm({ roles: initialRoles });

    const toggle = (roleValue, slug, checked) => {
        if (isAdminLocked(roleValue, slug)) {
            return;
        }
        const current = new Set(form.data.roles[roleValue] ?? []);
        if (checked) {
            current.add(slug);
        } else {
            current.delete(slug);
        }
        form.setData('roles', {
            ...form.data.roles,
            [roleValue]: [...current],
        });
    };

    const isChecked = (roleValue, slug) =>
        (form.data.roles[roleValue] ?? []).includes(slug);

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-slate-800">
                    Role permissions
                </h2>
            }
        >
            <Head title="Role permissions" />

            <FlashNoticeModal messages={FLASH_MESSAGES} />

            <div className="space-y-6">
                <p className="text-sm text-slate-600">
                    Checkboxes grant route access per role. The Administrator role
                    must always keep Dashboard, User accounts, Roles, and Role
                    permissions (those boxes are fixed).
                </p>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.patch(route('settings.permissions.update'));
                    }}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                >
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th
                                        scope="col"
                                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                                    >
                                        Page / area
                                    </th>
                                    {roles.map((role) => (
                                        <th
                                            key={role.value}
                                            scope="col"
                                            className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500"
                                        >
                                            {role.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {permissions.map((permission) => (
                                    <tr key={permission.slug}>
                                        <td className="px-4 py-3 font-medium text-slate-800">
                                            <span className="block">{permission.name}</span>
                                            <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-600">
                                                {permission.status}
                                            </span>
                                        </td>
                                        {roles.map((role) => (
                                            <td
                                                key={`${permission.slug}-${role.value}`}
                                                className="px-4 py-3 text-center"
                                            >
                                                <Checkbox
                                                    checked={isChecked(
                                                        role.value,
                                                        permission.slug,
                                                    )}
                                                    disabled={isAdminLocked(
                                                        role.value,
                                                        permission.slug,
                                                    )}
                                                    onChange={(e) =>
                                                        toggle(
                                                            role.value,
                                                            permission.slug,
                                                            e.target.checked,
                                                        )
                                                    }
                                                    className="mx-auto border-slate-300 text-sky-600 focus:ring-sky-500"
                                                    aria-label={`${role.label}: ${permission.name}`}
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <InputError message={form.errors.roles} />
                        <PrimaryButton loading={form.processing}>
                            Save permissions
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
