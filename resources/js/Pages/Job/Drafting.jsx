import UserAvatar from '@/Components/UserAvatar';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    ArrowTopRightOnSquareIcon,
    ChatBubbleLeftRightIcon,
    ChevronDownIcon,
    ClockIcon,
    DocumentTextIcon,
    EllipsisHorizontalIcon,
    FolderIcon,
    LockClosedIcon,
} from '@heroicons/react/24/outline';
import FlashNoticeModal from '@/Components/FlashNoticeModal';
import { Head, Link, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';

const TABS = [
    { id: 'recents', label: 'Recents', icon: ClockIcon },
    { id: 'content', label: 'Content', icon: DocumentTextIcon },
    { id: 'permissions', label: 'Permissions', icon: LockClosedIcon },
];

const FLASH_MESSAGES = {
    'drf-submitted':
        'Your drafting request was submitted successfully.',
};

const RECENT_ITEMS = [
    {
        id: 'drf',
        label: 'Drafting Request Form (DRF)',
        icon: 'document-lock',
        routeName: 'job.drafting-request-form',
    },
    {
        id: 'apm',
        label: 'Archi Project Management (APM)',
        icon: 'folder-external',
        href: '#',
    },
];

function PlaceholderAvatar({ label, className = '' }) {
    return (
        <span
            className={
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-[10px] font-bold uppercase tracking-tight text-slate-600 ' +
                className
            }
            aria-hidden
        >
            {label}
        </span>
    );
}

export default function JobDrafting() {
    const { auth } = usePage().props;
    const user = auth?.user;
    const baseId = useId();
    const [activeTab, setActiveTab] = useState('recents');
    const [openMenuFor, setOpenMenuFor] = useState(null);

    useEffect(() => {
        const handleWindowClick = () => setOpenMenuFor(null);
        window.addEventListener('click', handleWindowClick);
        return () => window.removeEventListener('click', handleWindowClick);
    }, []);

    const tabButtonClass = useCallback(
        (id) => {
            const active = activeTab === id;
            return (
                'flex items-center gap-2 border-b-2 px-4 py-3.5 text-sm font-medium transition ' +
                (active
                    ? 'border-[#0073ea] text-[#0073ea]'
                    : 'border-transparent text-slate-500 hover:text-slate-800')
            );
        },
        [activeTab],
    );

    const listIcon = useMemo(
        () => ({
            'document-lock': (
                <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#f6f7fb] text-[#676879]">
                    <DocumentTextIcon className="h-5 w-5" aria-hidden />
                    <LockClosedIcon
                        className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-sm bg-white text-[#676879] ring-1 ring-[#e6e9ef]"
                        aria-hidden
                    />
                </span>
            ),
            'folder-external': (
                <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#f6f7fb] text-[#676879]">
                    <FolderIcon className="h-5 w-5" aria-hidden />
                    <ArrowTopRightOnSquareIcon
                        className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-sm bg-white text-[#676879] ring-1 ring-[#e6e9ef]"
                        aria-hidden
                    />
                </span>
            ),
        }),
        [],
    );

    return (
        <AuthenticatedLayout>
            <Head title="Archi Team" />

            <FlashNoticeModal messages={FLASH_MESSAGES} />

            <div className="w-full min-w-0">
                <div className="overflow-hidden rounded-2xl border border-[#e6e9ef] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
                    {/* Workspace header */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e6e9ef] px-5 py-5 sm:px-6">
                        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                            <div
                                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#6B2D3C] text-lg font-semibold tracking-tight text-white shadow-sm sm:h-14 sm:w-14 sm:text-xl"
                                aria-hidden
                            >
                                A
                            </div>
                            <button
                                type="button"
                                className="group flex min-w-0 items-center gap-1.5 text-left"
                                aria-haspopup="true"
                                aria-expanded="false"
                            >
                                <span className="truncate text-lg font-semibold tracking-tight text-[#323338] sm:text-xl">
                                    Archi Team
                                </span>
                                <ChevronDownIcon
                                    className="h-4 w-4 shrink-0 text-[#676879] transition group-hover:text-[#323338]"
                                    aria-hidden
                                />
                            </button>
                        </div>

                        <div className="flex w-full flex-wrap items-center justify-between gap-3 sm:w-auto sm:justify-end sm:gap-4">
                            <a
                                href="#"
                                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-[#676879] transition hover:bg-[#f6f7fb] hover:text-[#323338]"
                            >
                                <ChatBubbleLeftRightIcon
                                    className="h-4 w-4 text-[#c5c7d0]"
                                    aria-hidden
                                />
                                Feedback
                            </a>

                            <div
                                className="flex flex-1 items-center justify-end gap-0 sm:flex-initial sm:justify-start"
                            >
                                <div
                                    className="flex items-center -space-x-2"
                                    aria-label="Team members"
                                >
                                    {user && (
                                        <UserAvatar
                                            user={user}
                                            className="h-8 w-8 text-[10px]"
                                            ringClassName="ring-2 ring-white"
                                        />
                                    )}
                                    <PlaceholderAvatar label="JC" />
                                    <PlaceholderAvatar label="NM" />
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-white bg-[#f6f7fb] text-[10px] font-semibold text-[#676879]">
                                        +2
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3">
                                <button
                                    type="button"
                                    className="rounded-md border border-[#c5c7d0] bg-white px-3 py-1.5 text-sm font-semibold text-[#323338] shadow-sm transition hover:bg-[#f6f7fb]"
                                >
                                    Invite / 5
                                </button>

                                <button
                                    type="button"
                                    className="rounded-lg p-2 text-[#676879] transition hover:bg-[#f6f7fb] hover:text-[#323338]"
                                    aria-label="More options"
                                >
                                    <EllipsisHorizontalIcon
                                        className="h-5 w-5"
                                        aria-hidden
                                    />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div
                        className="flex border-b border-[#e6e9ef] px-3 sm:px-5"
                        role="tablist"
                        aria-label="Archi Team sections"
                    >
                        {TABS.map(({ id, label, icon: Icon }) => {
                            const panelId = `${baseId}-panel-${id}`;
                            const tabId = `${baseId}-tab-${id}`;
                            return (
                                <button
                                    key={id}
                                    id={tabId}
                                    type="button"
                                    role="tab"
                                    aria-selected={activeTab === id}
                                    aria-controls={panelId}
                                    className={tabButtonClass(id)}
                                    onClick={() => setActiveTab(id)}
                                >
                                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                                    {label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Recents */}
                    {activeTab === 'recents' && (
                        <div
                            id={`${baseId}-panel-recents`}
                            role="tabpanel"
                            aria-labelledby={`${baseId}-tab-recents`}
                            className="min-h-[280px]"
                            aria-label="Recents"
                        >
                            <ul className="divide-y divide-[#e6e9ef]">
                                {RECENT_ITEMS.map((item) => (
                                    <li key={item.id}>
                                        <div className="flex items-center gap-1 px-5 py-4 transition hover:bg-[#fafbfc] sm:px-6">
                                            {item.routeName ? (
                                                <Link
                                                    href={route(item.routeName)}
                                                    className="group flex min-w-0 flex-1 items-center gap-3 rounded-md py-0.5 pe-2"
                                                >
                                                    {listIcon[item.icon]}
                                                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#323338] group-hover:text-[#0073ea]">
                                                        {item.label}
                                                    </span>
                                                </Link>
                                            ) : (
                                                <a
                                                    href={item.href}
                                                    className="group flex min-w-0 flex-1 items-center gap-3 rounded-md py-0.5 pe-2"
                                                >
                                                    {listIcon[item.icon]}
                                                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#323338] group-hover:text-[#0073ea]">
                                                        {item.label}
                                                    </span>
                                                </a>
                                            )}
                                            <div className="relative shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenMenuFor((prev) =>
                                                            prev === item.id
                                                                ? null
                                                                : item.id,
                                                        );
                                                    }}
                                                    className="inline-flex items-center gap-1 rounded-md border border-[#d0d4df] bg-white px-2 py-1 text-xs font-medium text-[#323338] shadow-sm transition hover:bg-[#f6f7fb]"
                                                    aria-haspopup="menu"
                                                    aria-expanded={
                                                        openMenuFor === item.id
                                                    }
                                                    aria-label={`Open ${item.label} menu`}
                                                >
                                                    Menu
                                                    <EllipsisHorizontalIcon className="h-4 w-4" />
                                                </button>
                                                {openMenuFor === item.id && (
                                                    <div
                                                        role="menu"
                                                        className="absolute right-0 z-20 mt-1 min-w-[170px] overflow-hidden rounded-lg border border-[#e6e9ef] bg-white py-1 shadow-lg"
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                    >
                                                        <button
                                                            type="button"
                                                            className="block w-full px-3 py-2 text-left text-sm text-[#323338] transition hover:bg-[#f6f7fb]"
                                                            onClick={() =>
                                                                setOpenMenuFor(
                                                                    null,
                                                                )
                                                            }
                                                        >
                                                            Open
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="block w-full px-3 py-2 text-left text-sm text-[#323338] transition hover:bg-[#f6f7fb]"
                                                            onClick={() =>
                                                                setOpenMenuFor(
                                                                    null,
                                                                )
                                                            }
                                                        >
                                                            Rename
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="block w-full px-3 py-2 text-left text-sm text-[#c53030] transition hover:bg-[#fff5f5]"
                                                            onClick={() =>
                                                                setOpenMenuFor(
                                                                    null,
                                                                )
                                                            }
                                                        >
                                                            Archive
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {activeTab === 'content' && (
                        <div
                            id={`${baseId}-panel-content`}
                            role="tabpanel"
                            aria-labelledby={`${baseId}-tab-content`}
                            className="flex min-h-[320px] flex-col items-center justify-center px-6 py-14 text-center"
                            aria-label="Content"
                        >
                            <DocumentTextIcon className="mb-4 h-12 w-12 text-[#c5c7d0]" />
                            <p className="text-base font-semibold text-[#323338]">
                                No boards in this tab yet
                            </p>
                            <p className="mt-2 max-w-md text-sm leading-relaxed text-[#676879]">
                                Content for this workspace will show here when you
                                add boards or documents.
                            </p>
                        </div>
                    )}

                    {activeTab === 'permissions' && (
                        <div
                            id={`${baseId}-panel-permissions`}
                            role="tabpanel"
                            aria-labelledby={`${baseId}-tab-permissions`}
                            className="flex min-h-[320px] flex-col items-center justify-center px-6 py-14 text-center"
                            aria-label="Permissions"
                        >
                            <LockClosedIcon className="mb-4 h-12 w-12 text-[#c5c7d0]" />
                            <p className="text-base font-semibold text-[#323338]">
                                Team permissions
                            </p>
                            <p className="mt-2 max-w-md text-sm leading-relaxed text-[#676879]">
                                Fine-grained access for this team can be configured
                                here in a future update.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
