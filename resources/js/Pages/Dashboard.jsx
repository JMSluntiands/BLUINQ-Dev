import FlashNoticeModal from '@/Components/FlashNoticeModal';
import HighPriorityJobsTable from '@/Components/Dashboard/HighPriorityJobsTable';
import DashboardCharts from '@/Components/Dashboard/DashboardCharts';
import ClockInOutPanel from '@/Components/Dashboard/ClockInOutPanel';
import LeaveHolidayCalendar from '@/Components/Dashboard/LeaveHolidayCalendar';
import UserAvatar from '@/Components/UserAvatar';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    CakeIcon,
    CalendarDaysIcon,
    MegaphoneIcon,
    UserMinusIcon,
} from '@heroicons/react/24/outline';
import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

const FLASH_MESSAGES = {
    'leave-request-submitted':
        'Leave request submitted. Waiting for admin approval.',
    'calendar-event-created': 'Calendar event added successfully.',
    'calendar-event-deleted': 'Calendar event removed.',
};

const ANNOUNCEMENT_PREVIEW_LENGTH = 140;

function DashboardPanel({ title, icon: Icon, children, className = '' }) {
    return (
        <div
            className={
                'flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700/70 dark:bg-slate-900/90 ' +
                className
            }
        >
            <div className="flex shrink-0 items-center gap-2.5 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                {Icon && (
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400">
                        <Icon className="h-4 w-4" aria-hidden />
                    </span>
                )}
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    {title}
                </h3>
            </div>
            <div className="min-h-0 flex-1 p-5">{children}</div>
        </div>
    );
}

function SectionLabel({ color, children }) {
    const colors = {
        amber: 'bg-amber-500 dark:bg-amber-400',
        emerald: 'bg-emerald-500 dark:bg-emerald-400',
        rose: 'bg-rose-500 dark:bg-rose-400',
        violet: 'bg-violet-500 dark:bg-violet-400',
        pink: 'bg-pink-500 dark:bg-pink-400',
    };

    const textColors = {
        amber: 'text-amber-700 dark:text-amber-400',
        emerald: 'text-emerald-700 dark:text-emerald-400',
        rose: 'text-rose-700 dark:text-rose-400',
        violet: 'text-violet-700 dark:text-violet-400',
        pink: 'text-pink-700 dark:text-pink-400',
    };

    return (
        <div className="mb-3 flex items-center gap-2">
            <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${colors[color]}`}
            />
            <p
                className={`text-[11px] font-semibold uppercase tracking-wider ${textColors[color]}`}
            >
                {children}
            </p>
        </div>
    );
}

function stripHtml(html) {
    if (!html) {
        return '';
    }

    if (typeof document !== 'undefined') {
        return new DOMParser().parseFromString(html, 'text/html').body
            .textContent;
    }

    return html.replace(/<[^>]*>/g, ' ');
}

function AnnouncementCover({ imageUrl }) {
    const [imageFailed, setImageFailed] = useState(false);
    const showImage = Boolean(imageUrl) && !imageFailed;

    return (
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-sky-500 via-sky-600 to-blue-700 dark:from-sky-600 dark:via-sky-700 dark:to-slate-800">
            {showImage ? (
                <img
                    src={imageUrl}
                    alt=""
                    className="h-40 w-full object-cover sm:h-48"
                    onError={() => setImageFailed(true)}
                />
            ) : (
                <>
                    <div
                        className="absolute inset-0 opacity-30"
                        style={{
                            backgroundImage:
                                'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
                            backgroundSize: '24px 24px',
                        }}
                    />
                    <div className="relative flex h-28 items-center justify-center sm:h-32">
                        <MegaphoneIcon
                            className="h-12 w-12 text-white/40"
                            aria-hidden
                        />
                    </div>
                </>
            )}
            <div className="relative border-t border-white/10 bg-black/20 px-4 py-2">
                <span className="text-xs font-medium text-white/90">
                    Latest announcement
                </span>
            </div>
        </div>
    );
}

function AnnouncementExcerpt({ description }) {
    const [expanded, setExpanded] = useState(false);
    const plainText = stripHtml(description).replace(/\s+/g, ' ').trim();
    const isLong = plainText.length > ANNOUNCEMENT_PREVIEW_LENGTH;
    const previewText = isLong
        ? `${plainText.slice(0, ANNOUNCEMENT_PREVIEW_LENGTH).trimEnd()}…`
        : plainText;

    return (
        <div>
            {expanded ? (
                <div
                    className="rich-text-content mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300 [&_a]:text-sky-600 [&_a]:underline dark:[&_a]:text-sky-400 [&_blockquote]:border-l-2 [&_blockquote]:border-slate-300 [&_blockquote]:pl-3 [&_blockquote]:text-slate-500 dark:[&_blockquote]:border-slate-600 dark:[&_blockquote]:text-slate-400 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5"
                    dangerouslySetInnerHTML={{ __html: description }}
                />
            ) : (
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {previewText}
                </p>
            )}
            {isLong && (
                <button
                    type="button"
                    onClick={() => setExpanded((current) => !current)}
                    className="mt-2 text-sm font-medium text-sky-600 transition hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
                >
                    {expanded ? 'See less' : 'See more'}
                </button>
            )}
        </div>
    );
}

function AttendanceEmployeeRow({ employee, status, detail }) {
    const isLeave = status === 'leave';
    const isPresent = status === 'present';
    const hasDepartment = Boolean(employee.department);
    const detailParts = [
        hasDepartment ? employee.department : null,
        detail,
        !isLeave && employee.email ? employee.email : null,
    ].filter(Boolean);
    const subtitle = detailParts.join(' · ');
    const rowBg = isLeave
        ? 'bg-amber-50/90 dark:bg-amber-500/10'
        : isPresent
          ? 'bg-emerald-50/90 dark:bg-emerald-500/10'
          : 'bg-rose-50/90 dark:bg-rose-500/10';
    const badgeClass = isLeave
        ? 'bg-amber-200 text-amber-900 dark:bg-amber-500/30 dark:text-amber-100'
        : isPresent
          ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-500/30 dark:text-emerald-100'
          : 'bg-rose-200 text-rose-900 dark:bg-rose-500/35 dark:text-rose-100';
    const badgeLabel = isLeave ? 'Leave' : isPresent ? 'Present' : 'Absent';

    return (
        <li
            className={
                'flex items-center gap-3 rounded-xl px-3 py-2.5 ' + rowBg
            }
        >
            <UserAvatar
                user={employee}
                className="h-9 w-9 text-xs"
                ringClassName="ring-2 ring-white dark:ring-slate-700"
            />
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {employee.name}
                </p>
                {subtitle && (
                    <p className="truncate text-xs text-slate-600 dark:text-slate-300">
                        {subtitle}
                    </p>
                )}
            </div>
            <span
                className={
                    'shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ' +
                    badgeClass
                }
            >
                {badgeLabel}
            </span>
        </li>
    );
}

function HolidayRow({ holiday }) {
    const subtitle = [holiday.country_label, holiday.date].filter(Boolean).join(' · ');

    return (
        <li className="flex items-center gap-3 rounded-xl bg-slate-50/90 px-3 py-2.5 dark:bg-slate-800/60">
            <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                <span className="text-[9px] font-bold uppercase leading-none">
                    {holiday.month}
                </span>
                <span className="text-sm font-bold leading-none">
                    {holiday.day}
                </span>
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                    {holiday.name}
                </p>
                {subtitle && (
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {subtitle}
                    </p>
                )}
            </div>
        </li>
    );
}

function BirthdayRow({ employee }) {
    const subtitle = [employee.department, employee.date].filter(Boolean).join(' · ');

    return (
        <li className="flex items-center gap-3 rounded-xl bg-slate-50/90 px-3 py-2.5 dark:bg-slate-800/60">
            <UserAvatar
                user={employee}
                className="h-9 w-9 text-xs"
                ringClassName="ring-2 ring-white dark:ring-slate-700"
            />
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                    {employee.name}
                </p>
                {subtitle && (
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {subtitle}
                    </p>
                )}
            </div>
            <CakeIcon
                className="h-4 w-4 shrink-0 text-pink-500 dark:text-pink-400"
                aria-hidden
            />
        </li>
    );
}

export default function Dashboard() {
    const {
        auth,
        attendance = {},
        clock = {},
        boardPreviewJobs = [],
        announcements = [],
        canViewAnnouncements = false,
        canManageAnnouncements = false,
        canApplyLeave = false,
        leaveCalendar = [],
        holidays = {},
        calendarEvents = {},
        upcomingHolidays = [],
        upcomingBirthdays = [],
        onLeaveToday = [],
        calendarMonth,
        jobStatusChart = null,
        drafterLeaderboard = null,
    } = usePage().props;
    const absentEmployees = attendance.absent ?? [];
    const absentAfterNine = Boolean(attendance.absent_after_nine);
    const latestAnnouncement = announcements[0] ?? null;

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-slate-800 dark:text-slate-100">
                    Welcome, {auth.user?.name ?? 'User'}
                </h2>
            }
        >
            <Head title="Dashboard" />
            <FlashNoticeModal messages={FLASH_MESSAGES} />

            <ClockInOutPanel clock={clock} />

            <div className="mt-8 grid grid-cols-1 items-stretch gap-5 lg:grid-cols-12 lg:gap-6">
                {canViewAnnouncements && (
                <DashboardPanel
                    title="Announcement"
                    icon={MegaphoneIcon}
                    className="lg:col-span-6"
                >
                    {announcements.length === 0 ? (
                        <div className="text-center">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                No announcements yet.
                            </p>
                            {canManageAnnouncements && (
                                <Link
                                    href={route('announcements.create')}
                                    className="mt-3 inline-block text-sm font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
                                >
                                    Post an announcement
                                </Link>
                            )}
                        </div>
                    ) : (
                    <article className="min-w-0">
                        <AnnouncementCover
                            imageUrl={latestAnnouncement.image_url}
                        />

                        <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                            Latest update
                        </p>
                        <h4 className="mt-1 text-lg font-semibold leading-snug text-slate-900 dark:text-white sm:text-xl">
                            {latestAnnouncement.title}
                        </h4>
                        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                            {latestAnnouncement.date} ·{' '}
                            {latestAnnouncement.time} ·{' '}
                            {latestAnnouncement.author}
                        </p>
                        <AnnouncementExcerpt
                            key={latestAnnouncement.id}
                            description={latestAnnouncement.description}
                        />
                    </article>
                    )}
                </DashboardPanel>
                )}

                <DashboardPanel
                    title="Attendance"
                    icon={UserMinusIcon}
                    className="lg:col-span-3"
                >
                    <div className="space-y-5">
                        <div>
                            <SectionLabel color="amber">On leave</SectionLabel>
                            <ul className="space-y-2">
                                {onLeaveToday.length === 0 ? (
                                    <li className="rounded-xl bg-slate-50/90 px-3 py-2.5 text-sm text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                                        No one on leave today.
                                    </li>
                                ) : (
                                    onLeaveToday.map((employee) => (
                                        <AttendanceEmployeeRow
                                            key={employee.id}
                                            employee={employee}
                                            status="leave"
                                            detail={`Until ${employee.until}`}
                                        />
                                    ))
                                )}
                            </ul>
                        </div>

                        <div>
                            <SectionLabel color="rose">Absent</SectionLabel>
                            {!absentAfterNine && (
                                <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                                    Absent list updates at 9:00 AM for staff
                                    who have not clocked in.
                                </p>
                            )}
                            <ul className="space-y-2">
                                {absentEmployees.length === 0 ? (
                                    <li className="rounded-xl bg-slate-50/90 px-3 py-2.5 text-sm text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                                        {absentAfterNine
                                            ? 'Everyone has clocked in.'
                                            : 'No absences listed yet.'}
                                    </li>
                                ) : (
                                    absentEmployees.map((employee) => (
                                        <AttendanceEmployeeRow
                                            key={employee.id}
                                            employee={employee}
                                            status="absent"
                                            detail="Not clocked in"
                                        />
                                    ))
                                )}
                            </ul>
                        </div>
                    </div>
                </DashboardPanel>

                <DashboardPanel
                    title="Holidays & Birthday"
                    icon={CalendarDaysIcon}
                    className="lg:col-span-3"
                >
                    <div className="space-y-5">
                        <div>
                            <SectionLabel color="violet">
                                Upcoming holidays
                            </SectionLabel>
                            <ul className="space-y-2">
                                {upcomingHolidays.length === 0 ? (
                                    <li className="rounded-xl bg-slate-50/90 px-3 py-2.5 text-sm text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                                        No upcoming holidays.
                                    </li>
                                ) : (
                                    upcomingHolidays.map((holiday) => (
                                        <HolidayRow
                                            key={holiday.id}
                                            holiday={holiday}
                                        />
                                    ))
                                )}
                            </ul>
                        </div>

                        <div>
                            <SectionLabel color="pink">Birthdays</SectionLabel>
                            <ul className="space-y-2">
                                {upcomingBirthdays.length === 0 ? (
                                    <li className="rounded-xl bg-slate-50/90 px-3 py-2.5 text-sm text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                                        No upcoming birthdays.
                                    </li>
                                ) : (
                                    upcomingBirthdays.map((employee) => (
                                        <BirthdayRow
                                            key={employee.id}
                                            employee={employee}
                                        />
                                    ))
                                )}
                            </ul>
                        </div>
                    </div>
                </DashboardPanel>
            </div>

            <LeaveHolidayCalendar
                key={`calendar-${calendarMonth}`}
                users={leaveCalendar}
                holidays={holidays}
                calendarEvents={calendarEvents}
                canApplyLeave={canApplyLeave}
                canAddCalendarEvent
                currentUserId={auth.user?.id ?? null}
                canDeleteAnyEvent={auth.user?.role === 'admin'}
                calendarMonth={calendarMonth}
            />

            <HighPriorityJobsTable boardPreviewJobs={boardPreviewJobs} />

            <DashboardCharts
                jobStatusChart={jobStatusChart}
                drafterLeaderboard={drafterLeaderboard}
                calendarMonth={calendarMonth}
            />
        </AuthenticatedLayout>
    );
}
