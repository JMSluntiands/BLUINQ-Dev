import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import RichTextEditor from '@/Components/RichTextEditor';
import SecondaryButton from '@/Components/SecondaryButton';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

function firstError(error, fallback) {
    const errors = error?.response?.data?.errors;
    if (errors?.body?.[0]) {
        return errors.body[0];
    }

    return error?.response?.data?.message || fallback;
}

/**
 * Comment body with Edit / Delete for the author or an admin.
 *
 * @param {{
 *   comment: { id: number; body: string; can_manage?: boolean; is_edited?: boolean };
 *   updateUrl: string;
 *   destroyUrl: string;
 *   onChanged?: () => void;
 *   disabled?: boolean;
 *   allowImages?: boolean;
 *   uploadImage?: ((file: File) => Promise<string>) | null;
 *   children: import('react').ReactNode;
 * }} props
 */
export default function ManagedComment({
    comment,
    updateUrl,
    destroyUrl,
    onChanged,
    disabled = false,
    allowImages = false,
    uploadImage = null,
    children,
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(comment.body ?? '');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    const canManage = Boolean(comment.can_manage) && !disabled;

    const startEdit = () => {
        setDraft(comment.body ?? '');
        setError(null);
        setEditing(true);
    };

    const save = async () => {
        setBusy(true);
        setError(null);
        try {
            await window.axios.patch(updateUrl, { body: draft });
            setEditing(false);
            onChanged?.();
        } catch (err) {
            setError(firstError(err, 'Could not save the comment.'));
        } finally {
            setBusy(false);
        }
    };

    const remove = async () => {
        if (!window.confirm('Are you sure you want to delete this comment?')) {
            return;
        }
        setBusy(true);
        setError(null);
        try {
            await window.axios.delete(destroyUrl);
            onChanged?.();
        } catch (err) {
            setError(firstError(err, 'Could not delete the comment.'));
        } finally {
            setBusy(false);
        }
    };

    if (editing) {
        return (
            <div className="space-y-2">
                <RichTextEditor
                    id={`edit-comment-${comment.id}`}
                    value={draft}
                    onChange={setDraft}
                    disabled={busy}
                    allowImages={allowImages}
                    uploadImage={uploadImage}
                    placeholder="Edit comment…"
                />
                <InputError message={error} />
                <div className="flex justify-end gap-2">
                    <SecondaryButton
                        type="button"
                        onClick={() => setEditing(false)}
                        disabled={busy}
                    >
                        Cancel
                    </SecondaryButton>
                    <PrimaryButton
                        type="button"
                        onClick={save}
                        loading={busy}
                    >
                        Save
                    </PrimaryButton>
                </div>
            </div>
        );
    }

    return (
        <div>
            {children}
            {comment.is_edited || canManage ? (
                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs">
                    {comment.is_edited ? (
                        <span className="text-slate-400">(edited)</span>
                    ) : null}
                    {canManage ? (
                        <>
                            <button
                                type="button"
                                onClick={startEdit}
                                disabled={busy}
                                className="inline-flex items-center gap-1 font-medium text-[#676879] transition hover:text-[#0073ea] disabled:opacity-50 dark:text-slate-400 dark:hover:text-[#60a5fa]"
                            >
                                <PencilSquareIcon className="h-3.5 w-3.5" aria-hidden />
                                Edit
                            </button>
                            <button
                                type="button"
                                onClick={remove}
                                disabled={busy}
                                className="inline-flex items-center gap-1 font-medium text-[#676879] transition hover:text-rose-600 disabled:opacity-50 dark:text-slate-400 dark:hover:text-rose-400"
                            >
                                <TrashIcon className="h-3.5 w-3.5" aria-hidden />
                                Delete
                            </button>
                        </>
                    ) : null}
                </div>
            ) : null}
            {error ? <InputError message={error} className="mt-1" /> : null}
        </div>
    );
}
