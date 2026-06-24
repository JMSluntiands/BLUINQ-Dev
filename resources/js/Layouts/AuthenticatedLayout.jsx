import AppLogo from '@/Components/AppLogo';
import Dropdown from '@/Components/Dropdown';
import ThemeToggle from '@/Components/ThemeToggle';
import UserAvatar from '@/Components/UserAvatar';
import { isAnyWorkflowRoute } from '@/config/workflowSettingsModules';
import {
    Bars3Icon,
    BriefcaseIcon,
    CalendarDaysIcon,
    ClipboardDocumentListIcon,
    ChevronRightIcon,
    ClockIcon,
    KeyIcon,
    MegaphoneIcon,
    DocumentTextIcon,
    Squares2X2Icon,
    ShieldCheckIcon,
    UsersIcon,
    WrenchScrewdriverIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { Link, usePage } from '@inertiajs/react';
import { cloneElement, isValidElement, useEffect, useState } from 'react';

function roleLabel(role) {
    if (role === 'admin') {
        return 'Administrator';
    }
    if (role === 'user') {
        return 'User';
    }
    return role ? String(role) : '';
}

function NavItem({ href, active, icon, children, onNavigate }) {
    const resolvedIcon = isValidElement(icon)
        ? cloneElement(icon, {
              className:
                  (icon.props.className ?? '') +
                  (active
                      ? ' !text-[#0094FF] stroke-[2.4]'
                      : ' !text-[#9CB8E2] group-hover:!text-[#5D8FD4]'),
          })
        : icon;

    return (
        <Link
            href={href}
            onClick={onNavigate}
            className={
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ' +
                (active
                    ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100')
            }
        >
            {resolvedIcon}
            {children}
        </Link>
    );
}

function SidebarSubLink({ href, active, children, onNavigate }) {
    return (
        <Link
            href={href}
            onClick={onNavigate}
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

export default function AuthenticatedLayout({ header, children }) {
    const { auth, logo_url: logoUrl, pendingLeaveCount = 0 } = usePage().props;
    const user = auth.user;
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const closeSidebar = () => setSidebarOpen(false);

    const permissions = user?.permissions ?? [];
    const can = (slug) => permissions.includes(slug);
    const canBuildingType = can('settings.building-type.view');
    const canServiceEngaging = can('settings.service-engaging.view');
    const canExternalWallConstruction = can(
        'settings.external-wall-construction.view',
    );
    const canRoofType = can('settings.roof-type.view');
    const canScopeOfWork = can('settings.scope-of-work.view');
    const canDeliverables = can('settings.deliverables.view');
    const canLevelOfDifficulty = can('settings.level-of-difficulty.view');
    const canArrivalInputFiles = can(
        'settings.crm.arrival-input-files.view',
    );
    const canCrmCategories = can('settings.crm.categories.view');
    const canUserAccounts =
        user?.role === 'admin' && can('settings.user-accounts.manage');
    const canPermissionsPage = can('settings.permissions.manage');
    const canActivityLogs =
        user?.role === 'admin' && can('settings.activity-logs.view');
    const canRoles =
        user?.role === 'admin' &&
        (can('settings.roles.manage') || can('settings.user-accounts.manage'));
    const canDraftingRequest = can('job.drafting-request.view');
    const canJobList = can('job.list.view');
    const canAnnouncements = can('announcements.view');
    const canAnnouncementsManage = can('announcements.manage');
    const canTimesheet = can('timesheet.view');
    const canManageLeave = can('leave.manage');
    const canManageLeaveCredits = can('leave.credits.manage');
    const canDraftingMemos = can('drafting-memos.view');
    const canDraftingArchive = can('job.drafting.archive');
    const canArchiProject =
        canJobList ||
        canDraftingRequest ||
        canDraftingArchive ||
        can('job.drafting.view');

    const isDashboard = route().current('dashboard');
    const isAnnouncements =
        route().current('announcements.index') ||
        route().current('announcements.create') ||
        route().current('announcements.edit') ||
        route().current('announcements.archive');
    const isJobList = route().current('job.board');
    const isTimesheet = route().current('timesheet.index');
    const isLeaveApprovals = route().current('leave.approvals');
    const isLeaveCredits = route().current('leave.credits.index');
    const isJobBoard =
        route().current('job.board') || route().current('job.drafting');
    const isDraftingList = isJobBoard || route().current('job.drafting.show');
    const isDraftingMemos =
        route().current('drafting-memos.index');
    const isDraftingArchive = route().current('job.drafting.archive');
    const isDraftingRequestForm = route().current(
        'job.drafting-request-form',
    );
    const isArchiTeamSection =
        isJobBoard ||
        isDraftingList ||
        isDraftingArchive ||
        isDraftingRequestForm;
    const isUsersIndex = route().current('settings.users.index');
    const isUsersCreate = route().current('settings.users.create');
    const isUsersEdit = route().current('settings.users.edit');
    const isUsersArchive = route().current('settings.users.archive');
    const isUsersSection =
        isUsersIndex || isUsersCreate || isUsersEdit || isUsersArchive;
    const isPermissions = route().current('settings.permissions.edit');
    const isActivityLogs = route().current('settings.activity-logs.index');
    const isProfile = route().current('profile.edit');
    const isRolesIndex = route().current('settings.roles.index');
    const isRolesCreate = route().current('settings.roles.create');
    const isRolesEdit = route().current('settings.roles.edit');
    const isRolesSection =
        isRolesIndex || isRolesCreate || isRolesEdit;
    const isWorkflowSection = isAnyWorkflowRoute();

    const showSettingsBlock =
        canBuildingType ||
        canServiceEngaging ||
        canExternalWallConstruction ||
        canRoofType ||
        canScopeOfWork ||
        canDeliverables ||
        canLevelOfDifficulty ||
        canArrivalInputFiles ||
        canCrmCategories ||
        canUserAccounts ||
        canPermissionsPage ||
        canActivityLogs ||
        canRoles ||
        canManageLeave ||
        canManageLeaveCredits;
    const showWorkflowSettings =
        canServiceEngaging ||
        canExternalWallConstruction ||
        canRoofType ||
        canScopeOfWork ||
        canDeliverables ||
        canBuildingType ||
        canArrivalInputFiles ||
        canCrmCategories ||
        canLevelOfDifficulty;

    const [archiTeamMenuOpen, setArchiTeamMenuOpen] =
        useState(isArchiTeamSection);

    useEffect(() => {
        if (isArchiTeamSection) {
            setArchiTeamMenuOpen(true);
        }
    }, [isArchiTeamSection]);

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-[#0a0c14]">
            {/* Mobile sidebar backdrop */}
            <div
                className={
                    'fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity lg:hidden ' +
                    (sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0')
                }
                onClick={closeSidebar}
                aria-hidden={!sidebarOpen}
            />

            {/* Sidebar */}
            <aside
                className={
                    'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white shadow-lg transition-transform duration-200 ease-out dark:border-slate-800 dark:bg-slate-900 lg:translate-x-0 ' +
                    (sidebarOpen ? 'translate-x-0' : '-translate-x-full')
                }
            >
                <div className="relative flex shrink-0 items-center justify-center border-b border-slate-200 px-4 py-4 dark:border-slate-800">
                    <Link
                        href={
                            can('dashboard.view')
                                ? route('dashboard')
                                : can('profile.view')
                                  ? route('profile.edit')
                                  : '#'
                        }
                        onClick={closeSidebar}
                        className="flex min-w-0 flex-col items-center justify-center text-center"
                    >
                        <AppLogo
                            logoUrl={logoUrl}
                            alt=""
                            className="mx-auto h-7 w-auto max-w-[9.5rem] object-contain lg:h-8"
                            fallback={
                                <span className="text-xl font-semibold tracking-tight text-sky-600">
                                    Bluinq
                                </span>
                            }
                        />
                    </Link>
                    <button
                        type="button"
                        className="absolute end-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
                        onClick={closeSidebar}
                        aria-label="Close sidebar"
                    >
                        <XMarkIcon className="h-5 w-5" aria-hidden />
                    </button>
                </div>

                <nav className="flex-1 space-y-1 overflow-y-auto p-3">
                    {can('dashboard.view') && (
                        <NavItem
                            href={route('dashboard')}
                            active={isDashboard}
                            onNavigate={closeSidebar}
                            icon={
                                <Squares2X2Icon
                                    className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-slate-500"
                                    aria-hidden
                                />
                            }
                        >
                            Dashboard
                        </NavItem>
                    )}
                    {canAnnouncements && (
                        <NavItem
                            href={route('announcements.index')}
                            active={isAnnouncements}
                            onNavigate={closeSidebar}
                            icon={
                                <MegaphoneIcon
                                    className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-slate-500"
                                    aria-hidden
                                />
                            }
                        >
                            Announcement
                        </NavItem>
                    )}
                    {canJobList && (
                        <NavItem
                            href={route('job.board')}
                            active={isJobList}
                            onNavigate={closeSidebar}
                            icon={
                                <ClipboardDocumentListIcon
                                    className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-slate-500"
                                    aria-hidden
                                />
                            }
                        >
                            Job list
                        </NavItem>
                    )}
                    {canTimesheet && (
                        <NavItem
                            href={route('timesheet.index')}
                            active={isTimesheet}
                            onNavigate={closeSidebar}
                            icon={
                                <ClockIcon
                                    className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-slate-500"
                                    aria-hidden
                                />
                            }
                        >
                            Timesheet
                        </NavItem>
                    )}
                    {canDraftingMemos && (
                        <NavItem
                            href={route('drafting-memos.index')}
                            active={isDraftingMemos}
                            onNavigate={closeSidebar}
                            icon={
                                <DocumentTextIcon
                                    className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-slate-500"
                                    aria-hidden
                                />
                            }
                        >
                            Drafting Memos
                        </NavItem>
                    )}
                    {canArchiProject && (
                        <div className="mt-3 space-y-1">
                            <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Workflow
                            </p>
                            <div>
                                <button
                                    type="button"
                                    aria-expanded={archiTeamMenuOpen}
                                    onClick={() =>
                                        setArchiTeamMenuOpen((open) => !open)
                                    }
                                    className={
                                        'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ' +
                                        (isArchiTeamSection
                                            ? 'bg-sky-50 text-sky-700'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900')
                                    }
                                >
                                    <BriefcaseIcon
                                        className={
                                            'h-5 w-5 shrink-0 ' +
                                            (isArchiTeamSection
                                                ? 'text-sky-600'
                                                : 'text-slate-400 group-hover:text-slate-500')
                                        }
                                        aria-hidden
                                    />
                                    <span className="min-w-0 flex-1">
                                        Archi Project
                                    </span>
                                    <ChevronRightIcon
                                        className={
                                            'h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ' +
                                            (archiTeamMenuOpen ? 'rotate-90' : '')
                                        }
                                        aria-hidden
                                    />
                                </button>
                                {archiTeamMenuOpen && (
                                    <div className="mt-0.5 space-y-0.5 pb-1">
                                        {canJobList && (
                                            <SidebarSubLink
                                                href={route('job.board')}
                                                active={isJobBoard}
                                                onNavigate={closeSidebar}
                                            >
                                                Drafting Requests
                                            </SidebarSubLink>
                                        )}
                                        {canDraftingRequest && (
                                            <SidebarSubLink
                                                href={route(
                                                    'job.drafting-request-form',
                                                )}
                                                active={isDraftingRequestForm}
                                                onNavigate={closeSidebar}
                                            >
                                                Drafting Request Form
                                            </SidebarSubLink>
                                        )}
                                        {canJobList && (
                                            <SidebarSubLink
                                                href={route('job.drafting.archive')}
                                                active={isDraftingArchive}
                                                onNavigate={closeSidebar}
                                            >
                                                Archive
                                            </SidebarSubLink>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {showSettingsBlock && (
                        <div className="mt-3 space-y-1">
                            {showWorkflowSettings && (
                                <NavItem
                                    href={route('settings.workflow')}
                                    active={isWorkflowSection}
                                    onNavigate={closeSidebar}
                                    icon={
                                        <WrenchScrewdriverIcon
                                            className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-slate-500"
                                            aria-hidden
                                        />
                                    }
                                >
                                    Workflow settings
                                </NavItem>
                            )}
                            {(canManageLeave || canManageLeaveCredits) && (
                                <>
                                    <p
                                        className={
                                            'px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 ' +
                                            (showWorkflowSettings
                                                ? 'pt-3'
                                                : 'pt-1')
                                        }
                                    >
                                        Leave
                                    </p>
                                    {canManageLeave && (
                                        <NavItem
                                            href={route('leave.approvals')}
                                            active={isLeaveApprovals}
                                            onNavigate={closeSidebar}
                                            icon={
                                                <ClipboardDocumentListIcon
                                                    className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-slate-500"
                                                    aria-hidden
                                                />
                                            }
                                        >
                                            <span className="flex flex-1 items-center justify-between gap-2">
                                                Approvals
                                                {pendingLeaveCount > 0 && (
                                                    <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                                        {pendingLeaveCount}
                                                    </span>
                                                )}
                                            </span>
                                        </NavItem>
                                    )}
                                    {canManageLeaveCredits && (
                                        <NavItem
                                            href={route('leave.credits.index')}
                                            active={isLeaveCredits}
                                            onNavigate={closeSidebar}
                                            icon={
                                                <CalendarDaysIcon
                                                    className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-slate-500"
                                                    aria-hidden
                                                />
                                            }
                                        >
                                            Credits
                                        </NavItem>
                                    )}
                                </>
                            )}
                            {(canUserAccounts ||
                                canPermissionsPage ||
                                canActivityLogs ||
                                canRoles) && (
                                <>
                                    <p
                                        className={
                                            'px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 ' +
                                            (showWorkflowSettings ||
                                            canManageLeave ||
                                            canManageLeaveCredits
                                                ? 'pt-3'
                                                : 'pt-1')
                                        }
                                    >
                                        Other settings
                                    </p>
                                    {canUserAccounts && (
                                        <NavItem
                                            href={route('settings.users.index')}
                                            active={isUsersSection}
                                            onNavigate={closeSidebar}
                                            icon={
                                                <UsersIcon
                                                    className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-slate-500"
                                                    aria-hidden
                                                />
                                            }
                                        >
                                            User accounts
                                        </NavItem>
                                    )}
                                    {canRoles && (
                                        <NavItem
                                            href={route('settings.roles.index')}
                                            active={isRolesSection}
                                            onNavigate={closeSidebar}
                                            icon={
                                                <ShieldCheckIcon
                                                    className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-slate-500"
                                                    aria-hidden
                                                />
                                            }
                                        >
                                            Roles
                                        </NavItem>
                                    )}
                                    {canPermissionsPage && (
                                        <NavItem
                                            href={route(
                                                'settings.permissions.edit',
                                            )}
                                            active={isPermissions}
                                            onNavigate={closeSidebar}
                                            icon={
                                                <KeyIcon
                                                    className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-slate-500"
                                                    aria-hidden
                                                />
                                            }
                                        >
                                            Role permissions
                                        </NavItem>
                                    )}
                                    {canActivityLogs && (
                                        <NavItem
                                            href={route(
                                                'settings.activity-logs.index',
                                            )}
                                            active={isActivityLogs}
                                            onNavigate={closeSidebar}
                                            icon={
                                                <ClockIcon
                                                    className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-slate-500"
                                                    aria-hidden
                                                />
                                            }
                                        >
                                            Activity logs
                                        </NavItem>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </nav>

                <div className="shrink-0 border-t border-slate-200 p-3 dark:border-slate-800">
                    {can('profile.view') ? (
                        <Link
                            href={route('profile.edit')}
                            onClick={closeSidebar}
                            className={
                                'flex gap-3 rounded-lg p-2 transition hover:bg-slate-50 dark:hover:bg-slate-800 ' +
                                (isProfile
                                    ? 'bg-sky-50 ring-1 ring-sky-100 dark:bg-sky-950/40 dark:ring-sky-900/50'
                                    : '')
                            }
                            aria-current={isProfile ? 'page' : undefined}
                        >
                            <UserAvatar
                                user={user}
                                className="h-10 w-10 text-sm"
                                ringClassName="ring-2 ring-slate-100 dark:ring-slate-700"
                            />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-200">
                                    {user.name}
                                </p>
                                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                    {user.email}
                                </p>
                                {(user.role || user.role_display_name) && (
                                    <p className="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                        {user.role_display_name ??
                                            roleLabel(user.role)}
                                    </p>
                                )}
                            </div>
                        </Link>
                    ) : (
                        <div className="flex gap-3 p-2">
                            <UserAvatar
                                user={user}
                                className="h-10 w-10 text-sm"
                                ringClassName="ring-2 ring-slate-100 dark:ring-slate-700"
                            />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-200">
                                    {user.name}
                                </p>
                                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                    {user.email}
                                </p>
                                {(user.role || user.role_display_name) && (
                                    <p className="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                        {user.role_display_name ??
                                            roleLabel(user.role)}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main: navbar + content */}
            <div className="flex min-h-screen flex-col lg:pl-64">
                <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:px-6">
                    <button
                        type="button"
                        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Open sidebar"
                    >
                        <Bars3Icon className="h-6 w-6" aria-hidden />
                    </button>

                    <div className="ml-auto flex items-center gap-2">
                        <ThemeToggle />
                        <Dropdown>
                            <Dropdown.Trigger>
                                <button
                                    type="button"
                                    aria-haspopup="menu"
                                    aria-label={`Account menu, ${user.name}`}
                                    className="flex max-w-[14rem] items-center gap-2.5 rounded-lg bg-white py-1.5 pl-1.5 pr-2 text-left text-sm font-medium text-slate-800 transition hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 sm:pl-2 sm:pr-3"
                                >
                                    <UserAvatar
                                        user={user}
                                        className="h-8 w-8 text-xs"
                                        ringClassName="ring-2 ring-slate-100 dark:ring-slate-700"
                                    />
                                    <span className="hidden min-w-0 flex-1 truncate sm:inline">
                                        {user.name}
                                    </span>
                                    <ChevronDownIcon
                                        className="h-4 w-4 shrink-0 text-slate-400 sm:ms-0"
                                        aria-hidden
                                    />
                                </button>
                            </Dropdown.Trigger>
                            <Dropdown.Content>
                                {can('profile.view') && (
                                    <Dropdown.Link href={route('profile.edit')}>
                                        Profile
                                    </Dropdown.Link>
                                )}
                                <Dropdown.Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                >
                                    Log out
                                </Dropdown.Link>
                            </Dropdown.Content>
                        </Dropdown>
                    </div>
                </header>

                <main className="flex-1 p-4 sm:p-6 lg:p-8">
                    {header && (
                        <div className="mb-6 border-b border-slate-200 pb-4 dark:border-slate-800">
                            {header}
                        </div>
                    )}
                    <div className="w-full">{children}</div>
                </main>
            </div>
        </div>
    );
}
