import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

const selectClass =
    'mt-1 block w-full rounded-md border border-[#c5c7d0] bg-white px-3 py-2 text-sm text-[#323338] shadow-sm focus:border-[#0073ea] focus:outline-none focus:ring-1 focus:ring-[#0073ea] dark:border-[#2f3347] dark:bg-[#151622] dark:text-slate-200';

const tagPillClass =
    'inline-flex rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition';

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
    if (filters.item) {
        params.set('item', String(filters.item));
    }

    const query = params.toString();

    return query ? `?${query}` : '';
}

function TagPicker({
    label,
    type,
    tags,
    selectedIds,
    canManageTags,
    onToggle,
    onCreated,
}) {
    const [newName, setNewName] = useState('');
    const [adding, setAdding] = useState(false);
    const [error, setError] = useState(null);

    const addTag = async () => {
        const trimmed = newName.trim();
        if (!trimmed || adding) {
            return;
        }

        setAdding(true);
        setError(null);

        try {
            const { data } = await window.axios.post(
                route('design.catalogue.tags.store'),
                { name: trimmed, type },
                { headers: { Accept: 'application/json' } },
            );

            const tag = data.tag;
            onCreated(tag);
            setNewName('');
        } catch (caught) {
            setError(
                caught.response?.data?.errors?.name?.[0] ??
                    caught.response?.data?.message ??
                    'Could not add tag.',
            );
        } finally {
            setAdding(false);
        }
    };

    return (
        <div>
            <InputLabel value={label} />
            <div className="mt-1.5 flex flex-wrap gap-1.5">
                {tags.length === 0 ? (
                    <p className="text-xs text-[#676879] dark:text-slate-400">
                        No tags yet.
                    </p>
                ) : (
                    tags.map((tag) => {
                        const selected = selectedIds.includes(tag.id);

                        return (
                            <button
                                key={tag.id}
                                type="button"
                                onClick={() => onToggle(tag.id)}
                                className={
                                    tagPillClass +
                                    (selected
                                        ? ' border-sky-500 bg-sky-50 text-sky-700 dark:border-sky-400 dark:bg-sky-500/15 dark:text-sky-200'
                                        : ' border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-300')
                                }
                            >
                                {tag.name}
                            </button>
                        );
                    })
                )}
            </div>
            {canManageTags ? (
                <div className="mt-2 flex gap-2">
                    <TextInput
                        value={newName}
                        onChange={(event) => setNewName(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                event.preventDefault();
                                addTag();
                            }
                        }}
                        placeholder={`Add ${label.toLowerCase()}…`}
                        className="block w-full text-sm"
                    />
                    <SecondaryButton
                        type="button"
                        onClick={addTag}
                        disabled={adding || newName.trim() === ''}
                    >
                        Add
                    </SecondaryButton>
                </div>
            ) : null}
            <InputError message={error} className="mt-1" />
        </div>
    );
}

export default function CatalogueFormModal({
    show,
    item = null,
    clients = [],
    frontageTags = [],
    zoningTags = [],
    rcodes = [],
    filters = {},
    canManageTags = false,
    onClose,
}) {
    const isEditing = Boolean(item?.id);
    const listQs = filterQueryString(filters);
    const [availableFrontage, setAvailableFrontage] = useState(frontageTags);
    const [availableZoning, setAvailableZoning] = useState(zoningTags);

    const clientOptions = useMemo(() => {
        const names = clients.map((client) =>
            typeof client === 'string' ? client : client.name,
        );
        const current = item?.client_name?.trim();

        if (
            current &&
            !names.some((name) => name.toLowerCase() === current.toLowerCase())
        ) {
            names.unshift(current);
        }

        return names;
    }, [clients, item?.client_name]);

    const form = useForm({
        client_name: '',
        model_name: '',
        rcode: 'part_b',
        area: '',
        link_url: '',
        catalogue_date: todayInputValue(),
        frontage_tag_ids: [],
        zoning_tag_ids: [],
        attachment: null,
    });

    useEffect(() => {
        if (!show) {
            return;
        }

        form.clearErrors();
        form.setData({
            client_name: item?.client_name ?? '',
            model_name: item?.model_name ?? '',
            rcode: item?.rcode ?? 'part_b',
            area: item?.area ?? '',
            link_url: item?.link_url ?? '',
            catalogue_date: item?.catalogue_date_raw ?? todayInputValue(),
            frontage_tag_ids: item?.frontage_tags?.map((tag) => tag.id) ?? [],
            zoning_tag_ids: item?.zoning_tags?.map((tag) => tag.id) ?? [],
            attachment: null,
        });
        setAvailableFrontage(frontageTags);
        setAvailableZoning(zoningTags);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show, item?.id, frontageTags, zoningTags]);

    const toggleId = (field, tagId) => {
        const current = form.data[field];
        form.setData(
            field,
            current.includes(tagId)
                ? current.filter((id) => id !== tagId)
                : [...current, tagId],
        );
    };

    const submit = (event) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => onClose(),
        };

        form.transform((data) =>
            isEditing ? { ...data, _method: 'patch' } : data,
        );

        form.post(
            (isEditing
                ? route('design.catalogue.update', item.id)
                : route('design.catalogue.store')) + listQs,
            options,
        );
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="2xl">
            <form onSubmit={submit} className="max-h-[85vh] overflow-y-auto p-5">
                <h2 className="text-base font-semibold text-[#323338] dark:text-white">
                    {isEditing ? 'Edit catalogue item' : 'Add catalogue item'}
                </h2>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <InputLabel htmlFor="catalogue-model" value="Model name" />
                        <TextInput
                            id="catalogue-model"
                            value={form.data.model_name}
                            onChange={(event) =>
                                form.setData('model_name', event.target.value)
                            }
                            className="mt-1 block w-full"
                            required
                        />
                        <InputError
                            message={form.errors.model_name}
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <InputLabel htmlFor="catalogue-client" value="Client" />
                        <select
                            id="catalogue-client"
                            value={form.data.client_name}
                            onChange={(event) =>
                                form.setData('client_name', event.target.value)
                            }
                            className={selectClass}
                        >
                            <option value="">No client</option>
                            {clientOptions.map((client) => (
                                <option key={client} value={client}>
                                    {client}
                                </option>
                            ))}
                        </select>
                        <InputError
                            message={form.errors.client_name}
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <InputLabel htmlFor="catalogue-date" value="Date" />
                        <TextInput
                            id="catalogue-date"
                            type="date"
                            value={form.data.catalogue_date}
                            onChange={(event) =>
                                form.setData(
                                    'catalogue_date',
                                    event.target.value,
                                )
                            }
                            className="mt-1 block w-full"
                            required
                        />
                        <InputError
                            message={form.errors.catalogue_date}
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <InputLabel htmlFor="catalogue-rcode" value="R-Codes" />
                        <select
                            id="catalogue-rcode"
                            value={form.data.rcode}
                            onChange={(event) =>
                                form.setData('rcode', event.target.value)
                            }
                            className={selectClass}
                            required
                        >
                            {rcodes.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <InputError
                            message={form.errors.rcode}
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <InputLabel htmlFor="catalogue-area" value="Area" />
                        <TextInput
                            id="catalogue-area"
                            value={form.data.area}
                            onChange={(event) =>
                                form.setData('area', event.target.value)
                            }
                            className="mt-1 block w-full"
                            placeholder="e.g. 245 sqm"
                        />
                        <InputError
                            message={form.errors.area}
                            className="mt-1"
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <InputLabel htmlFor="catalogue-link" value="Link" />
                        <TextInput
                            id="catalogue-link"
                            type="url"
                            value={form.data.link_url}
                            onChange={(event) =>
                                form.setData('link_url', event.target.value)
                            }
                            className="mt-1 block w-full"
                            placeholder="https://"
                        />
                        <InputError
                            message={form.errors.link_url}
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <TagPicker
                            label="Frontage"
                            type="frontage"
                            tags={availableFrontage}
                            selectedIds={form.data.frontage_tag_ids}
                            canManageTags={canManageTags}
                            onToggle={(id) =>
                                toggleId('frontage_tag_ids', id)
                            }
                            onCreated={(tag) => {
                                setAvailableFrontage((current) => {
                                    if (current.some((entry) => entry.id === tag.id)) {
                                        return current;
                                    }

                                    return [...current, tag].sort((left, right) =>
                                        left.name.localeCompare(right.name),
                                    );
                                });
                                if (!form.data.frontage_tag_ids.includes(tag.id)) {
                                    form.setData('frontage_tag_ids', [
                                        ...form.data.frontage_tag_ids,
                                        tag.id,
                                    ]);
                                }
                            }}
                        />
                        <InputError
                            message={form.errors.frontage_tag_ids}
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <TagPicker
                            label="Zoning"
                            type="zoning"
                            tags={availableZoning}
                            selectedIds={form.data.zoning_tag_ids}
                            canManageTags={canManageTags}
                            onToggle={(id) => toggleId('zoning_tag_ids', id)}
                            onCreated={(tag) => {
                                setAvailableZoning((current) => {
                                    if (current.some((entry) => entry.id === tag.id)) {
                                        return current;
                                    }

                                    return [...current, tag].sort((left, right) =>
                                        left.name.localeCompare(right.name),
                                    );
                                });
                                if (!form.data.zoning_tag_ids.includes(tag.id)) {
                                    form.setData('zoning_tag_ids', [
                                        ...form.data.zoning_tag_ids,
                                        tag.id,
                                    ]);
                                }
                            }}
                        />
                        <InputError
                            message={form.errors.zoning_tag_ids}
                            className="mt-1"
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <InputLabel
                            htmlFor="catalogue-pdf"
                            value="PDF attachment"
                        />
                        {item?.has_attachment ? (
                            <p className="mt-1 text-xs text-[#676879] dark:text-slate-400">
                                Current file: {item.attachment_name}
                            </p>
                        ) : null}
                        <input
                            id="catalogue-pdf"
                            type="file"
                            accept="application/pdf,.pdf"
                            onChange={(event) =>
                                form.setData(
                                    'attachment',
                                    event.target.files?.[0] ?? null,
                                )
                            }
                            className="mt-2 block w-full text-sm text-[#676879] file:me-3 file:rounded-md file:border-0 file:bg-[#0073ea] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#0060c4] dark:text-slate-400"
                            required={!isEditing}
                        />
                        <InputError
                            message={form.errors.attachment}
                            className="mt-1"
                        />
                    </div>
                </div>

                <div className="mt-5 flex justify-end gap-2">
                    <SecondaryButton type="button" onClick={onClose}>
                        Cancel
                    </SecondaryButton>
                    <PrimaryButton loading={form.processing}>
                        {isEditing ? 'Save changes' : 'Add item'}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
