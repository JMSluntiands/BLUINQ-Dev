import DangerButton from '@/Components/DangerButton';
import FlashNoticeModal from '@/Components/FlashNoticeModal';
import Modal from '@/Components/Modal';
import Pagination from '@/Components/Pagination';
import SecondaryButton from '@/Components/SecondaryButton';
import TableSearchToolbar from '@/Components/TableSearchToolbar';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Head, Link, router } from '@inertiajs/react';
import { useCallback, useState } from 'react';

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

const iconBtn =
    'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#676879] transition-colors hover:bg-[#e6e9ef] hover:text-[#0073ea] focus:outline-none focus:ring-2 focus:ring-[#0073ea] focus:ring-offset-1';

const FLASH_MESSAGES = {
    'role-created': 'Role created.',
    'role-updated': 'Role updated.',
    'role-deleted': 'Role deleted.',
    'role-system-protected': 'System roles cannot be deleted.',
    'role-has-users': 'Cannot delete a role that is assigned to users.',
};

export default function RolesIndex({ roles, filters = {} }) {
    const rows = roles?.data ?? [];
    const hasSearch = Boolean((filters.search ?? '').trim());
    const [deleteTarget, setDeleteTarget] = useState(null);

    const confirmDelete = useCallback(() => {
        if (!deleteTarget) {
            return;
        }
        const qs = filterQueryString(filters);
        router.delete(
            route('settings.roles.destroy', deleteTarget.id) + qs,
            { preserveScroll: true },
        );
        setDeleteTarget(null);
    }, [deleteTarget, filters]);

    const q = filterQueryString(filters);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-[#323338]">
                        Roles — List
                    </h2>
                    <Link
                        href={route('settings.roles.create')}
                        className="inline-flex items-center rounded-lg bg-[#0073ea] px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0060c4]"
                    >
                        Add role
                    </Link>
                </div>
            }
        >
            <Head title="Roles — List" />

            <FlashNoticeModal title="Notice" messages={FLASH_MESSAGES} />

            <Modal
                show={deleteTarget != null}
                onClose={() => setDeleteTarget(null)}
                maxWidth="md"
            >
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-[#323338]">
                        Delete role?
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-[#676879]">
                        <span className="font-medium text-[#323338]">
                            “{deleteTarget?.name}”
                        </span>{' '}
                        will be removed. Users cannot use this role anymore.
                    </p>
                    <div className="mt-6 flex flex-wrap justify-end gap-2">
                        <SecondaryButton
                            type="button"
                            onClick={() => setDeleteTarget(null)}
                            className="rounded-lg normal-case tracking-normal"
                        >
                            Cancel
                        </SecondaryButton>
                        <DangerButton
                            type="button"
                            onClick={confirmDelete}
                            className="rounded-lg normal-case tracking-normal"
                        >
                            Delete
                        </DangerButton>
                    </div>
                </div>
            </Modal>

            <div className="space-y-4">
                <div className="overflow-hidden rounded-2xl border border-[#e6e9ef] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
                    <TableSearchToolbar
                        key={`${filters.search ?? ''}-${filters.per_page}`}
                        ziggyRouteName="settings.roles.index"
                        filters={filters}
                    />
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-[#e6e9ef] text-left text-sm">
                            <thead className="bg-[#fafbfc]">
                                <tr>
                                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#676879]">
                                        Name
                                    </th>
                                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#676879]">
                                        Slug
                                    </th>
                                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#676879]">
                                        Number of users
                                    </th>
                                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#676879]">
                                        Type
                                    </th>
                                    <th className="px-4 py-3 text-end text-[11px] font-semibold uppercase tracking-wide text-[#676879]">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e6e9ef] bg-white">
                                {rows.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-4 py-10 text-center text-[#676879]"
                                        >
                                            {hasSearch
                                                ? 'No roles match your search.'
                                                : 'No roles yet. Add one to get started.'}
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map((r) => (
                                        <tr
                                            key={r.id}
                                            className="hover:bg-[#fafbfc]/80"
                                        >
                                            <td className="px-4 py-3 font-medium text-[#323338]">
                                                {r.name}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs text-[#676879]">
                                                {r.slug}
                                            </td>
                                            <td className="px-4 py-3 text-[#323338]">
                                                {r.users_count}
                                            </td>
                                            <td className="px-4 py-3">
                                                {r.is_system ? (
                                                    <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                                                        System
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                                                        Custom
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-0.5">
                                                    <Link
                                                        href={
                                                            route(
                                                                'settings.roles.edit',
                                                                r.id,
                                                            ) + q
                                                        }
                                                        className={iconBtn}
                                                        title="Edit"
                                                        aria-label={`Edit ${r.name}`}
                                                    >
                                                        <PencilSquareIcon className="h-5 w-5" />
                                                    </Link>
                                                    {!r.is_system && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setDeleteTarget(
                                                                    {
                                                                        id: r.id,
                                                                        name: r.name,
                                                                    },
                                                                )
                                                            }
                                                            className={
                                                                iconBtn +
                                                                ' hover:text-[#e44258]'
                                                            }
                                                            title="Delete"
                                                            aria-label={`Delete ${r.name}`}
                                                            disabled={
                                                                r.users_count >
                                                                0
                                                            }
                                                        >
                                                            <TrashIcon className="h-5 w-5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination pagination={roles} />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
