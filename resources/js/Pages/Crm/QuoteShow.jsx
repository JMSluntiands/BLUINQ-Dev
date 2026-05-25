import DangerButton from '@/Components/DangerButton';
import DraftingStatusBadge from '@/Components/DraftingStatusBadge';
import FlashNoticeModal from '@/Components/FlashNoticeModal';
import InputError from '@/Components/InputError';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import RichTextEditor from '@/Components/RichTextEditor';
import SecondaryButton from '@/Components/SecondaryButton';
import UserAvatar from '@/Components/UserAvatar';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    ArchiveBoxArrowDownIcon,
    ArrowUturnLeftIcon,
    ChatBubbleLeftRightIcon,
    ChevronRightIcon,
    ClockIcon,
} from '@heroicons/react/24/outline';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useCallback, useState } from 'react';

function listQueryString(listFilters = {}) {
    const p = new URLSearchParams();
    if (listFilters.search) {
        p.set('search', listFilters.search);
    }
    if (listFilters.per_page) {
        p.set('per_page', String(listFilters.per_page));
    }
    if (listFilters.from === 'archive') {
        p.set('from', 'archive');
    }
    const s = p.toString();
    return s ? `?${s}` : '';
}

const FLASH_MESSAGES = {
    'crm-quote-archived': 'Quote moved to archive.',
    'crm-quote-restored': 'Quote restored to the list.',
};

const cardClass =
    'overflow-hidden rounded-xl border border-[#e6e9ef] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)]';

function DetailRow({ label, value, className = '' }) {
    const display =
        value === null || value === undefined || value === '' ? '—' : value;

    return (
        <div className={`min-w-0 ${className}`}>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#676879]">
                {label}
            </dt>
            <dd className="mt-1 text-sm text-[#323338]">{display}</dd>
        </div>
    );
}

function DetailCard({ title, children }) {
    return (
        <div className={cardClass}>
            <div className="flex items-center justify-between border-b border-[#e6e9ef] bg-[#fafbfc] px-4 py-3 sm:px-5">
                <h3 className="text-sm font-semibold text-[#323338]">
                    {title}
                </h3>
            </div>
            <div className="px-4 py-4 sm:px-5">{children}</div>
        </div>
    );
}

function SectionHeading({ children }) {
    return (
        <h2 className="mb-3 text-base font-semibold text-[#323338]">
            {children}
        </h2>
    );
}

function Breadcrumbs({ items }) {
    return (
        <nav
            className="mb-4 flex flex-wrap items-center gap-1 text-sm text-[#676879]"
            aria-label="Breadcrumb"
        >
            {items.map((item, index) => (
                <span
                    key={item.label}
                    className="inline-flex items-center gap-1"
                >
                    {index > 0 ? (
                        <ChevronRightIcon
                            className="h-3.5 w-3.5 shrink-0 text-[#c5c7d0]"
                            aria-hidden
                        />
                    ) : null}
                    {item.href ? (
                        <Link
                            href={item.href}
                            className="font-medium text-[#0073ea] hover:underline"
                        >
                            {item.label}
                        </Link>
                    ) : (
                        <span className="font-medium text-[#323338]">
                            {item.label}
                        </span>
                    )}
                </span>
            ))}
        </nav>
    );
}

export default function QuoteShow({
    quote,
    listFilters = {},
    canEdit = false,
    canUseRunComments = false,
}) {
    const listQs = listQueryString(listFilters);
    const fromArchive = listFilters.from === 'archive';
    const backHref =
        (fromArchive
            ? route('crm.quotes.archive')
            : route('crm.quotes')) + listQs;

    const [archiveOpen, setArchiveOpen] = useState(false);
    const [restoreOpen, setRestoreOpen] = useState(false);

    const confirmArchive = useCallback(() => {
        router.delete(
            route('crm.quotes.destroy', quote.id) + listQs,
        );
        setArchiveOpen(false);
    }, [quote.id, listQs]);

    const confirmRestore = useCallback(() => {
        router.post(
            route('crm.quotes.restore', quote.id) + listQs,
            {},
        );
        setRestoreOpen(false);
    }, [quote.id, listQs]);

    const breadcrumbItems = [
        { label: 'Home', href: route('dashboard') },
        {
            label: fromArchive ? 'Quote archive' : 'Quote list',
            href: backHref,
        },
        { label: quote.reference },
    ];

    return (
        <AuthenticatedLayout>
            <Head title={`${quote.reference} — Quote details`} />

            <div className="mx-auto max-w-[1400px] space-y-6 pb-10">
                <Breadcrumbs items={breadcrumbItems} />

                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <h1 className="text-2xl font-semibold text-[#323338]">
                            Quote details
                        </h1>
                        <p className="mt-1 text-sm text-[#676879]">
                            {quote.reference}
                            {quote.is_archived ? ' · Archived' : ''}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {!quote.is_archived ? (
                            <button
                                type="button"
                                onClick={() => setArchiveOpen(true)}
                                className="inline-flex items-center gap-2 rounded-lg border border-[#c5c7d0] bg-white px-4 py-2 text-sm font-semibold text-[#323338] shadow-sm transition hover:border-[#e44258] hover:text-[#e44258]"
                            >
                                <ArchiveBoxArrowDownIcon
                                    className="h-4 w-4"
                                    aria-hidden
                                />
                                Archive this quote
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setRestoreOpen(true)}
                                className="inline-flex items-center gap-2 rounded-lg bg-[#0073ea] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0060c4]"
                            >
                                <ArrowUturnLeftIcon
                                    className="h-4 w-4"
                                    aria-hidden
                                />
                                Restore
                            </button>
                        )}
                        <Link
                            href={backHref}
                            className="inline-flex items-center rounded-lg border border-[#c5c7d0] bg-white px-4 py-2 text-sm font-semibold text-[#323338] shadow-sm transition hover:bg-[#f6f7fb]"
                        >
                            Back to list
                        </Link>
                    </div>
                </div>

                <FlashNoticeModal messages={FLASH_MESSAGES} />

                {/* Archive / Restore modals */}
                <Modal
                    show={archiveOpen}
                    onClose={() => setArchiveOpen(false)}
                    maxWidth="md"
                >
                    <div className="p-6">
                        <h2 className="text-lg font-semibold text-[#323338]">
                            Archive this quote?
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed text-[#676879]">
                            <span className="font-medium text-[#323338]">
                                {quote.reference}
                            </span>{' '}
                            will move to the archive and can be restored later.
                        </p>
                        <div className="mt-6 flex flex-wrap justify-end gap-2">
                            <SecondaryButton
                                type="button"
                                onClick={() => setArchiveOpen(false)}
                                className="rounded-lg normal-case tracking-normal"
                            >
                                Cancel
                            </SecondaryButton>
                            <DangerButton
                                type="button"
                                onClick={confirmArchive}
                                className="rounded-lg normal-case tracking-normal"
                            >
                                Archive
                            </DangerButton>
                        </div>
                    </div>
                </Modal>

                <Modal
                    show={restoreOpen}
                    onClose={() => setRestoreOpen(false)}
                    maxWidth="md"
                >
                    <div className="p-6">
                        <h2 className="text-lg font-semibold text-[#323338]">
                            Restore quote?
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed text-[#676879]">
                            <span className="font-medium text-[#323338]">
                                {quote.reference}
                            </span>{' '}
                            will return to the quote list.
                        </p>
                        <div className="mt-6 flex flex-wrap justify-end gap-2">
                            <SecondaryButton
                                type="button"
                                onClick={() => setRestoreOpen(false)}
                                className="rounded-lg normal-case tracking-normal"
                            >
                                Cancel
                            </SecondaryButton>
                            <button
                                type="button"
                                onClick={confirmRestore}
                                className="inline-flex items-center rounded-lg bg-[#0073ea] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0060c4] focus:outline-none focus:ring-2 focus:ring-[#0073ea] focus:ring-offset-1"
                            >
                                Restore
                            </button>
                        </div>
                    </div>
                </Modal>

                {quote.is_archived ? (
                    <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        This quote is archived
                        {quote.archived_at
                            ? ` on ${quote.archived_at}`
                            : ''}
                        . Restore it to return it to the active list.
                    </p>
                ) : null}

                {/* Details cards */}
                <section>
                    <SectionHeading>Details</SectionHeading>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        <DetailCard title="Client details">
                            <dl className="space-y-4">
                                <DetailRow
                                    label="Date"
                                    value={quote.requested_at}
                                />
                                <DetailRow
                                    label="Reference no."
                                    value={quote.reference}
                                />
                                <DetailRow
                                    label="Client / Company"
                                    value={quote.client_company_name}
                                />
                                <DetailRow
                                    label="Project / Job No."
                                    value={quote.project_job_number}
                                />
                            </dl>
                        </DetailCard>

                        <DetailCard title="Site information">
                            <dl className="space-y-4">
                                <DetailRow
                                    label="Site address"
                                    value={quote.site_address}
                                />
                                <DetailRow
                                    label="Site owner"
                                    value={quote.site_owner_name}
                                />
                            </dl>
                        </DetailCard>

                        <DetailCard title="Assignment">
                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#676879]">
                                        Status
                                    </dt>
                                    <dd className="mt-1.5">
                                        <DraftingStatusBadge
                                            status={quote.status}
                                            label={quote.status_label}
                                        />
                                    </dd>
                                </div>
                                <DetailRow
                                    label="Submitted by"
                                    value={quote.submitted_by}
                                />
                                <DetailRow
                                    label="Submitted at"
                                    value={quote.submitted_at}
                                />
                            </dl>
                        </DetailCard>
                    </div>
                </section>

                <section>
                    <SectionHeading>Specifications</SectionHeading>
                    <DetailCard title="Quote specifications">
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <DetailRow
                                label="Arrival input files"
                                value={quote.arrival_input_file}
                            />
                            <DetailRow
                                label="Category"
                                value={quote.crm_category}
                            />
                            <DetailRow
                                label="Level of difficulty"
                                value={quote.level_of_difficulty}
                            />
                            <DetailRow
                                label="Building type"
                                value={quote.building_type}
                            />
                            <DetailRow
                                label="Scope of work"
                                value={quote.scope_of_work}
                            />
                            <DetailRow
                                label="Deliverables"
                                value={quote.deliverable}
                            />
                            <DetailRow
                                label="Estimated time allocation"
                                value={quote.estimated_time_allocation}
                            />
                        </dl>
                    </DetailCard>
                </section>

                <section>
                    <SectionHeading>Building area & notes</SectionHeading>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <DetailCard title="Building area size">
                            <div className="min-h-[6rem] rounded-lg border border-[#e6e9ef] bg-[#fafbfc] px-4 py-3">
                                {quote.building_area_size ? (
                                    <p className="whitespace-pre-wrap text-sm text-[#323338]">
                                        {quote.building_area_size}
                                    </p>
                                ) : (
                                    <p className="text-sm text-[#676879]">
                                        No building area information.
                                    </p>
                                )}
                            </div>
                        </DetailCard>

                        <DetailCard title="Remarks / Other notes">
                            <div className="min-h-[6rem] rounded-lg border border-[#e6e9ef] bg-[#fafbfc] px-4 py-3">
                                {quote.remarks ? (
                                    <p className="whitespace-pre-wrap text-sm text-[#323338]">
                                        {quote.remarks}
                                    </p>
                                ) : (
                                    <p className="text-sm text-[#676879]">
                                        No remarks recorded.
                                    </p>
                                )}
                            </div>
                        </DetailCard>
                    </div>
                </section>

                <section>
                    <SectionHeading>Discussion</SectionHeading>
                    <div
                        className={
                            canUseRunComments
                                ? 'grid grid-cols-1 gap-4 lg:grid-cols-2'
                                : 'grid grid-cols-1 gap-4'
                        }
                    >
                        <DiscussionPanel
                            title="Comments"
                            comments={quote.comments ?? []}
                            commentKind="comment"
                            quoteId={quote.id}
                            listFilters={listFilters}
                            readOnly={quote.is_archived}
                            emptyLabel="No comments yet."
                            successFlash="comment-added"
                            successMessage="Comment added."
                        />
                        {canUseRunComments ? (
                            <DiscussionPanel
                                title="Run comments"
                                comments={quote.run_comments ?? []}
                                commentKind="run"
                                quoteId={quote.id}
                                listFilters={listFilters}
                                readOnly={quote.is_archived}
                                emptyLabel="No run comments yet."
                                successFlash="run-comment-added"
                                successMessage="Run comment added."
                                hint="Internal notes. Not visible to regular users."
                            />
                        ) : null}
                    </div>
                </section>

                <section>
                    <ActivityLogsSection activities={quote.activities ?? []} />
                </section>
            </div>
        </AuthenticatedLayout>
    );
}

function DiscussionPanel({
    title,
    comments = [],
    commentKind,
    quoteId,
    listFilters,
    readOnly = false,
    emptyLabel,
    successFlash,
    successMessage,
    hint = null,
}) {
    const { flash } = usePage().props;
    const listQs = listQueryString(listFilters);
    const editorId = `crm-comment-${commentKind}`;

    const form = useForm({
        kind: commentKind,
        body: '',
    });
    const [editorKey, setEditorKey] = useState(0);

    const submit = (e) => {
        if (readOnly) {
            return;
        }
        e.preventDefault();
        form.post(
            route('crm.quotes.comments.store', quoteId) + listQs,
            {
                preserveScroll: true,
                preserveState: false,
                onSuccess: () => {
                    form.reset('body');
                    form.setData('kind', commentKind);
                    setEditorKey((key) => key + 1);
                    router.reload({
                        only: ['quote'],
                        preserveScroll: true,
                    });
                },
            },
        );
    };

    return (
        <div className={cardClass}>
            <div className="border-b border-[#e6e9ef] bg-[#fafbfc] px-4 py-3 sm:px-5">
                <h3 className="text-sm font-semibold text-[#323338]">
                    {title}
                </h3>
                {hint ? (
                    <p className="mt-0.5 text-xs text-[#676879]">{hint}</p>
                ) : null}
            </div>

            {flash?.status === successFlash ? (
                <p className="border-b border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800 sm:px-5">
                    {successMessage}
                </p>
            ) : null}

            {comments.length === 0 ? (
                <p className="flex items-center gap-2 border-b border-[#e6e9ef] px-4 py-5 text-sm text-[#676879] sm:px-5">
                    <ChatBubbleLeftRightIcon
                        className="h-5 w-5 shrink-0"
                        aria-hidden
                    />
                    {emptyLabel}
                </p>
            ) : (
                <ul className="max-h-64 divide-y divide-[#e6e9ef] overflow-y-auto border-b border-[#e6e9ef]">
                    {comments.map((comment) => (
                        <li key={comment.id} className="px-4 py-4 sm:px-5">
                            <article className="flex gap-3">
                                <UserAvatar
                                    user={{
                                        name: comment.author_name,
                                        profile_image_url:
                                            comment.author_profile_image_url,
                                    }}
                                    className="h-9 w-9 text-xs"
                                    ringClassName="ring-2 ring-[#e6e9ef]"
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                                        <p className="text-sm font-semibold text-[#323338]">
                                            {comment.author_name}
                                            {comment.is_mine ? (
                                                <span className="ml-2 text-xs font-medium text-[#676879]">
                                                    (you)
                                                </span>
                                            ) : null}
                                        </p>
                                        <time className="text-xs text-[#676879]">
                                            {comment.created_at}
                                        </time>
                                    </div>
                                    <CommentBody html={comment.body} />
                                </div>
                            </article>
                        </li>
                    ))}
                </ul>
            )}

            {readOnly ? (
                <p className="px-4 py-4 text-sm text-[#676879] sm:px-5">
                    {commentKind === 'run'
                        ? 'Run comments are disabled while this quote is archived.'
                        : 'Comments are disabled while this quote is archived.'}
                </p>
            ) : (
                <form onSubmit={submit} className="space-y-3 p-4 sm:p-5">
                    <input type="hidden" name="kind" value={commentKind} />
                    <RichTextEditor
                        key={editorKey}
                        id={editorId}
                        value={form.data.body}
                        onChange={(html) => form.setData('body', html)}
                        disabled={form.processing}
                        placeholder={
                            commentKind === 'run'
                                ? 'Write a run comment…'
                                : 'Write a comment…'
                        }
                    />
                    <InputError message={form.errors.body} />
                    <InputError message={form.errors.kind} />
                    <div className="flex justify-end">
                        <PrimaryButton
                            type="submit"
                            loading={form.processing}
                            disabled={form.processing}
                            className="!bg-[#0073ea] hover:!bg-[#0060c4] focus:!ring-[#0073ea]"
                        >
                            Send
                        </PrimaryButton>
                    </div>
                </form>
            )}
        </div>
    );
}

function ActivityLogsSection({ activities = [] }) {
    return (
        <div className={cardClass}>
            <div className="border-b border-[#e6e9ef] bg-[#fafbfc] px-4 py-3 sm:px-5">
                <h2 className="text-base font-semibold text-[#323338]">
                    Activity log
                </h2>
                <p className="mt-0.5 text-xs text-[#676879]">
                    Comments, archives, and other updates
                </p>
            </div>

            {activities.length === 0 ? (
                <p className="flex items-center gap-2 px-4 py-8 text-sm text-[#676879] sm:px-5">
                    <ClockIcon className="h-5 w-5 shrink-0" aria-hidden />
                    No activity recorded yet.
                </p>
            ) : (
                <ul className="space-y-0 px-4 py-5 sm:px-5">
                    {activities.map((activity, index) => (
                        <li
                            key={activity.id}
                            className="relative flex gap-4 pb-8 last:pb-0"
                        >
                            {index < activities.length - 1 ? (
                                <span
                                    className="absolute left-[11px] top-6 h-[calc(100%-0.5rem)] w-px bg-[#e6e9ef]"
                                    aria-hidden
                                />
                            ) : null}
                            <span
                                className="relative z-10 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0073ea] ring-4 ring-white"
                                aria-hidden
                            >
                                <span className="h-2 w-2 rounded-full bg-white" />
                            </span>
                            <div className="min-w-0 flex-1 pt-0.5">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div>
                                        <p className="text-sm font-semibold text-[#323338]">
                                            {activity.action_label}
                                            {activity.is_mine ? (
                                                <span className="ml-2 text-xs font-medium text-[#676879]">
                                                    (you)
                                                </span>
                                            ) : null}
                                        </p>
                                        <p className="text-xs text-[#676879]">
                                            {activity.user_name}
                                        </p>
                                    </div>
                                    <time className="shrink-0 text-xs text-[#676879]">
                                        {activity.created_at}
                                    </time>
                                </div>
                                {activity.description ? (
                                    <p className="mt-2 rounded-lg bg-[#fafbfc] px-3 py-2 text-sm text-[#323338] ring-1 ring-[#e6e9ef]">
                                        {activity.description}
                                    </p>
                                ) : null}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function CommentBody({ html }) {
    return (
        <div
            className="rich-text-content text-sm text-[#323338] [&_a]:text-[#0073ea] [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-[#c5c7d0] [&_blockquote]:pl-3 [&_blockquote]:text-[#676879] [&_h2]:text-base [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}
