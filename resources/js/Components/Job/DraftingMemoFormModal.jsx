import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import RichTextEditor from '@/Components/RichTextEditor';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const selectClass =
    'mt-1 block w-full rounded-md border border-[#c5c7d0] bg-white px-3 py-2 text-sm text-[#323338] shadow-sm focus:border-[#0073ea] focus:outline-none focus:ring-1 focus:ring-[#0073ea] dark:border-[#2f3347] dark:bg-[#151622] dark:text-slate-200';

function todayInputValue() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${now.getFullYear()}-${month}-${day}`;
}

function filterQueryString(filters = {}) {
    const params = new URLSearchParams();
    if (filters.search) {
        params.set('search', filters.search);
    }
    if (filters.per_page) {
        params.set('per_page', String(filters.per_page));
    }
    if (filters.client) {
        params.set('client', filters.client);
    }
    if (filters.tag_id) {
        params.set('tag_id', String(filters.tag_id));
    }
    if (filters.sort) {
        params.set('sort', filters.sort);
    }
    const query = params.toString();

    return query ? `?${query}` : '';
}

/**
 * @param {{
 *   show: boolean;
 *   memo?: object | null;
 *   tags?: Array<{ id: number; name: string }>;
 *   filters?: object;
 *   canManageTags?: boolean;
 *   onClose: () => void;
 * }} props
 */
export default function DraftingMemoFormModal({
    show,
    memo = null,
    tags = [],
    filters = {},
    canManageTags = false,
    onClose,
}) {
    const isEditing = Boolean(memo?.id);
    const listQs = filterQueryString(filters);
    const [editorKey, setEditorKey] = useState(0);
    const [newTagName, setNewTagName] = useState('');
    const [availableTags, setAvailableTags] = useState(tags);
    const [addingTag, setAddingTag] = useState(false);
    const [tagError, setTagError] = useState(null);

    const form = useForm({
        client_name: '',
        description: '',
        reference_url: '',
        memo_date: todayInputValue(),
        tag_ids: [],
        attachment: null,
        remove_attachment: false,
    });

    useEffect(() => {
        if (!show) {
            return;
        }

        form.clearErrors();
        form.setData({
            client_name: memo?.client_name ?? '',
            description: memo?.description ?? '',
            reference_url: memo?.reference_url ?? '',
            memo_date: memo?.memo_date_raw ?? todayInputValue(),
            tag_ids: memo?.tags?.map((tag) => tag.id) ?? [],
            attachment: null,
            remove_attachment: false,
        });
        setNewTagName('');
        setTagError(null);
        setAvailableTags(tags);
        setEditorKey((key) => key + 1);
    }, [show, memo?.id, tags]);

    const toggleTag = (tagId) => {
        const current = form.data.tag_ids;
        if (current.includes(tagId)) {
            form.setData(
                'tag_ids',
                current.filter((id) => id !== tagId),
            );
            return;
        }

        form.setData('tag_ids', [...current, tagId]);
    };

    const addTag = async () => {
        const trimmed = newTagName.trim();
        if (!trimmed || addingTag) {
            return;
        }

        setAddingTag(true);
        setTagError(null);

        try {
            const { data } = await window.axios.post(
                route('drafting-memos.tags.store'),
                { name: trimmed },
                {
                    headers: {
                        Accept: 'application/json',
                    },
                },
            );

            const tag = data.tag;
            setAvailableTags((current) => {
                if (current.some((entry) => entry.id === tag.id)) {
                    return current;
                }

                return [...current, tag].sort((left, right) =>
                    left.name.localeCompare(right.name),
                );
            });

            if (!form.data.tag_ids.includes(tag.id)) {
                form.setData('tag_ids', [...form.data.tag_ids, tag.id]);
            }

            setNewTagName('');
        } catch (error) {
            const message =
                error.response?.data?.errors?.name?.[0] ??
                error.response?.data?.message ??
                'Could not add tag.';

            setTagError(message);
        } finally {
            setAddingTag(false);
        }
    };

    const submit = (event) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => onClose(),
        };

        if (isEditing) {
            form.transform((data) => ({
                ...data,
                _method: 'patch',
            }));
            form.post(
                route('drafting-memos.update', memo.id) + listQs,
                options,
            );
            return;
        }

        form.post(route('drafting-memos.store') + listQs, options);
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="2xl">
            <form onSubmit={submit} className="max-h-[85vh] overflow-y-auto p-5">
                <h2 className="text-base font-semibold text-[#323338] dark:text-white">
                    {isEditing ? 'Edit memo' : 'Add memo'}
                </h2>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <InputLabel htmlFor="memo-client" value="Client name" />
                        <TextInput
                            id="memo-client"
                            value={form.data.client_name}
                            onChange={(event) =>
                                form.setData('client_name', event.target.value)
                            }
                            className="mt-1 block w-full"
                            required
                        />
                        <InputError
                            message={form.errors.client_name}
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <InputLabel htmlFor="memo-date" value="Date" />
                        <TextInput
                            id="memo-date"
                            type="date"
                            value={form.data.memo_date}
                            onChange={(event) =>
                                form.setData('memo_date', event.target.value)
                            }
                            className="mt-1 block w-full"
                            required
                        />
                        <InputError
                            message={form.errors.memo_date}
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <InputLabel htmlFor="memo-reference" value="Reference link" />
                        <TextInput
                            id="memo-reference"
                            type="url"
                            value={form.data.reference_url}
                            onChange={(event) =>
                                form.setData('reference_url', event.target.value)
                            }
                            className="mt-1 block w-full"
                            placeholder="https://"
                        />
                        <InputError
                            message={form.errors.reference_url}
                            className="mt-1"
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <InputLabel value="Memo / description" />
                        <div className="mt-1 [&_.rich-text-editor]:max-h-[140px] [&_.rich-text-editor]:min-h-[88px]">
                            <RichTextEditor
                                key={editorKey}
                                value={form.data.description}
                                onChange={(html) =>
                                    form.setData('description', html)
                                }
                                placeholder="Paste memo details or screenshots here…"
                                allowImages
                            />
                        </div>
                        <InputError
                            message={form.errors.description}
                            className="mt-1"
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <InputLabel htmlFor="memo-attachment" value="Email attachment (PDF)" />
                        {memo?.has_attachment && !form.data.remove_attachment && (
                            <p className="mt-1 text-xs text-[#676879] dark:text-slate-400">
                                Current file: {memo.attachment_name}
                            </p>
                        )}
                        <input
                            id="memo-attachment"
                            type="file"
                            accept="application/pdf,.pdf"
                            onChange={(event) =>
                                form.setData(
                                    'attachment',
                                    event.target.files?.[0] ?? null,
                                )
                            }
                            className="mt-2 block w-full text-sm text-[#676879] file:me-3 file:rounded-md file:border-0 file:bg-[#0073ea] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#0060c4] dark:text-slate-400"
                        />
                        {memo?.has_attachment && (
                            <label className="mt-2 flex items-center gap-2 text-sm text-[#676879] dark:text-slate-400">
                                <input
                                    type="checkbox"
                                    checked={form.data.remove_attachment}
                                    onChange={(event) =>
                                        form.setData(
                                            'remove_attachment',
                                            event.target.checked,
                                        )
                                    }
                                />
                                Remove current PDF
                            </label>
                        )}
                        <InputError
                            message={form.errors.attachment}
                            className="mt-1"
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <InputLabel value="Tags" />
                        <div className="mt-2 flex flex-wrap gap-2">
                            {availableTags.map((tag) => {
                                const selected = form.data.tag_ids.includes(
                                    tag.id,
                                );

                                return (
                                    <button
                                        key={tag.id}
                                        type="button"
                                        onClick={() => toggleTag(tag.id)}
                                        className={
                                            'rounded-md border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide transition ' +
                                            (selected
                                                ? 'border-[#0073ea] bg-[#0073ea]/10 text-[#0073ea] dark:border-[#1890ff] dark:bg-[#1890ff]/10 dark:text-[#1890ff]'
                                                : 'border-[#c5c7d0] text-[#676879] hover:border-[#0073ea] dark:border-[#2f3347] dark:text-slate-400')
                                        }
                                    >
                                        {tag.name}
                                    </button>
                                );
                            })}
                        </div>
                        <InputError
                            message={form.errors.tag_ids}
                            className="mt-1"
                        />

                        {canManageTags && (
                            <div className="mt-3 flex flex-wrap items-end gap-2">
                                <div className="min-w-[12rem] flex-1">
                                    <InputLabel
                                        htmlFor="memo-new-tag"
                                        value="Add new tag"
                                    />
                                    <TextInput
                                        id="memo-new-tag"
                                        value={newTagName}
                                        onChange={(event) =>
                                            setNewTagName(event.target.value)
                                        }
                                        className="mt-1 block w-full"
                                        placeholder="e.g. ELEVATIONS"
                                    />
                                </div>
                                <SecondaryButton
                                    type="button"
                                    onClick={addTag}
                                    disabled={addingTag}
                                    className="rounded-lg normal-case tracking-normal"
                                >
                                    {addingTag ? 'Adding…' : 'Add tag'}
                                </SecondaryButton>
                            </div>
                        )}
                        {tagError && (
                            <InputError message={tagError} className="mt-2" />
                        )}
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap justify-end gap-2">
                    <SecondaryButton
                        type="button"
                        onClick={onClose}
                        className="rounded-lg normal-case tracking-normal"
                    >
                        Cancel
                    </SecondaryButton>
                    <PrimaryButton
                        loading={form.processing}
                        className="rounded-lg normal-case tracking-normal"
                    >
                        {isEditing ? 'Save changes' : 'Add memo'}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
