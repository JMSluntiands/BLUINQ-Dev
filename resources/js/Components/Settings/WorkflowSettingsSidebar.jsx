import {
    WORKFLOW_SETTINGS_MODULES,
    isWorkflowModuleActive,
} from '@/config/workflowSettingsModules';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { Link, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

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
            WORKFLOW_SETTINGS_MODULES.filter((module) =>
                can(module.permission),
            ),
        [permissions],
    );

    const resolvedActiveKey =
        activeModuleKey ??
        modules.find((module) => isWorkflowModuleActive(module))?.key ??
        null;

    const [openKey, setOpenKey] = useState(resolvedActiveKey);

    useEffect(() => {
        if (resolvedActiveKey) {
            setOpenKey(resolvedActiveKey);
        }
    }, [resolvedActiveKey]);

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
                        const isOpen = openKey === module.key;
                        const { routes } = module;

                        return (
                            <div key={module.key}>
                                <button
                                    type="button"
                                    aria-expanded={isOpen}
                                    onClick={() =>
                                        setOpenKey((current) =>
                                            current === module.key
                                                ? null
                                                : module.key,
                                        )
                                    }
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
                                    <ChevronRightIcon
                                        className={
                                            'h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ' +
                                            (isOpen ? 'rotate-90' : '')
                                        }
                                        aria-hidden
                                    />
                                </button>
                                {isOpen && (
                                    <div className="mt-0.5 space-y-0.5 pb-1">
                                        <SidebarSubLink
                                            href={route(routes.create)}
                                            active={route().current(
                                                routes.create,
                                            )}
                                        >
                                            Create
                                        </SidebarSubLink>
                                        <SidebarSubLink
                                            href={route(routes.index)}
                                            active={
                                                route().current(routes.index) ||
                                                route().current(routes.edit)
                                            }
                                        >
                                            List
                                        </SidebarSubLink>
                                        <SidebarSubLink
                                            href={route(routes.archive)}
                                            active={route().current(
                                                routes.archive,
                                            )}
                                        >
                                            Archive
                                        </SidebarSubLink>
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
