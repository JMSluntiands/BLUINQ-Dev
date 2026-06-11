import Checkbox from '@/Components/Checkbox';
import FlashNoticeModal from '@/Components/FlashNoticeModal';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { useMemo } from 'react';

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

function groupPermissions(permissions, permissionGroups) {
    const byGroup = new Map();

    for (const group of permissionGroups) {
        byGroup.set(group.key, []);
    }

    for (const permission of permissions) {
        const key = permission.group_key ?? 'general';
        if (!byGroup.has(key)) {
            byGroup.set(key, []);
        }
        byGroup.get(key).push(permission);
    }

    return permissionGroups
        .map((group) => ({
            ...group,
            permissions: byGroup.get(group.key) ?? [],
        }))
        .filter((group) => group.permissions.length > 0);
}

export default function PermissionsIndex({
    permissions,
    permissionGroups = [],
    roles,
    assigned,
}) {
    const initialRoles = {};
    for (const r of roles) {
        initialRoles[r.value] = [...(assigned[r.value] ?? [])];
    }

    const form = useForm({ roles: initialRoles });

    const grouped = useMemo(
        () => groupPermissions(permissions, permissionGroups),
        [permissions, permissionGroups],
    );

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
                <h2 className="text-xl font-semibold leading-tight text-slate-800 dark:text-white">
                    Role permissions
                </h2>
            }
        >
            <Head title="Role permissions" />

            <FlashNoticeModal messages={FLASH_MESSAGES} />

            <div className="space-y-6">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    Checkboxes control what each role can see and do. Workflow
                    settings use whole-page access. Archi Project job pages
                    support per-button and per-card permissions. Administrator
                    must always keep Dashboard, User accounts, Roles, and Role
                    permissions.
                </p>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.patch(route('settings.permissions.update'));
                    }}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-[#2f3347] dark:bg-[#1a1b2e] dark:shadow-[0_2px_12px_rgba(0,0,0,0.25)]"
                >
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-[#2f3347]">
                            <thead className="bg-slate-50 dark:bg-[#151622]">
                                <tr>
                                    <th
                                        scope="col"
                                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
                                    >
                                        Page / area
                                    </th>
                                    {roles.map((role) => (
                                        <th
                                            key={role.value}
                                            scope="col"
                                            className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
                                        >
                                            {role.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white dark:divide-[#2f3347] dark:bg-[#1a1b2e]">
                                {grouped.map((group) => (
                                    <GroupSection
                                        key={group.key}
                                        group={group}
                                        roles={roles}
                                        isChecked={isChecked}
                                        toggle={toggle}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-[#2f3347] dark:bg-[#151622]">
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

function GroupSection({ group, roles, isChecked, toggle }) {
    const isWorkflow = group.key === 'workflow-settings';

    return (
        <>
            <tr className="bg-slate-50/80 dark:bg-[#151622]/80">
                <td
                    colSpan={roles.length + 1}
                    className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                >
                    {group.label}
                    {isWorkflow ? (
                        <span className="ml-2 font-normal normal-case tracking-normal text-slate-400 dark:text-slate-500">
                            (whole page)
                        </span>
                    ) : null}
                </td>
            </tr>
            {group.permissions.map((permission) => (
                <PermissionRow
                    key={permission.slug}
                    permission={permission}
                    roles={roles}
                    isChecked={isChecked}
                    toggle={toggle}
                />
            ))}
        </>
    );
}

function PermissionRow({ permission, roles, isChecked, toggle }) {
    const isChild = Boolean(permission.parent_slug);

    return (
        <tr className="transition-colors hover:bg-slate-50/50 dark:hover:bg-[#243044]/40">
            <td
                className={`px-4 py-3 font-medium text-slate-800 dark:text-slate-200 ${
                    isChild ? 'pl-10' : ''
                }`}
            >
                <span className="flex items-center gap-2">
                    {isChild ? (
                        <span
                            className="text-slate-300 dark:text-slate-600"
                            aria-hidden
                        >
                            └
                        </span>
                    ) : null}
                    <span>{permission.name}</span>
                </span>
                <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-600 dark:bg-[#243044] dark:text-slate-400">
                    {permission.status}
                </span>
            </td>
            {roles.map((role) => (
                <td
                    key={`${permission.slug}-${role.value}`}
                    className="px-4 py-3 text-center"
                >
                    <Checkbox
                        checked={isChecked(role.value, permission.slug)}
                        disabled={isAdminLocked(role.value, permission.slug)}
                        onChange={(e) =>
                            toggle(
                                role.value,
                                permission.slug,
                                e.target.checked,
                            )
                        }
                        className="mx-auto border-slate-300 text-sky-600 focus:ring-sky-500 dark:border-slate-600 dark:bg-[#151622] dark:text-sky-500"
                        aria-label={`${role.label}: ${permission.name}`}
                    />
                </td>
            ))}
        </tr>
    );
}
