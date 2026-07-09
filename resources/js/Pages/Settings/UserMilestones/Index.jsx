import FlashNoticeModal from '@/Components/FlashNoticeModal';
import Pagination from '@/Components/Pagination';
import SecondaryButton from '@/Components/SecondaryButton';
import UserAvatar from '@/Components/UserAvatar';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { Head, Link, router } from '@inertiajs/react';

export default function Index({ users, filters = {} }) {
    const rows = users?.data ?? [];

    const handleSearch = (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        router.get(
            route('settings.user-milestones.index'),
            { search: formData.get('search') ?? '' },
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-slate-800 dark:text-slate-100">
                    User milestones
                </h2>
            }
        >
            <Head title="User milestones" />
            <FlashNoticeModal messages={{}} />

            <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700/70 dark:bg-slate-900/90">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Add and manage achievement milestones for employees.
                    </p>
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <input
                            type="search"
                            name="search"
                            defaultValue={filters.search ?? ''}
                            placeholder="Search employee..."
                            className="rounded-lg border-slate-300 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                        />
                        <SecondaryButton type="submit">Search</SecondaryButton>
                    </form>
                </div>

                {rows.length === 0 ? (
                    <div className="px-5 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                        No employees found.
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                        {rows.map((employee) => (
                            <li key={employee.id}>
                                <Link
                                    href={route(
                                        'settings.user-milestones.show',
                                        employee.id,
                                    )}
                                    className="flex flex-wrap items-center gap-4 px-5 py-4 transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                >
                                    <UserAvatar
                                        user={employee}
                                        className="h-10 w-10 text-sm"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-slate-900 dark:text-white">
                                            {employee.name}
                                        </p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {employee.position ||
                                                employee.job_title ||
                                                employee.role}{' '}
                                            · {employee.email}
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                            Milestones
                                        </p>
                                        <p className="text-2xl font-bold tabular-nums text-sky-600 dark:text-sky-400">
                                            {employee.milestones_count}
                                        </p>
                                    </div>
                                    <ChevronRightIcon className="h-5 w-5 text-slate-400" />
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}

                {users?.links?.length > 3 && (
                    <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-800">
                        <Pagination links={users.links} />
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
