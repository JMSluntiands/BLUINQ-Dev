import DangerButton from '@/Components/DangerButton';
import DraftingJobShowLayout from '@/Components/Drafting/DraftingJobShowLayout';
import DraftingAccountAddModal from '@/Components/Drafting/DraftingAccountAddModal';
import DraftingRevisionAddModal from '@/Components/Drafting/DraftingRevisionAddModal';
import DraftingEditModals from '@/Components/DraftingEditModals';
import DraftingFilesEditModal from '@/Components/DraftingFilesEditModal';
import FlashNoticeModal from '@/Components/FlashNoticeModal';
import InputError from '@/Components/InputError';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import RichTextEditor from '@/Components/RichTextEditor';
import SecondaryButton from '@/Components/SecondaryButton';
import UserAvatar from '@/Components/UserAvatar';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { uploadDraftingCommentInlineImage } from '@/lib/uploadDraftingCommentInlineImage';
import {
    ArchiveBoxArrowDownIcon,
    ArrowUturnLeftIcon,
    ChatBubbleLeftRightIcon,
    ClockIcon,
    DocumentTextIcon,
    PencilSquareIcon,
} from '@heroicons/react/24/outline';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useCallback, useMemo, useState } from 'react';

function listQueryString(listFilters = {}) {
    const p = new URLSearchParams();
    if (listFilters.search) {
        p.set('search', listFilters.search);
    }
    if (listFilters.per_page) {
        p.set('per_page', String(listFilters.per_page));
    }
    if (listFilters.from === 'archive' || listFilters.from === 'masterlist') {
        p.set('from', listFilters.from);
    }
    const s = p.toString();
    return s ? `?${s}` : '';
}

const cardClass =
    'overflow-hidden rounded-xl border border-[#e6e9ef] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)] dark:border-[#2f3347] dark:bg-[#1a1b2e]';

export default function DraftingShow({
    draftingRequest,
    revisions = [],
    quotes = [],
    invoices = [],
    integrationUrls = {},
    listFilters = {},
    capabilities = {},
    statusOptions = [],
    categoryOptions = [],
    formOptions = {},
    drafterUsers = [],
}) {
    const revisionCode = usePage().props.flash?.revision_code ?? null;
    const flashMessages = {
        'drf-archived': 'Drafting request moved to archive.',
        'drf-restored': 'Drafting request restored to the list.',
        'drf-updated': 'Details saved.',
        'drf-files-updated': 'Files updated.',
        'drf-revision-added': 'Revision added.',
        'drf-revision-updated': 'Revision updated.',
        'drf-quote-added': 'Quote added.',
        'drf-invoice-added': 'Invoice added.',
        'drf-quote-updated': 'Quote updated.',
        'drf-invoice-updated': 'Invoice updated.',
        'masterlist-forwarded':
            'Project added to Archi Project Management from the masterlist.',
        'board-reopened': revisionCode
            ? `Project reopened on board with revision ${revisionCode}.`
            : 'Project reopened on board with a new revision.',
    };
    const {
        editJobDetails = false,
        editBuildingArea = false,
        editFiles = false,
        archive = false,
        viewRevision = false,
        addRevision = false,
        viewAccounts = false,
        addAccount = false,
        viewFiles = false,
        viewComments = false,
        postComments = false,
        viewActivity = false,
    } = capabilities;

    const listQs = listQueryString(listFilters);
    const fromArchive = listFilters.from === 'archive';
    const fromMasterlist = listFilters.from === 'masterlist';
    const backHref = fromMasterlist
        ? route('job.masterlist') + listQs
        : (fromArchive ? route('job.drafting.archive') : route('job.list')) +
          listQs;
    const backLabel = fromMasterlist
        ? '← Back to masterlist'
        : fromArchive
          ? '← Back to archive'
          : '← Back to Archi Project Management';
    const updateUrl =
        route('job.drafting.update', draftingRequest.id) + listQs;
    const [archiveOpen, setArchiveOpen] = useState(false);
    const [restoreOpen, setRestoreOpen] = useState(false);
    const [editSection, setEditSection] = useState(null);
    const [filesEditPanel, setFilesEditPanel] = useState(null);
    const [revisionModalOpen, setRevisionModalOpen] = useState(false);
    const [editingRevision, setEditingRevision] = useState(null);
    const [quoteModalOpen, setQuoteModalOpen] = useState(false);
    const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
    const [editingQuote, setEditingQuote] = useState(null);
    const [editingInvoice, setEditingInvoice] = useState(null);

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

    const archiveActions = archive ? (
        <>
            {!draftingRequest.is_archived ? (
                <button
                    type="button"
                    onClick={() => setArchiveOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#c5c7d0] bg-white px-4 py-2 text-sm font-semibold text-[#323338] shadow-sm transition hover:border-[#e44258] hover:text-[#e44258] dark:border-[#2f3347] dark:bg-[#1a1b2e] dark:text-slate-200"
                >
                    <ArchiveBoxArrowDownIcon className="h-4 w-4" aria-hidden />
                    Archive this job
                </button>
            ) : (
                <button
                    type="button"
                    onClick={() => setRestoreOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#0073ea] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0060c4]"
                >
                    <ArrowUturnLeftIcon className="h-4 w-4" aria-hidden />
                    Restore
                </button>
            )}
        </>
    ) : null;

    return (
        <AuthenticatedLayout>
            <Head
                title={`${draftingRequest.site_address || draftingRequest.reference} — Project info`}
            />

            <div className="mx-auto max-w-[1400px] space-y-6 pb-10">
                <FlashNoticeModal messages={flashMessages} />

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

                <DraftingRevisionAddModal
                    show={revisionModalOpen || editingRevision != null}
                    onClose={() => {
                        setRevisionModalOpen(false);
                        setEditingRevision(null);
                    }}
                    draftingRequestId={draftingRequest.id}
                    listFilters={listFilters}
                    drafterUsers={drafterUsers}
                    entry={editingRevision}
                    jobNumber={draftingRequest.reference}
                    revisions={revisions}
                    statusOptions={statusOptions}
                    categoryOptions={categoryOptions}
                    defaultJobStatus={draftingRequest.status ?? 'new'}
                />

                <DraftingAccountAddModal
                    show={quoteModalOpen || editingQuote != null}
                    onClose={() => {
                        setQuoteModalOpen(false);
                        setEditingQuote(null);
                    }}
                    draftingRequestId={draftingRequest.id}
                    listFilters={listFilters}
                    accountKind="quote"
                    entry={editingQuote}
                />

                <DraftingAccountAddModal
                    show={invoiceModalOpen || editingInvoice != null}
                    onClose={() => {
                        setInvoiceModalOpen(false);
                        setEditingInvoice(null);
                    }}
                    draftingRequestId={draftingRequest.id}
                    listFilters={listFilters}
                    accountKind="invoice"
                    entry={editingInvoice}
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

                <DraftingJobShowLayout
                    draftingRequest={draftingRequest}
                    revisions={revisions}
                    quotes={quotes}
                    invoices={invoices}
                    integrationUrls={integrationUrls}
                    variant={fromMasterlist ? 'masterlist' : 'default'}
                    canEdit={editJobDetails}
                    canEditJobDetails={editJobDetails}
                    canEditBuildingArea={editBuildingArea}
                    canViewAccounts={viewAccounts}
                    canAddAccount={addAccount}
                    onAddQuote={() => setQuoteModalOpen(true)}
                    onAddInvoice={() => setInvoiceModalOpen(true)}
                    onEditQuote={(row) => setEditingQuote(row)}
                    onEditInvoice={(row) => setEditingInvoice(row)}
                    canViewRevision={viewRevision}
                    canAddRevision={addRevision}
                    onAddRevision={() => setRevisionModalOpen(true)}
                    onEditRevision={
                        addRevision ? (row) => setEditingRevision(row) : undefined
                    }
                    updateUrl={updateUrl}
                    onEditJobDetails={() => setEditSection('job')}
                    backHref={backHref}
                    backLabel={backLabel}
                    archiveActions={archiveActions}
                    filesPanel={
                        viewFiles ? (
                            <FilePanel
                                title="Documents"
                                files={documentFiles}
                                emptyLabel="No documents uploaded."
                                canEdit={editFiles}
                                onEdit={() => setFilesEditPanel('documents')}
                            />
                        ) : null
                    }
                    commentsPanel={
                        viewComments ? (
                        <DiscussionPanel
                            comments={draftingRequest.comments ?? []}
                            revisions={revisions}
                            commentKind="comment"
                            draftingRequestId={draftingRequest.id}
                            listFilters={listFilters}
                            readOnly={
                                draftingRequest.is_archived || !postComments
                            }
                            emptyLabel="No comments yet."
                            successFlash="comment-added"
                            successMessage="Comment added."
                            embedded
                        />
                        ) : null
                    }
                    activityPanel={
                        viewActivity ? (
                            <ActivityLogsSection embedded />
                        ) : null
                    }
                />
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
            <div className="flex items-center justify-between border-b border-[#e6e9ef] bg-[#fafbfc] px-4 py-3 sm:px-5 dark:border-[#2f3347] dark:bg-[#151622]">
                <h3 className="text-sm font-semibold text-[#323338] dark:text-white">
                    {title}
                </h3>
                {canEdit ? (
                    <button
                        type="button"
                        onClick={onEdit}
                        className="inline-flex items-center gap-1 rounded-md border border-[#c5c7d0] bg-white px-2.5 py-1 text-xs font-semibold text-[#0073ea] shadow-sm transition hover:bg-[#e6f4ff] dark:border-[#3b82f6]/50 dark:bg-[#1a1b2e] dark:text-[#60a5fa] dark:hover:bg-[#243044]"
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
                    <p className="text-sm text-[#676879] dark:text-slate-400">
                        {emptyLabel}
                    </p>
                ) : (
                    <ul className="space-y-2">
                        {files.map((file) => (
                            <li
                                key={file.id}
                                className="flex items-center gap-2 rounded-lg border border-[#e6e9ef] bg-[#fafbfc] px-3 py-2 dark:border-[#3b82f6]/30 dark:bg-[#151622]"
                            >
                                <DocumentTextIcon
                                    className="h-5 w-5 shrink-0 text-[#676879] dark:text-slate-400"
                                    aria-hidden
                                />
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-[#323338] dark:text-slate-200">
                                        {file.original_name}
                                    </p>
                                    <p className="text-xs text-[#676879] dark:text-slate-400">
                                        {file.size_label}
                                    </p>
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
    revisions = [],
    commentKind,
    draftingRequestId,
    listFilters,
    readOnly = false,
    emptyLabel,
    successFlash,
    successMessage,
    hint = null,
    embedded = false,
}) {
    const { flash } = usePage().props;
    const listQs = listQueryString(listFilters);
    const editorId = `comment-${commentKind}`;
    const latestRevisionId =
        revisions.length > 0 ? String(revisions[0].id) : '';

    const form = useForm({
        kind: commentKind,
        body: '',
        drafting_request_revision_id: latestRevisionId,
    });
    const [editorKey, setEditorKey] = useState(0);
    const [filterRevisionId, setFilterRevisionId] = useState('all');

    const revisionOptions = useMemo(
        () =>
            revisions.map((revision) => ({
                value: String(revision.id),
                label: revision.code || `Revision #${revision.id}`,
            })),
        [revisions],
    );

    const filteredComments = useMemo(() => {
        if (filterRevisionId === 'all') {
            return comments;
        }

        if (filterRevisionId === 'general') {
            return comments.filter((comment) => !comment.revision_id);
        }

        const selectedId = Number(filterRevisionId);

        return comments.filter(
            (comment) => Number(comment.revision_id) === selectedId,
        );
    }, [comments, filterRevisionId]);

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
                    form.setData({
                        kind: commentKind,
                        drafting_request_revision_id:
                            form.data.drafting_request_revision_id ||
                            latestRevisionId,
                    });
                    setEditorKey((key) => key + 1);
                    router.reload({
                        only: ['draftingRequest'],
                        preserveScroll: true,
                    });
                },
            },
        );
    };

    const shellClass = embedded
        ? 'flex min-h-0 flex-1 flex-col'
        : cardClass;

    return (
        <div className={shellClass}>
            {!embedded ? (
                <div className="border-b border-[#e6e9ef] bg-[#fafbfc] px-4 py-3 sm:px-5 dark:border-[#2f3347] dark:bg-[#151622]">
                    <h3 className="text-sm font-semibold text-[#323338] dark:text-white">
                        {title}
                    </h3>
                    {hint ? (
                        <p className="mt-0.5 text-xs text-[#676879] dark:text-slate-400">
                            {hint}
                        </p>
                    ) : null}
                </div>
            ) : null}

            {flash?.status === successFlash ? (
                <p className="border-b border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-300 sm:px-5">
                    {successMessage}
                </p>
            ) : null}

            {revisionOptions.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2 border-b border-[#e6e9ef] px-4 py-2.5 dark:border-[#2f3347] sm:px-5">
                    <label
                        htmlFor={`${editorId}-filter`}
                        className="text-[11px] font-semibold uppercase tracking-wide text-[#676879] dark:text-slate-400"
                    >
                        Show
                    </label>
                    <select
                        id={`${editorId}-filter`}
                        value={filterRevisionId}
                        onChange={(event) =>
                            setFilterRevisionId(event.target.value)
                        }
                        className="rounded-md border border-[#c5c7d0] bg-white px-2 py-1 text-xs font-medium text-[#323338] focus:border-[#0073ea] focus:outline-none focus:ring-1 focus:ring-[#0073ea] dark:border-[#2f3347] dark:bg-[#151622] dark:text-slate-200"
                    >
                        <option value="all">All comments</option>
                        <option value="general">General (no revision)</option>
                        {revisionOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            ) : null}

            {filteredComments.length === 0 ? (
                <p className="flex items-center gap-2 border-b border-[#e6e9ef] px-4 py-5 text-sm text-[#676879] dark:border-[#2f3347] dark:text-slate-400 sm:px-5">
                    <ChatBubbleLeftRightIcon
                        className="h-5 w-5 shrink-0"
                        aria-hidden
                    />
                    {comments.length === 0
                        ? emptyLabel
                        : 'No comments for this revision filter.'}
                </p>
            ) : (
                <ul className="max-h-64 divide-y divide-[#e6e9ef] overflow-y-auto border-b border-[#e6e9ef] dark:divide-[#2f3347] dark:border-[#2f3347]">
                    {filteredComments.map((comment) => (
                        <li key={comment.id} className="px-4 py-4 sm:px-5">
                            <article className="flex gap-3">
                                <UserAvatar
                                    user={{
                                        name: comment.author_name,
                                        profile_image_url:
                                            comment.author_profile_image_url,
                                    }}
                                    className="h-9 w-9 text-xs"
                                    ringClassName="ring-2 ring-[#e6e9ef] dark:ring-[#3b82f6]/40"
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                                        <p className="text-sm font-semibold text-[#323338] dark:text-white">
                                            {comment.author_name}
                                            {comment.is_mine ? (
                                                <span className="ml-2 text-xs font-medium text-slate-400">
                                                    (you)
                                                </span>
                                            ) : null}
                                            {comment.revision_code ? (
                                                <span className="ml-2 inline-flex rounded-md bg-[#e6f4ff] px-1.5 py-0.5 text-[10px] font-semibold text-[#0073ea] dark:bg-[#1e3a5f] dark:text-[#93c5fd]">
                                                    {comment.revision_code}
                                                </span>
                                            ) : (
                                                <span className="ml-2 inline-flex rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                                                    General
                                                </span>
                                            )}
                                        </p>
                                        <time className="text-xs text-slate-400">
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
                <p className="px-4 py-4 text-sm text-[#676879] dark:text-slate-400 sm:px-5">
                    {commentKind === 'run'
                        ? 'Run comments are disabled while this request is archived.'
                        : 'Comments are disabled while this request is archived.'}
                </p>
            ) : (
                <form onSubmit={submit} className="space-y-3 p-4 sm:p-5">
                    <input type="hidden" name="kind" value={commentKind} />
                    {revisionOptions.length > 0 ? (
                        <div>
                            <label
                                htmlFor={`${editorId}-revision`}
                                className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#676879] dark:text-slate-400"
                            >
                                Revision number
                            </label>
                            <select
                                id={`${editorId}-revision`}
                                value={form.data.drafting_request_revision_id}
                                onChange={(event) =>
                                    form.setData(
                                        'drafting_request_revision_id',
                                        event.target.value,
                                    )
                                }
                                className="block w-full rounded-lg border border-[#c5c7d0] bg-white px-3 py-2 text-sm text-[#323338] focus:border-[#0073ea] focus:outline-none focus:ring-1 focus:ring-[#0073ea] dark:border-[#2f3347] dark:bg-[#151622] dark:text-slate-200"
                            >
                                <option value="">General (no revision)</option>
                                {revisionOptions.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <InputError
                                message={
                                    form.errors.drafting_request_revision_id
                                }
                                className="mt-1"
                            />
                        </div>
                    ) : null}
                    <RichTextEditor
                        key={editorKey}
                        id={editorId}
                        value={form.data.body}
                        onChange={(html) => form.setData('body', html)}
                        disabled={form.processing}
                        allowImages
                        uploadImage={uploadDraftingCommentInlineImage}
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
                            className="!bg-[#0073ea] hover:!bg-[#0060c4] focus:!ring-[#0073ea] dark:!bg-[#2563eb] dark:hover:!bg-[#1d4ed8] dark:focus:!ring-[#2563eb]"
                        >
                            Send
                        </PrimaryButton>
                    </div>
                </form>
            )}
        </div>
    );
}

function ActivityLogsSection({ embedded = false }) {
    const { draftingRequest } = usePage().props;
    const activities = draftingRequest?.activities ?? [];

    return (
        <div className={cardClass}>
            <div className="border-b border-[#e6e9ef] bg-[#fafbfc] px-4 py-3 sm:px-5 dark:border-[#2f3347] dark:bg-[#151622]">
                <h2
                    className={
                        embedded
                            ? 'text-sm font-semibold text-[#323338] dark:text-white'
                            : 'text-base font-semibold text-[#323338] dark:text-white'
                    }
                >
                    {embedded ? 'Recent activity' : 'Activity log'}
                </h2>
                <p className="mt-0.5 text-xs text-[#676879] dark:text-slate-400">
                    Status changes, comments, and other updates
                </p>
            </div>

            {activities.length === 0 ? (
                <p className="flex items-center gap-2 px-4 py-6 text-sm text-[#676879] dark:text-slate-400 sm:px-5">
                    <ClockIcon className="h-5 w-5 shrink-0" aria-hidden />
                    No activity recorded yet.
                </p>
            ) : (
                <ul className="max-h-56 space-y-0 overflow-y-auto overscroll-contain px-4 py-3 sm:max-h-64 sm:px-5">
                    {activities.map((activity, index) => (
                        <li
                            key={activity.id}
                            className="relative flex gap-3 pb-4 last:pb-1"
                        >
                            {index < activities.length - 1 ? (
                                <span
                                    className="absolute left-[11px] top-6 h-[calc(100%-0.35rem)] w-px bg-[#e6e9ef] dark:bg-[#3b82f6]/30"
                                    aria-hidden
                                />
                            ) : null}
                            <span
                                className="relative z-10 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0073ea] ring-4 ring-white dark:bg-[#2563eb] dark:ring-[#1a1b2e]"
                                aria-hidden
                            >
                                <span className="h-2 w-2 rounded-full bg-white" />
                            </span>
                            <div className="min-w-0 flex-1 pt-0.5">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div>
                                        <p className="text-sm font-semibold text-[#323338] dark:text-white">
                                            {activity.action_label}
                                            {activity.is_mine ? (
                                                <span className="ml-2 text-xs font-medium text-[#676879] dark:text-slate-400">
                                                    (you)
                                                </span>
                                            ) : null}
                                        </p>
                                        <p className="text-xs text-[#676879] dark:text-slate-400">
                                            {activity.user_name}
                                        </p>
                                    </div>
                                    <time className="shrink-0 text-xs text-[#676879] dark:text-slate-400">
                                        {activity.created_at}
                                    </time>
                                </div>
                                {activity.description ? (
                                    <p className="mt-1.5 rounded-lg bg-[#fafbfc] px-2.5 py-1.5 text-xs leading-relaxed text-[#323338] ring-1 ring-[#e6e9ef] dark:border dark:border-[#3b82f6]/30 dark:bg-[#151622] dark:text-slate-200 dark:ring-0">
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
            className="rich-text-content text-sm text-[#323338] dark:text-slate-200 [&_a]:text-[#0073ea] [&_a]:underline dark:[&_a]:text-[#60a5fa] [&_blockquote]:border-l-2 [&_blockquote]:border-[#c5c7d0] [&_blockquote]:pl-3 [&_blockquote]:text-[#676879] dark:[&_blockquote]:border-slate-600 dark:[&_blockquote]:text-slate-400 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-semibold [&_img]:my-3 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-md [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}
