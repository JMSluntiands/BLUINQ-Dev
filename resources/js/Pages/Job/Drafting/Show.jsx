import DangerButton from '@/Components/DangerButton';
import DraftingEditModals from '@/Components/DraftingEditModals';
import DraftingFilesEditModal from '@/Components/DraftingFilesEditModal';
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
    ArrowDownTrayIcon,
    ArrowUturnLeftIcon,
    ChatBubbleLeftRightIcon,
    ChevronRightIcon,
    ClockIcon,
    DocumentTextIcon,
    EyeIcon,
    PencilSquareIcon,
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
    'drf-archived': 'Drafting request moved to archive.',
    'drf-restored': 'Drafting request restored to the list.',
    'drf-updated': 'Details saved.',
    'drf-files-updated': 'Files updated.',
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

function DetailCard({ title, children, canEdit = false, onEdit }) {
    return (
        <div className={cardClass}>
            <div className="flex items-center justify-between border-b border-[#e6e9ef] bg-[#fafbfc] px-4 py-3 sm:px-5">
                <h3 className="text-sm font-semibold text-[#323338]">{title}</h3>
                {canEdit ? (
                    <button
                        type="button"
                        onClick={onEdit}
                        className="inline-flex items-center gap-1 rounded-md border border-[#c5c7d0] bg-white px-2.5 py-1 text-xs font-semibold text-[#0073ea] shadow-sm transition hover:bg-[#e6f4ff]"
                    >
                        <PencilSquareIcon className="h-3.5 w-3.5" aria-hidden />
                        Edit
                    </button>
                ) : null}
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
                <span key={item.label} className="inline-flex items-center gap-1">
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

export default function DraftingShow({
    draftingRequest,
    listFilters = {},
    canEdit = false,
    canEditStatus = false,
    canUseRunComments = false,
    statusOptions = [],
    formOptions = {},
}) {
    const listQs = listQueryString(listFilters);
    const fromArchive = listFilters.from === 'archive';
    const backHref =
        (fromArchive ? route('job.drafting.archive') : route('job.drafting')) +
        listQs;
    const updateUrl =
        route('job.drafting.update', draftingRequest.id) + listQs;
    const [archiveOpen, setArchiveOpen] = useState(false);
    const [restoreOpen, setRestoreOpen] = useState(false);
    const [editSection, setEditSection] = useState(null);
    const [filesEditPanel, setFilesEditPanel] = useState(null);

    const confirmArchive = useCallback(() => {
        router.delete(
            route('job.drafting.destroy', draftingRequest.id) + listQs,
        );
        setArchiveOpen(false);
    }, [draftingRequest.id, listQs]);

    const confirmRestore = useCallback(() => {
        router.post(
            route('job.drafting.restore', draftingRequest.id) + listQs,
            {},
        );
        setRestoreOpen(false);
    }, [draftingRequest.id, listQs]);

    const facadeFiles = draftingRequest.files.filter((f) => f.kind === 'facade');
    const documentFiles = draftingRequest.files.filter(
        (f) => f.kind === 'document',
    );
    const teamFiles = draftingRequest.files.filter((f) => f.kind === 'team');

    const notesText = [
        draftingRequest.design_requirements,
        draftingRequest.additional_inclusions,
    ]
        .filter(Boolean)
        .join('\n\n');

    const breadcrumbItems = [
        { label: 'Home', href: route('dashboard') },
        {
            label: fromArchive ? 'Drafting archive' : 'Drafting list',
            href: backHref,
        },
        { label: draftingRequest.reference },
    ];

    return (
        <AuthenticatedLayout>
            <Head title={`${draftingRequest.reference} — Job details`} />

            <div className="mx-auto max-w-[1400px] space-y-6 pb-10">
                <Breadcrumbs items={breadcrumbItems} />

                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <h1 className="text-2xl font-semibold text-[#323338]">
                            Job details
                        </h1>
                        <p className="mt-1 text-sm text-[#676879]">
                            {draftingRequest.reference}
                            {draftingRequest.is_archived ? ' · Archived' : ''}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {!draftingRequest.is_archived ? (
                            <button
                                type="button"
                                onClick={() => setArchiveOpen(true)}
                                className="inline-flex items-center gap-2 rounded-lg border border-[#c5c7d0] bg-white px-4 py-2 text-sm font-semibold text-[#323338] shadow-sm transition hover:border-[#e44258] hover:text-[#e44258]"
                            >
                                <ArchiveBoxArrowDownIcon
                                    className="h-4 w-4"
                                    aria-hidden
                                />
                                Archive this job
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

                <ArchiveModals
                    archiveOpen={archiveOpen}
                    restoreOpen={restoreOpen}
                    reference={draftingRequest.reference}
                    onCloseArchive={() => setArchiveOpen(false)}
                    onCloseRestore={() => setRestoreOpen(false)}
                    onConfirmArchive={confirmArchive}
                    onConfirmRestore={confirmRestore}
                />

                <DraftingEditModals
                    section={editSection}
                    onClose={() => setEditSection(null)}
                    draftingRequest={draftingRequest}
                    formOptions={formOptions}
                    statusOptions={statusOptions}
                    updateUrl={updateUrl}
                />

                <DraftingFilesEditModal
                    panel={filesEditPanel}
                    onClose={() => setFilesEditPanel(null)}
                    draftingRequestId={draftingRequest.id}
                    facadeFiles={facadeFiles}
                    documentFiles={documentFiles}
                    teamFiles={teamFiles}
                    listUrl={listQs}
                />

                {draftingRequest.is_archived ? (
                    <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        This drafting request is archived
                        {draftingRequest.archived_at
                            ? ` on ${draftingRequest.archived_at}`
                            : ''}
                        . Restore it to edit status, add comments, or return it
                        to the active list.
                    </p>
                ) : null}

                <section>
                    <SectionHeading>Details</SectionHeading>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        <DetailCard
                            title="Client details"
                            canEdit={canEdit}
                            onEdit={() => setEditSection('client')}
                        >
                            <dl className="space-y-4">
                                <DetailRow
                                    label="Log date"
                                    value={draftingRequest.requested_at}
                                />
                                <DetailRow
                                    label="Reference no."
                                    value={draftingRequest.reference}
                                />
                                <DetailRow
                                    label="Client"
                                    value={draftingRequest.company_name}
                                />
                                <DetailRow
                                    label="Contact name"
                                    value={draftingRequest.your_name}
                                />
                                <DetailRow
                                    label="Email"
                                    value={draftingRequest.email}
                                />
                            </dl>
                        </DetailCard>

                        <DetailCard
                            title="Job details"
                            canEdit={canEdit}
                            onEdit={() => setEditSection('job')}
                        >
                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#676879]">
                                        JOB STATUS
                                    </dt>
                                    <dd className="mt-1.5">
                                        <DraftingStatusBadge
                                            status={draftingRequest.status}
                                            label={
                                                draftingRequest.status_label
                                            }
                                        />
                                    </dd>
                                </div>
                                <DetailRow
                                    label="Building type"
                                    value={draftingRequest.building_type}
                                />
                                <DetailRow
                                    label="Address"
                                    value={draftingRequest.site_address}
                                />
                                <DetailRow
                                    label="Services"
                                    value={
                                        draftingRequest.service_engagings
                                            ?.length
                                            ? draftingRequest.service_engagings.join(
                                                  ', ',
                                              )
                                            : null
                                    }
                                />
                                <DetailRow
                                    label="NDIS / SDA"
                                    value={
                                        draftingRequest.ndis_sda ? 'Yes' : 'No'
                                    }
                                />
                            </dl>
                        </DetailCard>

                        <DetailCard title="Assignment" canEdit={false}>
                            <dl className="space-y-4">
                                <DetailRow
                                    label="Submitted by"
                                    value={draftingRequest.submitted_by}
                                />
                                <DetailRow
                                    label="Submitted at"
                                    value={draftingRequest.submitted_at}
                                />
                                <DetailRow label="Checker" value={null} />
                            </dl>
                        </DetailCard>
                    </div>

                    <div className="mt-4">
                        <DetailCard
                            title="Building specifications"
                            canEdit={canEdit}
                            onEdit={() => setEditSection('building')}
                        >
                            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <DetailRow
                                    label="Site owner"
                                    value={draftingRequest.site_owner_name}
                                />
                                <DetailRow
                                    label="Max building area (sqm)"
                                    value={
                                        draftingRequest.max_building_area_sqm
                                    }
                                />
                                <DetailRow
                                    label="External wall"
                                    value={
                                        draftingRequest.external_wall_construction
                                    }
                                />
                                <DetailRow
                                    label="Roof type"
                                    value={draftingRequest.roof_type}
                                />
                                <DetailRow
                                    label="Ceiling heights"
                                    value={draftingRequest.ceiling_heights}
                                />
                                <DetailRow
                                    label="First floor slab"
                                    value={draftingRequest.first_floor_slab}
                                />
                            </dl>
                        </DetailCard>
                    </div>
                </section>

                <section>
                    <DetailCard
                        title="Notes"
                        canEdit={canEdit}
                        onEdit={() => setEditSection('notes')}
                    >
                        <div className="min-h-[6rem] rounded-lg border border-[#e6e9ef] bg-[#fafbfc] px-4 py-3">
                            {notesText ? (
                                <p className="whitespace-pre-wrap text-sm text-[#323338]">
                                    {notesText}
                                </p>
                            ) : (
                                <p className="text-sm text-[#676879]">
                                    No notes recorded.
                                </p>
                            )}
                        </div>
                    </DetailCard>
                </section>

                <section>
                    <SectionHeading>Files</SectionHeading>
                    <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
                        <FilePanel
                            title="Facade / plans"
                            files={facadeFiles}
                            emptyLabel="No facade or plan files."
                            canEdit={canEdit}
                            onEdit={() => setFilesEditPanel('facade')}
                        />
                        <FilePanel
                            title="Documents"
                            files={documentFiles}
                            emptyLabel="No documents uploaded."
                            canEdit={canEdit}
                            onEdit={() => setFilesEditPanel('documents')}
                        />
                        <FilePanel
                            title="Team uploads"
                            files={teamFiles}
                            emptyLabel="No team uploads yet."
                            canEdit={canEdit}
                            onEdit={() => setFilesEditPanel('team')}
                        />
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
                            comments={draftingRequest.comments ?? []}
                            commentKind="comment"
                            draftingRequestId={draftingRequest.id}
                            listFilters={listFilters}
                            readOnly={draftingRequest.is_archived}
                            emptyLabel="No comments yet."
                            successFlash="comment-added"
                            successMessage="Comment added."
                        />
                        {canUseRunComments ? (
                            <DiscussionPanel
                                title="Run comments"
                                comments={draftingRequest.run_comments ?? []}
                                commentKind="run"
                                draftingRequestId={draftingRequest.id}
                                listFilters={listFilters}
                                readOnly={draftingRequest.is_archived}
                                emptyLabel="No run comments yet."
                                successFlash="run-comment-added"
                                successMessage="Run comment added."
                                hint="Internal notes for the Archi team. Not visible to applicants."
                            />
                        ) : null}
                    </div>
                </section>

                <section>
                    <ActivityLogsSection />
                </section>
            </div>
        </AuthenticatedLayout>
    );
}

function ArchiveModals({
    archiveOpen,
    restoreOpen,
    reference,
    onCloseArchive,
    onCloseRestore,
    onConfirmArchive,
    onConfirmRestore,
}) {
    return (
        <>
            <Modal show={archiveOpen} onClose={onCloseArchive} maxWidth="md">
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-[#323338]">
                        Archive this job?
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-[#676879]">
                        <span className="font-medium text-[#323338]">
                            {reference}
                        </span>{' '}
                        will move to the archive and can be restored later.
                    </p>
                    <div className="mt-6 flex flex-wrap justify-end gap-2">
                        <SecondaryButton
                            type="button"
                            onClick={onCloseArchive}
                            className="rounded-lg normal-case tracking-normal"
                        >
                            Cancel
                        </SecondaryButton>
                        <DangerButton
                            type="button"
                            onClick={onConfirmArchive}
                            className="rounded-lg normal-case tracking-normal"
                        >
                            Archive
                        </DangerButton>
                    </div>
                </div>
            </Modal>

            <Modal show={restoreOpen} onClose={onCloseRestore} maxWidth="md">
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-[#323338]">
                        Restore drafting request?
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-[#676879]">
                        <span className="font-medium text-[#323338]">
                            {reference}
                        </span>{' '}
                        will return to the main drafting list.
                    </p>
                    <div className="mt-6 flex flex-wrap justify-end gap-2">
                        <SecondaryButton
                            type="button"
                            onClick={onCloseRestore}
                            className="rounded-lg normal-case tracking-normal"
                        >
                            Cancel
                        </SecondaryButton>
                        <button
                            type="button"
                            onClick={onConfirmRestore}
                            className="inline-flex items-center rounded-lg bg-[#0073ea] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0060c4] focus:outline-none focus:ring-2 focus:ring-[#0073ea] focus:ring-offset-1"
                        >
                            Restore
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
}

function FilePanel({ title, files, emptyLabel, canEdit = false, onEdit }) {
    return (
        <div className={cardClass}>
            <div className="flex items-center justify-between border-b border-[#e6e9ef] bg-[#fafbfc] px-4 py-3 sm:px-5">
                <h3 className="text-sm font-semibold text-[#323338]">{title}</h3>
                {canEdit ? (
                    <button
                        type="button"
                        onClick={onEdit}
                        className="inline-flex items-center gap-1 rounded-md border border-[#c5c7d0] bg-white px-2.5 py-1 text-xs font-semibold text-[#0073ea] shadow-sm transition hover:bg-[#e6f4ff]"
                    >
                        <PencilSquareIcon
                            className="h-3.5 w-3.5"
                            aria-hidden
                        />
                        Edit
                    </button>
                ) : null}
            </div>
            <div className="p-4">
                {files.length === 0 ? (
                    <p className="text-sm text-[#676879]">{emptyLabel}</p>
                ) : (
                    <ul className="space-y-2">
                        {files.map((file) => (
                            <li
                                key={file.id}
                                className="flex items-center justify-between gap-2 rounded-lg border border-[#e6e9ef] bg-[#fafbfc] px-3 py-2"
                            >
                                <div className="flex min-w-0 items-center gap-2">
                                    <DocumentTextIcon
                                        className="h-5 w-5 shrink-0 text-[#676879]"
                                        aria-hidden
                                    />
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-[#323338]">
                                            {file.original_name}
                                        </p>
                                        <p className="text-xs text-[#676879]">
                                            {file.size_label}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex shrink-0 gap-1">
                                    <a
                                        href={file.download_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#676879] transition hover:bg-[#e6e9ef] hover:text-[#0073ea]"
                                        title="View"
                                        aria-label={`View ${file.original_name}`}
                                    >
                                        <EyeIcon className="h-4 w-4" />
                                    </a>
                                    <a
                                        href={file.download_url}
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#676879] transition hover:bg-[#e6e9ef] hover:text-[#0073ea]"
                                        title="Download"
                                        aria-label={`Download ${file.original_name}`}
                                    >
                                        <ArrowDownTrayIcon className="h-4 w-4" />
                                    </a>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

function DiscussionPanel({
    title,
    comments = [],
    commentKind,
    draftingRequestId,
    listFilters,
    readOnly = false,
    emptyLabel,
    successFlash,
    successMessage,
    hint = null,
}) {
    const { flash } = usePage().props;
    const listQs = listQueryString(listFilters);
    const editorId = `comment-${commentKind}`;

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
            route('job.drafting.comments.store', draftingRequestId) + listQs,
            {
                preserveScroll: true,
                preserveState: false,
                onSuccess: () => {
                    form.reset('body');
                    form.setData('kind', commentKind);
                    setEditorKey((key) => key + 1);
                    router.reload({
                        only: ['draftingRequest'],
                        preserveScroll: true,
                    });
                },
            },
        );
    };

    return (
        <div className={cardClass}>
            <div className="border-b border-[#e6e9ef] bg-[#fafbfc] px-4 py-3 sm:px-5">
                <h3 className="text-sm font-semibold text-[#323338]">{title}</h3>
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
                        ? 'Run comments are disabled while this request is archived.'
                        : 'Comments are disabled while this request is archived.'}
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

function ActivityLogsSection() {
    const { draftingRequest } = usePage().props;
    const activities = draftingRequest?.activities ?? [];

    return (
        <div className={cardClass}>
            <div className="border-b border-[#e6e9ef] bg-[#fafbfc] px-4 py-3 sm:px-5">
                <h2 className="text-base font-semibold text-[#323338]">
                    Activity log
                </h2>
                <p className="mt-0.5 text-xs text-[#676879]">
                    Status changes, comments, and other updates
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
