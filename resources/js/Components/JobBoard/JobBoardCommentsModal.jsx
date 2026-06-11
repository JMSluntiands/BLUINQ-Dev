import InputError from '@/Components/InputError';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import RichTextEditor from '@/Components/RichTextEditor';
import UserAvatar from '@/Components/UserAvatar';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/solid';
import { useForm } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';

function CommentBody({ html }) {
    return (
        <div
            className="rich-text-content text-sm text-[#323338] dark:text-slate-200 [&_a]:text-[#0073ea] [&_a]:underline dark:[&_a]:text-[#1890ff] [&_blockquote]:border-l-2 [&_blockquote]:border-[#e6e9ef] [&_blockquote]:pl-3 [&_blockquote]:text-[#676879] dark:[&_blockquote]:border-slate-600 dark:[&_blockquote]:text-slate-400 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}

/**
 * @param {{
 *   show: boolean;
 *   job: { id: number; job: string; job_no: string; reference?: string } | null;
 *   onClose: () => void;
 *   onCommentsUpdated?: () => void;
 * }} props
 */
export default function JobBoardCommentsModal({
    show,
    job,
    onClose,
    onCommentsUpdated,
}) {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState(null);
    const [editorKey, setEditorKey] = useState(0);

    const form = useForm({
        kind: 'comment',
        body: '',
    });

    const loadComments = useCallback(async () => {
        if (!job?.id) {
            return;
        }

        setLoading(true);
        setLoadError(null);

        try {
            const { data } = await window.axios.get(
                route('job.drafting.board-comments', job.id),
            );
            setComments(data.comments ?? []);
        } catch {
            setLoadError('Could not load comments. Please try again.');
            setComments([]);
        } finally {
            setLoading(false);
        }
    }, [job?.id]);

    useEffect(() => {
        if (show && job?.id) {
            loadComments();
            form.reset();
            form.setData('kind', 'comment');
            setEditorKey((key) => key + 1);
        }
    }, [show, job?.id, loadComments]);

    const submit = (e) => {
        e.preventDefault();
        if (!job?.id) {
            return;
        }

        form.post(route('job.drafting.comments.store', job.id), {
            preserveScroll: true,
            onSuccess: () => {
                form.reset('body');
                form.setData('kind', 'comment');
                setEditorKey((key) => key + 1);
                loadComments();
                onCommentsUpdated?.();
            },
        });
    };

    const handleClose = () => {
        if (form.processing) {
            return;
        }
        onClose();
    };

    return (
        <Modal show={show} onClose={handleClose} maxWidth="2xl">
            <div className="bg-white text-[#323338] dark:bg-[#1a1b2e] dark:text-white">
                <div className="flex items-start justify-between gap-4 border-b border-[#e6e9ef] px-5 py-4 dark:border-[#2a2d3e]">
                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#676879] dark:text-slate-400">
                            {job?.job_no ?? job?.reference ?? 'Job'}
                        </p>
                        <h2 className="mt-1 text-base font-semibold leading-snug text-[#323338] dark:text-white">
                            {job?.job ?? 'Comments'}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="rounded-lg p-1.5 text-[#676879] transition hover:bg-[#e6f4ff] hover:text-[#0073ea] dark:text-slate-400 dark:hover:bg-[#243044] dark:hover:text-white"
                        aria-label="Close comments"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                {loading ? (
                    <p className="px-5 py-8 text-sm text-[#676879] dark:text-slate-400">
                        Loading comments…
                    </p>
                ) : loadError ? (
                    <div className="space-y-3 px-5 py-8">
                        <p className="text-sm text-rose-600 dark:text-rose-300">
                            {loadError}
                        </p>
                        <button
                            type="button"
                            onClick={loadComments}
                            className="text-sm font-medium text-[#0073ea] hover:underline dark:text-[#1890ff]"
                        >
                            Retry
                        </button>
                    </div>
                ) : comments.length === 0 ? (
                    <p className="flex items-center gap-2 border-b border-[#e6e9ef] px-5 py-6 text-sm text-[#676879] dark:border-[#2a2d3e] dark:text-slate-400">
                        <ChatBubbleLeftEllipsisIcon
                            className="h-5 w-5 shrink-0"
                            aria-hidden
                        />
                        No comments yet. Start the conversation below.
                    </p>
                ) : (
                    <ul className="max-h-72 divide-y divide-[#e6e9ef] overflow-y-auto border-b border-[#e6e9ef] dark:divide-[#2a2d3e] dark:border-[#2a2d3e]">
                        {comments.map((comment) => (
                            <li key={comment.id} className="px-5 py-4">
                                <article className="flex gap-3">
                                    <UserAvatar
                                        user={{
                                            name: comment.author_name,
                                            profile_image_url:
                                                comment.author_profile_image_url,
                                        }}
                                        className="h-9 w-9 text-xs"
                                        ringClassName="ring-2 ring-white dark:ring-[#2a2d3e]"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                                            <p className="text-sm font-semibold text-[#323338] dark:text-white">
                                                {comment.author_name}
                                                {comment.is_mine ? (
                                                    <span className="ml-2 text-xs font-medium text-[#676879] dark:text-slate-400">
                                                        (you)
                                                    </span>
                                                ) : null}
                                            </p>
                                            <time className="text-xs text-[#676879] dark:text-slate-500">
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

                <form onSubmit={submit} className="space-y-3 p-5">
                    <input type="hidden" name="kind" value="comment" />
                    <RichTextEditor
                        key={editorKey}
                        id={`job-board-comment-${job?.id ?? 'new'}`}
                        value={form.data.body}
                        onChange={(html) => form.setData('body', html)}
                        disabled={form.processing}
                        placeholder="Write a comment…"
                    />
                    <InputError message={form.errors.body} />
                    <InputError message={form.errors.kind} />
                    <div className="flex justify-end">
                        <PrimaryButton
                            type="submit"
                            loading={form.processing}
                            disabled={form.processing}
                        >
                            Send
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </Modal>
    );
}

export function JobBoardCommentButton({ count = 0, onClick, label }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="relative shrink-0 rounded-md p-1.5 text-[#676879] transition hover:bg-[#e6f4ff] hover:text-[#0073ea] dark:text-slate-400 dark:hover:bg-[#243044] dark:hover:text-white"
            aria-label={
                count > 0
                    ? `View ${count} comment${count === 1 ? '' : 's'} for ${label}`
                    : `Add comment for ${label}`
            }
        >
            <ChatBubbleLeftEllipsisIcon className="h-5 w-5" aria-hidden />
            {count > 0 && (
                <span className="absolute -bottom-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#0073ea] px-1 text-[10px] font-bold text-white ring-2 ring-white dark:bg-[#1890ff] dark:ring-[#1a1b2e]">
                    {count > 99 ? '99+' : count}
                </span>
            )}
        </button>
    );
}
