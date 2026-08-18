import {
    visibleWorkflowSettingsModules,
    isWorkflowModuleActive,
} from '@/config/workflowSettingsModules';
import { Link, usePage } from '@inertiajs/react';
import { useMemo } from 'react';

function SidebarSubLink({ href, active, children }) {
    return (
        <Link
            href={href}
            className={
                'block rounded-lg py-2 pe-3 ps-10 text-sm font-medium transition ' +
                (active
                    ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100')
            }
        >
            {children}
        </Link>
    );
}

export default function WorkflowSettingsSidebar({ activeModuleKey }) {
    const permissions = usePage().props.auth?.user?.permissions ?? [];
    const can = (slug) => permissions.includes(slug);

    const modules = useMemo(
        () =>
            visibleWorkflowSettingsModules().filter((module) =>
                can(module.permission),
            ),
        [permissions],
    );

    const resolvedActiveKey =
        activeModuleKey ??
        modules.find((module) => isWorkflowModuleActive(module))?.key ??
        null;

    return (
        <aside className="w-full shrink-0 lg:w-64">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-[#1a222e]">
                <p className="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:border-slate-700">
                    Workflow settings
                </p>
                <nav className="space-y-0.5 p-2">
                    {modules.map((module) => {
                        const Icon = module.icon;
                        const isActive = module.key === resolvedActiveKey;
                        const { routes } = module;

                        return (
                            <div key={module.key}>
                                <Link
                                    href={route(routes.index)}
                                    className={
                                        'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ' +
                                        (isActive
                                            ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100')
                                    }
                                >
                                    <Icon
                                        className={
                                            'h-5 w-5 shrink-0 ' +
                                            (isActive
                                                ? 'text-sky-600 dark:text-sky-400'
                                                : 'text-slate-400 group-hover:text-slate-500 dark:group-hover:text-slate-300')
                                        }
                                        aria-hidden
                                    />
                                    <span className="min-w-0 flex-1">
                                        {module.label}
                                    </span>
                                </Link>
                                {isActive && (
                                    <div className="mt-0.5 space-y-0.5 pb-1">
                                        {routes.create ? (
                                            <SidebarSubLink
                                                href={route(routes.create)}
                                                active={route().current(
                                                    routes.create,
                                                )}
                                            >
                                                Create
                                            </SidebarSubLink>
                                        ) : null}
                                        <SidebarSubLink
                                            href={route(routes.index)}
                                            active={
                                                route().current(routes.index) ||
                                                (routes.edit
                                                    ? route().current(
                                                          routes.edit,
                                                      )
                                                    : false)
                                            }
                                        >
                                            List
                                        </SidebarSubLink>
                                        {routes.archive ? (
                                            <SidebarSubLink
                                                href={route(routes.archive)}
                                                active={route().current(
                                                    routes.archive,
                                                )}
                                            >
                                                Archive
                                            </SidebarSubLink>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>
            </div>
        </aside>
    );
}
