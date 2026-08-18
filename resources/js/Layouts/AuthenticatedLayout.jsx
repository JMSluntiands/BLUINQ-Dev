import AppLogo from '@/Components/AppLogo';
import Dropdown from '@/Components/Dropdown';
import GlobalSearch from '@/Components/GlobalSearch';
import ThemeToggle from '@/Components/ThemeToggle';
import UserAvatar from '@/Components/UserAvatar';
import {
    canAccessVisibleWorkflowSettings,
    isAnyWorkflowRoute,
} from '@/config/workflowSettingsModules';
import {
    Bars3Icon,
    BriefcaseIcon,
    CalendarDaysIcon,
    ChartBarIcon,
    ClipboardDocumentListIcon,
    ChevronDoubleLeftIcon,
    ChevronDoubleRightIcon,
    ChevronRightIcon,
    ClockIcon,
    KeyIcon,
    MegaphoneIcon,
    DocumentTextIcon,
    PaintBrushIcon,
    Squares2X2Icon,
    ShieldCheckIcon,
    SparklesIcon,
    UsersIcon,
    WrenchScrewdriverIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { Link, usePage } from '@inertiajs/react';
import {
    cloneElement,
    isValidElement,
    useEffect,
    useRef,
    useState,
} from 'react';

const SIDEBAR_MODE_KEY = 'bluinq.sidebar-mode';

function readSidebarMode() {
    if (typeof window === 'undefined') {
        return 'expanded';
    }

    const stored = window.localStorage.getItem(SIDEBAR_MODE_KEY);
    if (
        stored === 'expanded' ||
        stored === 'minimized' ||
        stored === 'hidden'
    ) {
        return stored;
    }

    return 'expanded';
}

function navLabel(children) {
    if (typeof children === 'string' || typeof children === 'number') {
        return String(children);
    }

    return undefined;
}

function roleLabel(role) {
    if (role === 'admin') {
        return 'Administrator';
    }
    if (role === 'user') {
        return 'User';
    }
    return role ? String(role) : '';
}

function NavItem({
    href,
    active,
    icon,
    children,
    onNavigate,
    collapsed = false,
    label,
}) {
    const resolvedIcon = isValidElement(icon)
        ? cloneElement(icon, {
              className:
                  (icon.props.className ?? '') +
                  (active
                      ? ' !text-[#0094FF] stroke-[2.4]'
                      : ' !text-[#9CB8E2] group-hover:!text-[#5D8FD4]'),
          })
        : icon;

    const title = label ?? navLabel(children);

    return (
        <Link
            href={href}
            onClick={onNavigate}
            title={collapsed ? title : undefined}
            className={
                'group flex items-center rounded-lg text-sm font-medium transition ' +
                (collapsed
                    ? 'justify-center px-2 py-2.5'
                    : 'gap-3 px-3 py-2.5') +
                ' ' +
                (active
                    ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100')
            }
        >
            {resolvedIcon}
            {!collapsed ? children : null}
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
    const {
        auth,
        logo_url: logoUrl,
        pendingLeaveCount = 0,
        pendingDraftingRequestCount = 0,
        pendingPasswordChangeCount = 0,
    } = usePage().props;
    const user = auth.user;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarMode, setSidebarMode] = useState(readSidebarMode);
    const lastVisibleMode = useRef(
        sidebarMode === 'hidden' ? 'expanded' : sidebarMode,
    );

    const closeSidebar = () => setSidebarOpen(false);
    const isMinimized = sidebarMode === 'minimized';
    const isHidden = sidebarMode === 'hidden';

    const persistSidebarMode = (mode) => {
        setSidebarMode(mode);
        if (mode === 'expanded' || mode === 'minimized') {
            lastVisibleMode.current = mode;
        }
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(SIDEBAR_MODE_KEY, mode);
        }
    };

    const toggleDesktopSidebar = () => {
        persistSidebarMode(isHidden ? lastVisibleMode.current : 'hidden');
    };

    const permissions = user?.permissions ?? [];
    const can = (slug) => permissions.includes(slug);
    const canBuildingType = can('settings.building-type.view');
    const canStoreyLevel = can('settings.storey-level.view');
    const canSdaType = can('settings.sda-type.view');
    const canBuildingClass = can('settings.building-class.view');
    const canWorkflowStatus = can('settings.workflow-status.view');
    const canServiceEngaging = can('settings.service-engaging.view');
    const canExternalWallConstruction = can(
        'settings.external-wall-construction.view',
    );
    const canRoofType = can('settings.roof-type.view');
    const canScopeOfWork = can('settings.scope-of-work.view');
    const canDeliverables = can('settings.deliverables.view');
    const canLevelOfDifficulty = can('settings.level-of-difficulty.view');
    const canArrivalInputFiles = can('settings.crm.arrival-input-files.view');
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
    const canReviewDraftingRequests = can('job.drafting-request.review');
    const canJobList = can('job.list.view');
    const canStatistic = can('job.statistic.view');
    const canAnnouncements = can('announcements.view');
    const canAnnouncementsManage = can('announcements.manage');
    const canTimesheet = can('timesheet.view');
    const canManageLeave = can('leave.manage');
    const canViewLeaveCredits =
        can('leave.credits.view') || can('leave.credits.edit');
    const canManageUserMilestones = can('profile.milestones.manage');
    const canDraftingMemos = can('drafting-memos.view');
    const canDraftingArchive = can('job.drafting.archive');
    const canDesignList = can('design.list.view');
    const canDesignMemos = can('design-memos.view');
    const canDesignCatalogue = can('design.catalogue.view');
    const canClientList = can('settings.client.view');
    const canApm =
        canJobList ||
        canReviewDraftingRequests ||
        canDraftingArchive ||
        can('job.drafting.view');
    const showArchiMenu = canDraftingMemos || canApm || canJobList;
    const showDesignMenu =
        canDesignList || canDesignMemos || canDesignCatalogue;

    const isDashboard = route().current('dashboard');
    const isAnnouncements =
        route().current('announcements.index') ||
        route().current('announcements.show') ||
        route().current('announcements.create') ||
        route().current('announcements.edit') ||
        route().current('announcements.archive');
    const isJobList =
        route().current('job.list') || route().current('job.board');
    const isJobStatusChart = route().current('job.status-chart');
    const isTimesheet = route().current('timesheet.index');
    const isLeaveApprovals = route().current('leave.approvals');
    const isLeaveCredits = route().current('leave.credits.index');
    const isUserMilestones =
        route().current('settings.user-milestones.index') ||
        route().current('settings.user-milestones.show');
    const isDraftingShow =
        route().current('job.drafting') || route().current('job.drafting.show');
    const isDraftingMemos = route().current('drafting-memos.index');
    const isDraftingArchive = route().current('job.drafting.archive');
    const isMasterlist =
        route().current('job.masterlist') ||
        route().current('job.masterlist.create') ||
        route().current('job.masterlist.edit') ||
        route().current('job.drafting-request-form');
    const isArchiMenuSection =
        isDraftingMemos || isJobList || isDraftingShow || isDraftingArchive;
    const isDesignList = route().current('design.list');
    const isDesignMemos = route().current('design-memos.*');
    const isDesignCatalogue = route().current('design.catalogue*');
    const isDesignMenuSection =
        isDesignList || isDesignMemos || isDesignCatalogue;
    const isUsersIndex = route().current('settings.users.index');
    const isUsersCreate = route().current('settings.users.create');
    const isUsersEdit = route().current('settings.users.edit');
    const isUsersArchive = route().current('settings.users.archive');
    const isUsersSection =
        isUsersIndex || isUsersCreate || isUsersEdit || isUsersArchive;
    const isPasswordRequests = route().current(
        'settings.password-requests.index',
    );
    const isPermissions = route().current('settings.permissions.edit');
    const isActivityLogs = route().current('settings.activity-logs.index');
    const isProfile = route().current('profile.edit');
    const isRolesIndex = route().current('settings.roles.index');
    const isRolesCreate = route().current('settings.roles.create');
    const isRolesEdit = route().current('settings.roles.edit');
    const isRolesSection = isRolesIndex || isRolesCreate || isRolesEdit;
    const isClientSection =
        route().current('settings.client.index') ||
        route().current('settings.client.archive');
    const isWorkflowSection = isAnyWorkflowRoute() && !isClientSection;

    const showSettingsBlock =
        canBuildingType ||
        canStoreyLevel ||
        canSdaType ||
        canBuildingClass ||
        canWorkflowStatus ||
        canServiceEngaging ||
        canExternalWallConstruction ||
        canRoofType ||
        canScopeOfWork ||
        canDeliverables ||
        canLevelOfDifficulty ||
        canArrivalInputFiles ||
        canCrmCategories ||
        canClientList ||
        canUserAccounts ||
        canPermissionsPage ||
        canActivityLogs ||
        canRoles ||
        canManageLeave ||
        canViewLeaveCredits ||
        canManageUserMilestones;
    const showWorkflowSettings = canAccessVisibleWorkflowSettings(can);

    const [archiMenuOpen, setArchiMenuOpen] = useState(isArchiMenuSection);
    const [designMenuOpen, setDesignMenuOpen] = useState(isDesignMenuSection);

    useEffect(() => {
        if (isArchiMenuSection) {
            setArchiMenuOpen(true);
        }
    }, [isArchiMenuSection]);

    useEffect(() => {
        if (isDesignMenuSection) {
            setDesignMenuOpen(true);
        }
    }, [isDesignMenuSection]);

    return (
        <div className="min-h-screen overflow-x-hidden bg-slate-100 dark:bg-[#0a0c14]">
            {/* Mobile sidebar backdrop */}
            <div
                className={
                    'fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity lg:hidden ' +
                    (sidebarOpen
                        ? 'opacity-100'
                        : 'pointer-events-none opacity-0')
                }
                onClick={closeSidebar}
                aria-hidden={!sidebarOpen}
            />

            {/* Sidebar */}
            <aside
                className={
                    'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white shadow-lg transition-[width,transform] duration-200 ease-out dark:border-slate-800 dark:bg-slate-900 ' +
                    (isMinimized ? 'w-64 lg:w-16' : 'w-64') +
                    ' ' +
                    (sidebarOpen ? 'translate-x-0' : '-translate-x-full') +
                    ' ' +
                    (isHidden ? 'lg:-translate-x-full' : 'lg:translate-x-0')
                }
            >
                <div
                    className={
                        'relative flex shrink-0 items-center border-b border-slate-200 py-4 dark:border-slate-800 ' +
                        (isMinimized
                            ? 'justify-center px-2 lg:flex-col lg:gap-2'
                            : 'justify-center px-4')
                    }
                >
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
                        title="Bluinq"
                    >
                        <AppLogo
                            logoUrl={logoUrl}
                            alt=""
                            className={
                                'mx-auto w-auto object-contain ' +
                                (isMinimized
                                    ? 'h-7 max-w-[9.5rem] lg:h-6 lg:max-w-[2.25rem]'
                                    : 'h-7 max-w-[9.5rem] lg:h-8')
                            }
                            fallback={
                                <span className="text-xl font-semibold tracking-tight text-sky-600">
                                    {isMinimized ? 'B' : 'Bluinq'}
                                </span>
                            }
                        />
                    </Link>
                    <div
                        className={
                            'absolute end-2 top-1/2 flex -translate-y-1/2 items-center gap-0.5 ' +
                            (isMinimized ? 'lg:static lg:translate-y-0' : '')
                        }
                    >
                        <button
                            type="button"
                            className="hidden rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:inline-flex"
                            onClick={() =>
                                persistSidebarMode(
                                    isMinimized ? 'expanded' : 'minimized',
                                )
                            }
                            aria-label={
                                isMinimized
                                    ? 'Expand sidebar'
                                    : 'Minimize sidebar'
                            }
                            title={
                                isMinimized
                                    ? 'Expand sidebar'
                                    : 'Minimize sidebar'
                            }
                        >
                            {isMinimized ? (
                                <ChevronDoubleRightIcon
                                    className="h-4 w-4"
                                    aria-hidden
                                />
                            ) : (
                                <ChevronDoubleLeftIcon
                                    className="h-4 w-4"
                                    aria-hidden
                                />
                            )}
                        </button>
                        <button
                            type="button"
                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
                            onClick={closeSidebar}
                            aria-label="Close sidebar"
                        >
                            <XMarkIcon className="h-5 w-5" aria-hidden />
                        </button>
                    </div>
                </div>

                <nav
                    className={
                        'flex-1 space-y-1 overflow-y-auto ' +
                        (isMinimized ? 'p-3 lg:p-2' : 'p-3')
                    }
                >
                    {can('dashboard.view') && (
                        <NavItem
                            href={route('dashboard')}
                            active={isDashboard}
                            onNavigate={closeSidebar}
                            collapsed={isMinimized}
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
                            collapsed={isMinimized}
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
                    {canDraftingRequest && (
                        <NavItem
                            href={route('job.masterlist')}
                            active={isMasterlist}
                            onNavigate={closeSidebar}
                            collapsed={isMinimized}
                            icon={
                                <ClipboardDocumentListIcon
                                    className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-slate-500"
                                    aria-hidden
                                />
                            }
                        >
                            Project Masterlist
                        </NavItem>
                    )}
                    {canStatistic && (
                        <NavItem
                            href={route('job.status-chart')}
                            active={isJobStatusChart}
                            onNavigate={closeSidebar}
                            collapsed={isMinimized}
                            icon={
                                <ChartBarIcon
                                    className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-slate-500"
                                    aria-hidden
                                />
                            }
                        >
                            Statistic
                        </NavItem>
                    )}
                    {canTimesheet && (
                        <NavItem
                            href={route('timesheet.index')}
                            active={isTimesheet}
                            onNavigate={closeSidebar}
                            collapsed={isMinimized}
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
                    {(showArchiMenu || showDesignMenu) && (
                        <div className="mt-3 space-y-1">
                            <p
                                className={
                                    'px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400 ' +
                                    (isMinimized ? 'lg:hidden' : '')
                                }
                            >
                                Workflow
                            </p>
                            {showArchiMenu && (
                                <div>
                                    <button
                                        type="button"
                                        aria-expanded={archiMenuOpen}
                                        title="Archi menu"
                                        onClick={() => {
                                            if (isMinimized) {
                                                persistSidebarMode('expanded');
                                                setArchiMenuOpen(true);
                                                return;
                                            }
                                            setArchiMenuOpen((open) => !open);
                                        }}
                                        className={
                                            'group flex w-full items-center rounded-lg text-left text-sm font-medium transition ' +
                                            (isMinimized
                                                ? 'justify-center px-2 py-2.5 lg:px-2'
                                                : 'gap-3 px-3 py-2.5') +
                                            ' ' +
                                            (isArchiMenuSection
                                                ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300'
                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100')
                                        }
                                    >
                                        <BriefcaseIcon
                                            className={
                                                'h-5 w-5 shrink-0 ' +
                                                (isArchiMenuSection
                                                    ? 'text-sky-600'
                                                    : 'text-slate-400 group-hover:text-slate-500')
                                            }
                                            aria-hidden
                                        />
                                        <span
                                            className={
                                                'min-w-0 flex-1 ' +
                                                (isMinimized ? 'lg:hidden' : '')
                                            }
                                        >
                                            Archi menu
                                        </span>
                                        <ChevronRightIcon
                                            className={
                                                'h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ' +
                                                (archiMenuOpen
                                                    ? 'rotate-90'
                                                    : '') +
                                                (isMinimized
                                                    ? ' lg:hidden'
                                                    : '')
                                            }
                                            aria-hidden
                                        />
                                    </button>
                                    {archiMenuOpen && (
                                        <div
                                            className={
                                                'mt-0.5 space-y-0.5 pb-1 ' +
                                                (isMinimized ? 'lg:hidden' : '')
                                            }
                                        >
                                            {canDraftingMemos && (
                                                <SidebarSubLink
                                                    href={route(
                                                        'drafting-memos.index',
                                                    )}
                                                    active={isDraftingMemos}
                                                    onNavigate={closeSidebar}
                                                    collapsed={isMinimized}
                                                >
                                                    Drafting Memos
                                                </SidebarSubLink>
                                            )}
                                            {canJobList && (
                                                <SidebarSubLink
                                                    href={route('job.list')}
                                                    active={
                                                        isJobList ||
                                                        isDraftingShow
                                                    }
                                                    onNavigate={closeSidebar}
                                                    collapsed={isMinimized}
                                                >
                                                    <span className="flex flex-1 items-center justify-between gap-2">
                                                        Archi Project Management
                                                        {canReviewDraftingRequests &&
                                                            pendingDraftingRequestCount >
                                                                0 && (
                                                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold leading-none text-white">
                                                                    {
                                                                        pendingDraftingRequestCount
                                                                    }
                                                                </span>
                                                            )}
                                                    </span>
                                                </SidebarSubLink>
                                            )}
                                            {canJobList && (
                                                <SidebarSubLink
                                                    href={route(
                                                        'job.drafting.archive',
                                                    )}
                                                    active={isDraftingArchive}
                                                    onNavigate={closeSidebar}
                                                    collapsed={isMinimized}
                                                >
                                                    Archive
                                                </SidebarSubLink>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                            {showDesignMenu && (
                                <div>
                                    <button
                                        type="button"
                                        aria-expanded={designMenuOpen}
                                        title="Design menu"
                                        onClick={() => {
                                            if (isMinimized) {
                                                persistSidebarMode('expanded');
                                                setDesignMenuOpen(true);
                                                return;
                                            }
                                            setDesignMenuOpen((open) => !open);
                                        }}
                                        className={
                                            'group flex w-full items-center rounded-lg text-left text-sm font-medium transition ' +
                                            (isMinimized
                                                ? 'justify-center px-2 py-2.5 lg:px-2'
                                                : 'gap-3 px-3 py-2.5') +
                                            ' ' +
                                            (isDesignMenuSection
                                                ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300'
                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100')
                                        }
                                    >
                                        <PaintBrushIcon
                                            className={
                                                'h-5 w-5 shrink-0 ' +
                                                (isDesignMenuSection
                                                    ? 'text-sky-600'
                                                    : 'text-slate-400 group-hover:text-slate-500')
                                            }
                                            aria-hidden
                                        />
                                        <span
                                            className={
                                                'min-w-0 flex-1 ' +
                                                (isMinimized ? 'lg:hidden' : '')
                                            }
                                        >
                                            Design menu
                                        </span>
                                        <ChevronRightIcon
                                            className={
                                                'h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ' +
                                                (designMenuOpen
                                                    ? 'rotate-90'
                                                    : '') +
                                                (isMinimized
                                                    ? ' lg:hidden'
                                                    : '')
                                            }
                                            aria-hidden
                                        />
                                    </button>
                                    {designMenuOpen && (
                                        <div
                                            className={
                                                'mt-0.5 space-y-0.5 pb-1 ' +
                                                (isMinimized ? 'lg:hidden' : '')
                                            }
                                        >
                                            {canDesignList && (
                                                <SidebarSubLink
                                                    href={route('design.list')}
                                                    active={isDesignList}
                                                    onNavigate={closeSidebar}
                                                    collapsed={isMinimized}
                                                >
                                                    Design Project Management
                                                </SidebarSubLink>
                                            )}
                                            {canDesignMemos && (
                                                <SidebarSubLink
                                                    href={route(
                                                        'design-memos.index',
                                                    )}
                                                    active={isDesignMemos}
                                                    onNavigate={closeSidebar}
                                                    collapsed={isMinimized}
                                                >
                                                    Design Memos
                                                </SidebarSubLink>
                                            )}
                                            {canDesignCatalogue && (
                                                <SidebarSubLink
                                                    href={route(
                                                        'design.catalogue',
                                                    )}
                                                    active={isDesignCatalogue}
                                                    onNavigate={closeSidebar}
                                                    collapsed={isMinimized}
                                                >
                                                    Design Catalogue
                                                </SidebarSubLink>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    {showSettingsBlock && (
                        <div className="mt-3 space-y-1">
                            {showWorkflowSettings && (
                                <NavItem
                                    href={route('settings.workflow')}
                                    active={isWorkflowSection}
                                    onNavigate={closeSidebar}
                                    collapsed={isMinimized}
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
                            {canClientList && (
                                <NavItem
                                    href={route('settings.client.index')}
                                    active={isClientSection}
                                    onNavigate={closeSidebar}
                                    collapsed={isMinimized}
                                    icon={
                                        <UsersIcon
                                            className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-slate-500"
                                            aria-hidden
                                        />
                                    }
                                >
                                    Client list
                                </NavItem>
                            )}
                            {(canManageLeave ||
                                canViewLeaveCredits ||
                                canManageUserMilestones) && (
                                <>
                                    <p
                                        className={
                                            'px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 ' +
                                            (showWorkflowSettings
                                                ? 'pt-3'
                                                : 'pt-1') +
                                            (isMinimized ? ' lg:hidden' : '')
                                        }
                                    >
                                        HR
                                    </p>
                                    {canManageLeave && (
                                        <NavItem
                                            href={route('leave.approvals')}
                                            active={isLeaveApprovals}
                                            onNavigate={closeSidebar}
                                            collapsed={isMinimized}
                                            label="Approvals"
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
                                                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold leading-none text-white">
                                                        {pendingLeaveCount}
                                                    </span>
                                                )}
                                            </span>
                                        </NavItem>
                                    )}
                                    {canViewLeaveCredits && (
                                        <NavItem
                                            href={route('leave.credits.index')}
                                            active={isLeaveCredits}
                                            onNavigate={closeSidebar}
                                            collapsed={isMinimized}
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
                                    {canManageUserMilestones && (
                                        <NavItem
                                            href={route(
                                                'settings.user-milestones.index',
                                            )}
                                            active={isUserMilestones}
                                            onNavigate={closeSidebar}
                                            collapsed={isMinimized}
                                            icon={
                                                <SparklesIcon
                                                    className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-slate-500"
                                                    aria-hidden
                                                />
                                            }
                                        >
                                            Milestones
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
                                            canViewLeaveCredits ||
                                            canManageUserMilestones
                                                ? 'pt-3'
                                                : 'pt-1') +
                                            (isMinimized ? ' lg:hidden' : '')
                                        }
                                    >
                                        Other settings
                                    </p>
                                    {canUserAccounts && (
                                        <NavItem
                                            href={route('settings.users.index')}
                                            active={isUsersSection}
                                            onNavigate={closeSidebar}
                                            collapsed={isMinimized}
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
                                    {canUserAccounts && (
                                        <NavItem
                                            href={route(
                                                'settings.password-requests.index',
                                            )}
                                            active={isPasswordRequests}
                                            onNavigate={closeSidebar}
                                            collapsed={isMinimized}
                                            label="Password requests"
                                            icon={
                                                <KeyIcon
                                                    className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-slate-500"
                                                    aria-hidden
                                                />
                                            }
                                        >
                                            <span className="flex flex-1 items-center justify-between gap-2">
                                                Password requests
                                                {pendingPasswordChangeCount >
                                                    0 && (
                                                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold leading-none text-white">
                                                        {
                                                            pendingPasswordChangeCount
                                                        }
                                                    </span>
                                                )}
                                            </span>
                                        </NavItem>
                                    )}
                                    {canRoles && (
                                        <NavItem
                                            href={route('settings.roles.index')}
                                            active={isRolesSection}
                                            onNavigate={closeSidebar}
                                            collapsed={isMinimized}
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
                                            collapsed={isMinimized}
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
                                            collapsed={isMinimized}
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

                <div
                    className={
                        'shrink-0 border-t border-slate-200 dark:border-slate-800 ' +
                        (isMinimized ? 'p-2 lg:p-2' : 'p-3')
                    }
                >
                    {can('profile.view') ? (
                        <Link
                            href={route('profile.edit')}
                            onClick={closeSidebar}
                            title={user.name}
                            className={
                                'flex rounded-lg p-2 transition hover:bg-slate-50 dark:hover:bg-slate-800 ' +
                                (isMinimized
                                    ? 'justify-center gap-0 lg:gap-0'
                                    : 'gap-3') +
                                ' ' +
                                (isProfile
                                    ? 'bg-sky-50 ring-1 ring-sky-100 dark:bg-sky-950/40 dark:ring-sky-900/50'
                                    : '')
                            }
                            aria-current={isProfile ? 'page' : undefined}
                        >
                            <UserAvatar
                                user={user}
                                className={
                                    isMinimized
                                        ? 'h-10 w-10 text-sm lg:h-8 lg:w-8 lg:text-xs'
                                        : 'h-10 w-10 text-sm'
                                }
                                ringClassName="ring-2 ring-slate-100 dark:ring-slate-700"
                            />
                            <div
                                className={
                                    'min-w-0 flex-1 ' +
                                    (isMinimized ? 'lg:hidden' : '')
                                }
                            >
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
                        <div
                            className={
                                'flex p-2 ' +
                                (isMinimized ? 'justify-center gap-0' : 'gap-3')
                            }
                            title={user.name}
                        >
                            <UserAvatar
                                user={user}
                                className={
                                    isMinimized
                                        ? 'h-10 w-10 text-sm lg:h-8 lg:w-8 lg:text-xs'
                                        : 'h-10 w-10 text-sm'
                                }
                                ringClassName="ring-2 ring-slate-100 dark:ring-slate-700"
                            />
                            <div
                                className={
                                    'min-w-0 flex-1 ' +
                                    (isMinimized ? 'lg:hidden' : '')
                                }
                            >
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
            <div
                className={
                    'flex min-h-screen min-w-0 flex-col transition-[padding] duration-200 ' +
                    (isHidden
                        ? 'lg:pl-0'
                        : isMinimized
                          ? 'lg:pl-16'
                          : 'lg:pl-64')
                }
            >
                <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:gap-4 sm:px-6">
                    <button
                        type="button"
                        className="shrink-0 rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Open sidebar"
                    >
                        <Bars3Icon className="h-6 w-6" aria-hidden />
                    </button>
                    <button
                        type="button"
                        className="hidden shrink-0 rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:inline-flex"
                        onClick={toggleDesktopSidebar}
                        aria-label={isHidden ? 'Show sidebar' : 'Hide sidebar'}
                        title={isHidden ? 'Show sidebar' : 'Hide sidebar'}
                    >
                        {isHidden ? (
                            <ChevronDoubleRightIcon
                                className="h-5 w-5"
                                aria-hidden
                            />
                        ) : (
                            <Bars3Icon className="h-6 w-6" aria-hidden />
                        )}
                    </button>

                    <GlobalSearch />

                    <div className="flex shrink-0 items-center gap-2">
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

                <main className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
                    {header && (
                        <div className="mb-6 border-b border-slate-200 pb-4 dark:border-slate-800">
                            {header}
                        </div>
                    )}
                    <div className="w-full min-w-0">{children}</div>
                </main>
            </div>
        </div>
    );
}
