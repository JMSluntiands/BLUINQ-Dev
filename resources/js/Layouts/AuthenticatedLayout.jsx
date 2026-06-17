import AppLogo from '@/Components/AppLogo';
import Dropdown from '@/Components/Dropdown';
import ThemeToggle from '@/Components/ThemeToggle';
import UserAvatar from '@/Components/UserAvatar';
import {
    ArrowDownTrayIcon,
    Bars3Icon,
    BuildingOffice2Icon,
    BriefcaseIcon,
    ChartBarIcon,
    ClipboardDocumentListIcon,
    ChevronRightIcon,
    ClockIcon,
    HomeModernIcon,
    KeyIcon,
    HomeIcon,
    InboxStackIcon,
    MegaphoneIcon,
    Squares2X2Icon,
    ShieldCheckIcon,
    TagIcon,
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
    const { auth, logo_url: logoUrl } = usePage().props;
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
    const isJobBoard =
        route().current('job.board') || route().current('job.drafting');
    const isDraftingList = isJobBoard || route().current('job.drafting.show');
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
    const isBtIndex = route().current('settings.building-type.index');
    const isBtCreate = route().current('settings.building-type.create');
    const isBtArchive = route().current('settings.building-type.archive');
    const isBtSection = isBtIndex || isBtCreate || isBtArchive;
    const isSeIndex = route().current('settings.service-engaging.index');
    const isSeCreate = route().current('settings.service-engaging.create');
    const isSeArchive = route().current('settings.service-engaging.archive');
    const isSeSection = isSeIndex || isSeCreate || isSeArchive;
    const isEwcIndex = route().current('settings.external-wall-construction.index');
    const isEwcCreate = route().current('settings.external-wall-construction.create');
    const isEwcArchive = route().current('settings.external-wall-construction.archive');
    const isEwcSection = isEwcIndex || isEwcCreate || isEwcArchive;
    const isRtIndex = route().current('settings.roof-type.index');
    const isRtCreate = route().current('settings.roof-type.create');
    const isRtArchive = route().current('settings.roof-type.archive');
    const isRtSection = isRtIndex || isRtCreate || isRtArchive;
    const isSowIndex = route().current('settings.scope-of-work.index');
    const isSowCreate = route().current('settings.scope-of-work.create');
    const isSowArchive = route().current('settings.scope-of-work.archive');
    const isSowSection = isSowIndex || isSowCreate || isSowArchive;
    const isDelIndex = route().current('settings.deliverables.index');
    const isDelCreate = route().current('settings.deliverables.create');
    const isDelArchive = route().current('settings.deliverables.archive');
    const isDelSection = isDelIndex || isDelCreate || isDelArchive;
    const isLodIndex = route().current('settings.level-of-difficulty.index');
    const isLodCreate = route().current('settings.level-of-difficulty.create');
    const isLodArchive = route().current('settings.level-of-difficulty.archive');
    const isLodSection = isLodIndex || isLodCreate || isLodArchive;
    const isAifIndex = route().current(
        'settings.crm.arrival-input-files.index',
    );
    const isAifCreate = route().current(
        'settings.crm.arrival-input-files.create',
    );
    const isAifEdit = route().current('settings.crm.arrival-input-files.edit');
    const isAifArchive = route().current(
        'settings.crm.arrival-input-files.archive',
    );
    const isAifSection =
        isAifIndex || isAifCreate || isAifEdit || isAifArchive;
    const isCatIndex = route().current('settings.crm.categories.index');
    const isCatCreate = route().current('settings.crm.categories.create');
    const isCatEdit = route().current('settings.crm.categories.edit');
    const isCatArchive = route().current('settings.crm.categories.archive');
    const isCatSection =
        isCatIndex || isCatCreate || isCatEdit || isCatArchive;

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
        canRoles;
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

    const [btMenuOpen, setBtMenuOpen] = useState(isBtSection);
    const [seMenuOpen, setSeMenuOpen] = useState(isSeSection);
    const [ewcMenuOpen, setEwcMenuOpen] = useState(isEwcSection);
    const [rtMenuOpen, setRtMenuOpen] = useState(isRtSection);
    const [sowMenuOpen, setSowMenuOpen] = useState(isSowSection);
    const [delMenuOpen, setDelMenuOpen] = useState(isDelSection);
    const [lodMenuOpen, setLodMenuOpen] = useState(isLodSection);
    const [aifMenuOpen, setAifMenuOpen] = useState(isAifSection);
    const [catMenuOpen, setCatMenuOpen] = useState(isCatSection);
    const [archiTeamMenuOpen, setArchiTeamMenuOpen] =
        useState(isArchiTeamSection);

    useEffect(() => {
        if (isBtSection) {
            setBtMenuOpen(true);
        }
    }, [isBtSection]);

    useEffect(() => {
        if (isSeSection) {
            setSeMenuOpen(true);
        }
    }, [isSeSection]);

    useEffect(() => {
        if (isEwcSection) {
            setEwcMenuOpen(true);
        }
    }, [isEwcSection]);

    useEffect(() => {
        if (isRtSection) {
            setRtMenuOpen(true);
        }
    }, [isRtSection]);

    useEffect(() => {
        if (isSowSection) {
            setSowMenuOpen(true);
        }
    }, [isSowSection]);

    useEffect(() => {
        if (isDelSection) {
            setDelMenuOpen(true);
        }
    }, [isDelSection]);

    useEffect(() => {
        if (isLodSection) {
            setLodMenuOpen(true);
        }
    }, [isLodSection]);

    useEffect(() => {
        if (isAifSection) {
            setAifMenuOpen(true);
        }
    }, [isAifSection]);

    useEffect(() => {
        if (isCatSection) {
            setCatMenuOpen(true);
        }
    }, [isCatSection]);

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
                                <p className="px-3 pt-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                    Workflow settings
                                </p>
                            )}
                            {canServiceEngaging && (
                                <div>
                                    <button
                                        type="button"
                                        aria-expanded={seMenuOpen}
                                        onClick={() =>
                                            setSeMenuOpen((open) => !open)
                                        }
                                        className={
                                            'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ' +
                                            (isSeSection
                                                ? 'bg-sky-50 text-sky-700'
                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900')
                                        }
                                    >
                                        <WrenchScrewdriverIcon
                                            className={
                                                'h-5 w-5 shrink-0 ' +
                                                (isSeSection
                                                    ? 'text-sky-600'
                                                    : 'text-slate-400 group-hover:text-slate-500')
                                            }
                                            aria-hidden
                                        />
                                        <span className="min-w-0 flex-1">
                                            Service Engaging
                                        </span>
                                        <ChevronRightIcon
                                            className={
                                                'h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ' +
                                                (seMenuOpen ? 'rotate-90' : '')
                                            }
                                            aria-hidden
                                        />
                                    </button>
                                    {seMenuOpen && (
                                        <div className="mt-0.5 space-y-0.5 pb-1">
                                            <SidebarSubLink
                                                href={route(
                                                    'settings.service-engaging.create',
                                                )}
                                                active={isSeCreate}
                                                onNavigate={closeSidebar}
                                            >
                                                Create
                                            </SidebarSubLink>
                                            <SidebarSubLink
                                                href={route(
                                                    'settings.service-engaging.index',
                                                )}
                                                active={isSeIndex}
                                                onNavigate={closeSidebar}
                                            >
                                                List
                                            </SidebarSubLink>
                                            <SidebarSubLink
                                                href={route(
                                                    'settings.service-engaging.archive',
                                                )}
                                                active={isSeArchive}
                                                onNavigate={closeSidebar}
                                            >
                                                Archive
                                            </SidebarSubLink>
                                        </div>
                                    )}
                                </div>
                            )}
                            {canExternalWallConstruction && (
                                <div>
                                    <button
                                        type="button"
                                        aria-expanded={ewcMenuOpen}
                                        onClick={() =>
                                            setEwcMenuOpen((open) => !open)
                                        }
                                        className={
                                            'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ' +
                                            (isEwcSection
                                                ? 'bg-sky-50 text-sky-700'
                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900')
                                        }
                                    >
                                        <HomeModernIcon
                                            className={
                                                'h-5 w-5 shrink-0 ' +
                                                (isEwcSection
                                                    ? 'text-sky-600'
                                                    : 'text-slate-400 group-hover:text-slate-500')
                                            }
                                            aria-hidden
                                        />
                                        <span className="min-w-0 flex-1">
                                            External Wall Construction
                                        </span>
                                        <ChevronRightIcon
                                            className={
                                                'h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ' +
                                                (ewcMenuOpen ? 'rotate-90' : '')
                                            }
                                            aria-hidden
                                        />
                                    </button>
                                    {ewcMenuOpen && (
                                        <div className="mt-0.5 space-y-0.5 pb-1">
                                            <SidebarSubLink
                                                href={route(
                                                    'settings.external-wall-construction.create',
                                                )}
                                                active={isEwcCreate}
                                                onNavigate={closeSidebar}
                                            >
                                                Create
                                            </SidebarSubLink>
                                            <SidebarSubLink
                                                href={route(
                                                    'settings.external-wall-construction.index',
                                                )}
                                                active={isEwcIndex}
                                                onNavigate={closeSidebar}
                                            >
                                                List
                                            </SidebarSubLink>
                                            <SidebarSubLink
                                                href={route(
                                                    'settings.external-wall-construction.archive',
                                                )}
                                                active={isEwcArchive}
                                                onNavigate={closeSidebar}
                                            >
                                                Archive
                                            </SidebarSubLink>
                                        </div>
                                    )}
                                </div>
                            )}
                            {canRoofType && (
                                <div>
                                    <button
                                        type="button"
                                        aria-expanded={rtMenuOpen}
                                        onClick={() =>
                                            setRtMenuOpen((open) => !open)
                                        }
                                        className={
                                            'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ' +
                                            (isRtSection
                                                ? 'bg-sky-50 text-sky-700'
                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900')
                                        }
                                    >
                                        <HomeIcon
                                            className={
                                                'h-5 w-5 shrink-0 ' +
                                                (isRtSection
                                                    ? 'text-sky-600'
                                                    : 'text-slate-400 group-hover:text-slate-500')
                                            }
                                            aria-hidden
                                        />
                                        <span className="min-w-0 flex-1">
                                            Roof Type
                                        </span>
                                        <ChevronRightIcon
                                            className={
                                                'h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ' +
                                                (rtMenuOpen ? 'rotate-90' : '')
                                            }
                                            aria-hidden
                                        />
                                    </button>
                                    {rtMenuOpen && (
                                        <div className="mt-0.5 space-y-0.5 pb-1">
                                            <SidebarSubLink
                                                href={route(
                                                    'settings.roof-type.create',
                                                )}
                                                active={isRtCreate}
                                                onNavigate={closeSidebar}
                                            >
                                                Create
                                            </SidebarSubLink>
                                            <SidebarSubLink
                                                href={route(
                                                    'settings.roof-type.index',
                                                )}
                                                active={isRtIndex}
                                                onNavigate={closeSidebar}
                                            >
                                                List
                                            </SidebarSubLink>
                                            <SidebarSubLink
                                                href={route(
                                                    'settings.roof-type.archive',
                                                )}
                                                active={isRtArchive}
                                                onNavigate={closeSidebar}
                                            >
                                                Archive
                                            </SidebarSubLink>
                                        </div>
                                    )}
                                </div>
                            )}
                            {canScopeOfWork && (
                                <div>
                                    <button
                                        type="button"
                                        aria-expanded={sowMenuOpen}
                                        onClick={() =>
                                            setSowMenuOpen((open) => !open)
                                        }
                                        className={
                                            'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ' +
                                            (isSowSection
                                                ? 'bg-sky-50 text-sky-700'
                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900')
                                        }
                                    >
                                        <ClipboardDocumentListIcon
                                            className={
                                                'h-5 w-5 shrink-0 ' +
                                                (isSowSection
                                                    ? 'text-sky-600'
                                                    : 'text-slate-400 group-hover:text-slate-500')
                                            }
                                            aria-hidden
                                        />
                                        <span className="min-w-0 flex-1">
                                            Scope of work
                                        </span>
                                        <ChevronRightIcon
                                            className={
                                                'h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ' +
                                                (sowMenuOpen ? 'rotate-90' : '')
                                            }
                                            aria-hidden
                                        />
                                    </button>
                                    {sowMenuOpen && (
                                        <div className="mt-0.5 space-y-0.5 pb-1">
                                            <SidebarSubLink
                                                href={route(
                                                    'settings.scope-of-work.create',
                                                )}
                                                active={isSowCreate}
                                                onNavigate={closeSidebar}
                                            >
                                                Create
                                            </SidebarSubLink>
                                            <SidebarSubLink
                                                href={route(
                                                    'settings.scope-of-work.index',
                                                )}
                                                active={isSowIndex}
                                                onNavigate={closeSidebar}
                                            >
                                                List
                                            </SidebarSubLink>
                                            <SidebarSubLink
                                                href={route(
                                                    'settings.scope-of-work.archive',
                                                )}
                                                active={isSowArchive}
                                                onNavigate={closeSidebar}
                                            >
                                                Archive
                                            </SidebarSubLink>
                                        </div>
                                    )}
                                </div>
                            )}
                            {canDeliverables && (
                                <div>
                                    <button
                                        type="button"
                                        aria-expanded={delMenuOpen}
                                        onClick={() =>
                                            setDelMenuOpen((open) => !open)
                                        }
                                        className={
                                            'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ' +
                                            (isDelSection
                                                ? 'bg-sky-50 text-sky-700'
                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900')
                                        }
                                    >
                                        <InboxStackIcon
                                            className={
                                                'h-5 w-5 shrink-0 ' +
                                                (isDelSection
                                                    ? 'text-sky-600'
                                                    : 'text-slate-400 group-hover:text-slate-500')
                                            }
                                            aria-hidden
                                        />
                                        <span className="min-w-0 flex-1">
                                            Deliverables
                                        </span>
                                        <ChevronRightIcon
                                            className={
                                                'h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ' +
                                                (delMenuOpen ? 'rotate-90' : '')
                                            }
                                            aria-hidden
                                        />
                                    </button>
                                    {delMenuOpen && (
                                        <div className="mt-0.5 space-y-0.5 pb-1">
                                            <SidebarSubLink
                                                href={route(
                                                    'settings.deliverables.create',
                                                )}
                                                active={isDelCreate}
                                                onNavigate={closeSidebar}
                                            >
                                                Create
                                            </SidebarSubLink>
                                            <SidebarSubLink
                                                href={route(
                                                    'settings.deliverables.index',
                                                )}
                                                active={isDelIndex}
                                                onNavigate={closeSidebar}
                                            >
                                                List
                                            </SidebarSubLink>
                                            <SidebarSubLink
                                                href={route(
                                                    'settings.deliverables.archive',
                                                )}
                                                active={isDelArchive}
                                                onNavigate={closeSidebar}
                                            >
                                                Archive
                                            </SidebarSubLink>
                                        </div>
                                    )}
                                </div>
                            )}
                            {canBuildingType && (
                                        <div>
                                            <button
                                                type="button"
                                                aria-expanded={btMenuOpen}
                                                onClick={() =>
                                                    setBtMenuOpen((open) => !open)
                                                }
                                                className={
                                                    'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ' +
                                                    (isBtSection
                                                        ? 'bg-sky-50 text-sky-700'
                                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900')
                                                }
                                            >
                                                <BuildingOffice2Icon
                                                    className={
                                                        'h-5 w-5 shrink-0 ' +
                                                        (isBtSection
                                                            ? 'text-sky-600'
                                                            : 'text-slate-400 group-hover:text-slate-500')
                                                    }
                                                    aria-hidden
                                                />
                                                <span className="min-w-0 flex-1">
                                                    Building Type
                                                </span>
                                                <ChevronRightIcon
                                                    className={
                                                        'h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ' +
                                                        (btMenuOpen ? 'rotate-90' : '')
                                                    }
                                                    aria-hidden
                                                />
                                            </button>
                                            {btMenuOpen && (
                                                <div className="mt-0.5 space-y-0.5 pb-1">
                                                    <SidebarSubLink
                                                        href={route(
                                                            'settings.building-type.create',
                                                        )}
                                                        active={isBtCreate}
                                                        onNavigate={closeSidebar}
                                                    >
                                                        Create
                                                    </SidebarSubLink>
                                                    <SidebarSubLink
                                                        href={route(
                                                            'settings.building-type.index',
                                                        )}
                                                        active={isBtIndex}
                                                        onNavigate={closeSidebar}
                                                    >
                                                        List
                                                    </SidebarSubLink>
                                                    <SidebarSubLink
                                                        href={route(
                                                            'settings.building-type.archive',
                                                        )}
                                                        active={isBtArchive}
                                                        onNavigate={closeSidebar}
                                                    >
                                                        Archive
                                                    </SidebarSubLink>
                                                </div>
                                            )}
                                        </div>
                                    )}
                            {canArrivalInputFiles && (
                                        <div>
                                            <button
                                                type="button"
                                                aria-expanded={aifMenuOpen}
                                                onClick={() =>
                                                    setAifMenuOpen(
                                                        (open) => !open,
                                                    )
                                                }
                                                className={
                                                    'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ' +
                                                    (isAifSection
                                                        ? 'bg-sky-50 text-sky-700'
                                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900')
                                                }
                                            >
                                                <ArrowDownTrayIcon
                                                    className={
                                                        'h-5 w-5 shrink-0 ' +
                                                        (isAifSection
                                                            ? 'text-sky-600'
                                                            : 'text-slate-400 group-hover:text-slate-500')
                                                    }
                                                    aria-hidden
                                                />
                                                <span className="min-w-0 flex-1">
                                                    Arrival input files
                                                </span>
                                                <ChevronRightIcon
                                                    className={
                                                        'h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ' +
                                                        (aifMenuOpen
                                                            ? 'rotate-90'
                                                            : '')
                                                    }
                                                    aria-hidden
                                                />
                                            </button>
                                            {aifMenuOpen && (
                                                <div className="mt-0.5 space-y-0.5 pb-1">
                                                    <SidebarSubLink
                                                        href={route(
                                                            'settings.crm.arrival-input-files.create',
                                                        )}
                                                        active={isAifCreate}
                                                        onNavigate={
                                                            closeSidebar
                                                        }
                                                    >
                                                        Create
                                                    </SidebarSubLink>
                                                    <SidebarSubLink
                                                        href={route(
                                                            'settings.crm.arrival-input-files.index',
                                                        )}
                                                        active={isAifIndex}
                                                        onNavigate={
                                                            closeSidebar
                                                        }
                                                    >
                                                        List
                                                    </SidebarSubLink>
                                                    <SidebarSubLink
                                                        href={route(
                                                            'settings.crm.arrival-input-files.archive',
                                                        )}
                                                        active={isAifArchive}
                                                        onNavigate={
                                                            closeSidebar
                                                        }
                                                    >
                                                        Archive
                                                    </SidebarSubLink>
                                                </div>
                                            )}
                                        </div>
                                    )}
                            {canCrmCategories && (
                                        <div>
                                            <button
                                                type="button"
                                                aria-expanded={catMenuOpen}
                                                onClick={() =>
                                                    setCatMenuOpen(
                                                        (open) => !open,
                                                    )
                                                }
                                                className={
                                                    'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ' +
                                                    (isCatSection
                                                        ? 'bg-sky-50 text-sky-700'
                                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900')
                                                }
                                            >
                                                <TagIcon
                                                    className={
                                                        'h-5 w-5 shrink-0 ' +
                                                        (isCatSection
                                                            ? 'text-sky-600'
                                                            : 'text-slate-400 group-hover:text-slate-500')
                                                    }
                                                    aria-hidden
                                                />
                                                <span className="min-w-0 flex-1">
                                                    Category
                                                </span>
                                                <ChevronRightIcon
                                                    className={
                                                        'h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ' +
                                                        (catMenuOpen
                                                            ? 'rotate-90'
                                                            : '')
                                                    }
                                                    aria-hidden
                                                />
                                            </button>
                                            {catMenuOpen && (
                                                <div className="mt-0.5 space-y-0.5 pb-1">
                                                    <SidebarSubLink
                                                        href={route(
                                                            'settings.crm.categories.create',
                                                        )}
                                                        active={isCatCreate}
                                                        onNavigate={
                                                            closeSidebar
                                                        }
                                                    >
                                                        Create
                                                    </SidebarSubLink>
                                                    <SidebarSubLink
                                                        href={route(
                                                            'settings.crm.categories.index',
                                                        )}
                                                        active={isCatIndex}
                                                        onNavigate={
                                                            closeSidebar
                                                        }
                                                    >
                                                        List
                                                    </SidebarSubLink>
                                                    <SidebarSubLink
                                                        href={route(
                                                            'settings.crm.categories.archive',
                                                        )}
                                                        active={isCatArchive}
                                                        onNavigate={
                                                            closeSidebar
                                                        }
                                                    >
                                                        Archive
                                                    </SidebarSubLink>
                                                </div>
                                            )}
                                        </div>
                                    )}
                            {canLevelOfDifficulty && (
                                        <div>
                                            <button
                                                type="button"
                                                aria-expanded={lodMenuOpen}
                                                onClick={() =>
                                                    setLodMenuOpen((open) => !open)
                                                }
                                                className={
                                                    'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ' +
                                                    (isLodSection
                                                        ? 'bg-sky-50 text-sky-700'
                                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900')
                                                }
                                            >
                                                <ChartBarIcon
                                                    className={
                                                        'h-5 w-5 shrink-0 ' +
                                                        (isLodSection
                                                            ? 'text-sky-600'
                                                            : 'text-slate-400 group-hover:text-slate-500')
                                                    }
                                                    aria-hidden
                                                />
                                                <span className="min-w-0 flex-1">
                                                    Level of difficulty
                                                </span>
                                                <ChevronRightIcon
                                                    className={
                                                        'h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ' +
                                                        (lodMenuOpen ? 'rotate-90' : '')
                                                    }
                                                    aria-hidden
                                                />
                                            </button>
                                            {lodMenuOpen && (
                                                <div className="mt-0.5 space-y-0.5 pb-1">
                                                    <SidebarSubLink
                                                        href={route(
                                                            'settings.level-of-difficulty.create',
                                                        )}
                                                        active={isLodCreate}
                                                        onNavigate={closeSidebar}
                                                    >
                                                        Create
                                                    </SidebarSubLink>
                                                    <SidebarSubLink
                                                        href={route(
                                                            'settings.level-of-difficulty.index',
                                                        )}
                                                        active={isLodIndex}
                                                        onNavigate={closeSidebar}
                                                    >
                                                        List
                                                    </SidebarSubLink>
                                                    <SidebarSubLink
                                                        href={route(
                                                            'settings.level-of-difficulty.archive',
                                                        )}
                                                        active={isLodArchive}
                                                        onNavigate={closeSidebar}
                                                    >
                                                        Archive
                                                    </SidebarSubLink>
                                                </div>
                                            )}
                                        </div>
                                    )}
                            {(canUserAccounts ||
                                canPermissionsPage ||
                                canActivityLogs ||
                                canRoles) && (
                                <>
                                    <p
                                        className={
                                            'px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 ' +
                                            (showWorkflowSettings
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
