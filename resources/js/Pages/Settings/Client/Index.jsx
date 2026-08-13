import DangerButton from '@/Components/DangerButton';
import FlashNoticeModal from '@/Components/FlashNoticeModal';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    ArchiveBoxArrowDownIcon,
    MagnifyingGlassIcon,
    PlusIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

const FLASH_MESSAGES = {
    'client-created': 'Client created.',
    'client-updated': 'Client updated.',
    'client-archived': 'Client moved to archive.',
    'client-restored': 'Client restored.',
    'client-contact-created': 'Contact added.',
    'client-contact-updated': 'Contact saved.',
    'client-contact-deleted': 'Contact removed.',
    'client-contact-locked': 'Main and Account contacts cannot be deleted.',
};

const emptyContact = {
    name: '',
    email: '',
    mobile: '',
    title: '',
    remark: '',
};

function SectionCard({ title, badge = null, actions = null, children }) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900 dark:text-white">
                        {title}
                    </h3>
                    {badge}
                </div>
                {actions}
            </div>
            {children}
        </section>
    );
}

function ContactFields({ form, idPrefix }) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
                <InputLabel htmlFor={`${idPrefix}-name`} value="Name" />
                <TextInput
                    id={`${idPrefix}-name`}
                    className="mt-1 block w-full"
                    value={form.data.name}
                    onChange={(e) => form.setData('name', e.target.value)}
                />
                <InputError className="mt-1" message={form.errors.name} />
            </div>
            <div>
                <InputLabel htmlFor={`${idPrefix}-email`} value="Email" />
                <TextInput
                    id={`${idPrefix}-email`}
                    type="email"
                    className="mt-1 block w-full"
                    value={form.data.email}
                    onChange={(e) => form.setData('email', e.target.value)}
                />
                <InputError className="mt-1" message={form.errors.email} />
            </div>
            <div>
                <InputLabel htmlFor={`${idPrefix}-mobile`} value="Mobile" />
                <TextInput
                    id={`${idPrefix}-mobile`}
                    className="mt-1 block w-full"
                    value={form.data.mobile}
                    onChange={(e) => form.setData('mobile', e.target.value)}
                />
                <InputError className="mt-1" message={form.errors.mobile} />
            </div>
            <div>
                <InputLabel htmlFor={`${idPrefix}-title`} value="Title" />
                <TextInput
                    id={`${idPrefix}-title`}
                    className="mt-1 block w-full"
                    value={form.data.title}
                    onChange={(e) => form.setData('title', e.target.value)}
                />
                <InputError className="mt-1" message={form.errors.title} />
            </div>
            <div className="sm:col-span-2">
                <InputLabel htmlFor={`${idPrefix}-remark`} value="Remark" />
                <TextInput
                    id={`${idPrefix}-remark`}
                    className="mt-1 block w-full"
                    value={form.data.remark}
                    onChange={(e) => form.setData('remark', e.target.value)}
                    placeholder="e.g. Resigned"
                />
                <InputError className="mt-1" message={form.errors.remark} />
            </div>
        </div>
    );
}

function ContactEditor({
    clientId,
    contact,
    title,
    canDelete = false,
}) {
    const form = useForm({
        name: contact?.name ?? '',
        email: contact?.email ?? '',
        mobile: contact?.mobile ?? '',
        title: contact?.title ?? '',
        remark: contact?.remark ?? '',
    });

    useEffect(() => {
        form.setData({
            name: contact?.name ?? '',
            email: contact?.email ?? '',
            mobile: contact?.mobile ?? '',
            title: contact?.title ?? '',
            remark: contact?.remark ?? '',
        });
        form.clearErrors();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contact?.id, contact?.name, contact?.email, contact?.mobile, contact?.title, contact?.remark]);

    if (!contact?.id) {
        return null;
    }

    const save = (e) => {
        e.preventDefault();
        form.patch(
            route('settings.client.contacts.update', [clientId, contact.id]),
            { preserveScroll: true },
        );
    };

    const remove = () => {
        if (!canDelete) {
            return;
        }
        router.delete(
            route('settings.client.contacts.destroy', [clientId, contact.id]),
            { preserveScroll: true },
        );
    };

    return (
        <form onSubmit={save} className="space-y-4">
            <ContactFields form={form} idPrefix={`contact-${contact.id}`} />
            <div className="flex flex-wrap items-center gap-2">
                <PrimaryButton loading={form.processing}>Save</PrimaryButton>
                {canDelete ? (
                    <button
                        type="button"
                        onClick={remove}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                    >
                        <TrashIcon className="h-4 w-4" aria-hidden />
                        Remove
                    </button>
                ) : null}
            </div>
        </form>
    );
}

export default function ClientIndex({
    clients = [],
    selected = null,
    filters = {},
}) {
    const [sidebarSearch, setSidebarSearch] = useState(filters.search ?? '');
    const [showAddClient, setShowAddClient] = useState(false);
    const [archiveTarget, setArchiveTarget] = useState(null);

    const addClientForm = useForm({ name: '', status: 'active' });
    const addContactForm = useForm({ ...emptyContact });
    const companyForm = useForm({
        name: selected?.name ?? '',
        abn: selected?.abn ?? '',
        office_phone: selected?.office_phone ?? '',
        website: selected?.website ?? '',
        address: selected?.address ?? '',
        city: selected?.city ?? '',
        state: selected?.state ?? '',
        post_code: selected?.post_code ?? '',
        country: selected?.country ?? '',
        status: selected?.status ?? 'active',
        is_default: Boolean(selected?.is_default),
    });

    useEffect(() => {
        companyForm.setData({
            name: selected?.name ?? '',
            abn: selected?.abn ?? '',
            office_phone: selected?.office_phone ?? '',
            website: selected?.website ?? '',
            address: selected?.address ?? '',
            city: selected?.city ?? '',
            state: selected?.state ?? '',
            post_code: selected?.post_code ?? '',
            country: selected?.country ?? '',
            status: selected?.status ?? 'active',
            is_default: Boolean(selected?.is_default),
        });
        companyForm.clearErrors();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected?.id]);

    const filteredClients = useMemo(() => {
        const q = sidebarSearch.trim().toLowerCase();
        if (!q) {
            return clients;
        }
        return clients.filter((client) =>
            String(client.name ?? '')
                .toLowerCase()
                .includes(q),
        );
    }, [clients, sidebarSearch]);

    const selectClient = (id) => {
        router.get(
            route('settings.client.index'),
            {
                client: id,
                ...(filters.search ? { search: filters.search } : {}),
            },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const submitCompany = (e) => {
        e.preventDefault();
        if (!selected) {
            return;
        }
        companyForm.patch(route('settings.client.update', selected.id), {
            preserveScroll: true,
        });
    };

    const submitNewClient = (e) => {
        e.preventDefault();
        addClientForm.post(route('settings.client.store'), {
            onSuccess: () => {
                addClientForm.reset();
                setShowAddClient(false);
            },
        });
    };

    const submitNewContact = (e) => {
        e.preventDefault();
        if (!selected) {
            return;
        }
        addContactForm.post(
            route('settings.client.contacts.store', selected.id),
            {
                preserveScroll: true,
                onSuccess: () => addContactForm.setData({ ...emptyContact }),
            },
        );
    };

    const confirmArchive = () => {
        if (!archiveTarget) {
            return;
        }
        router.delete(route('settings.client.destroy', archiveTarget.id), {
            onFinish: () => setArchiveTarget(null),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-slate-800 dark:text-slate-100">
                            Client list
                        </h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Companies and contact persons for encode project.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            href={route('settings.client.archive')}
                            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                            <ArchiveBoxArrowDownIcon
                                className="h-4 w-4 shrink-0"
                                aria-hidden
                            />
                            Archive
                        </Link>
                        <button
                            type="button"
                            onClick={() => setShowAddClient(true)}
                            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-sky-600 px-4 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600"
                        >
                            <PlusIcon
                                className="h-4 w-4 shrink-0"
                                aria-hidden
                            />
                            Add client
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Client list" />
            <FlashNoticeModal messages={FLASH_MESSAGES} />

            <div className="grid gap-6 lg:grid-cols-12">
                <aside className="lg:col-span-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                        <div className="relative mb-3">
                            <MagnifyingGlassIcon
                                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                                aria-hidden
                            />
                            <TextInput
                                value={sidebarSearch}
                                onChange={(e) =>
                                    setSidebarSearch(e.target.value)
                                }
                                placeholder="Search clients…"
                                className="w-full !pl-9"
                            />
                        </div>
                        <ul className="max-h-[70vh] space-y-1 overflow-y-auto pr-1">
                            {filteredClients.length === 0 ? (
                                <li className="px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                                    No clients yet.
                                </li>
                            ) : (
                                filteredClients.map((client) => {
                                    const active =
                                        selected?.id === client.id;
                                    return (
                                        <li key={client.id}>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    selectClient(client.id)
                                                }
                                                className={
                                                    'flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition ' +
                                                    (active
                                                        ? 'bg-sky-50 font-semibold text-sky-800 dark:bg-sky-500/10 dark:text-sky-300'
                                                        : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800')
                                                }
                                            >
                                                <span className="min-w-0 truncate">
                                                    {client.name}
                                                </span>
                                                {client.is_default ? (
                                                    <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-800 dark:bg-amber-500/20 dark:text-amber-200">
                                                        Default
                                                    </span>
                                                ) : null}
                                            </button>
                                        </li>
                                    );
                                })
                            )}
                        </ul>
                    </div>
                </aside>

                <div className="min-w-0 space-y-5 lg:col-span-9">
                    {!selected ? (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-600 dark:bg-slate-900">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Select a client or add a new one to manage
                                company and contacts.
                            </p>
                        </div>
                    ) : (
                        <>
                            <SectionCard
                                title="Company information"
                                badge={
                                    selected.is_default ? (
                                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-500/20 dark:text-amber-200">
                                            Default
                                        </span>
                                    ) : null
                                }
                                actions={
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setArchiveTarget(selected)
                                        }
                                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800 dark:hover:text-rose-400"
                                    >
                                        <ArchiveBoxArrowDownIcon className="h-4 w-4" />
                                        Archive
                                    </button>
                                }
                            >
                                <form
                                    onSubmit={submitCompany}
                                    className="space-y-4"
                                >
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div className="sm:col-span-2">
                                            <InputLabel
                                                htmlFor="company-name"
                                                value="Company name"
                                            />
                                            <TextInput
                                                id="company-name"
                                                className="mt-1 block w-full"
                                                value={companyForm.data.name}
                                                onChange={(e) =>
                                                    companyForm.setData(
                                                        'name',
                                                        e.target.value,
                                                    )
                                                }
                                                required
                                            />
                                            <InputError
                                                className="mt-1"
                                                message={
                                                    companyForm.errors.name
                                                }
                                            />
                                        </div>
                                        <div>
                                            <InputLabel
                                                htmlFor="company-abn"
                                                value="ABN number"
                                            />
                                            <TextInput
                                                id="company-abn"
                                                className="mt-1 block w-full"
                                                value={companyForm.data.abn}
                                                onChange={(e) =>
                                                    companyForm.setData(
                                                        'abn',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div>
                                            <InputLabel
                                                htmlFor="company-phone"
                                                value="Office phone"
                                            />
                                            <TextInput
                                                id="company-phone"
                                                className="mt-1 block w-full"
                                                value={
                                                    companyForm.data
                                                        .office_phone
                                                }
                                                onChange={(e) =>
                                                    companyForm.setData(
                                                        'office_phone',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <InputLabel
                                                htmlFor="company-website"
                                                value="Website"
                                            />
                                            <TextInput
                                                id="company-website"
                                                className="mt-1 block w-full"
                                                value={
                                                    companyForm.data.website
                                                }
                                                onChange={(e) =>
                                                    companyForm.setData(
                                                        'website',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <InputLabel
                                                htmlFor="company-address"
                                                value="Address"
                                            />
                                            <TextInput
                                                id="company-address"
                                                className="mt-1 block w-full"
                                                value={
                                                    companyForm.data.address
                                                }
                                                onChange={(e) =>
                                                    companyForm.setData(
                                                        'address',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div>
                                            <InputLabel
                                                htmlFor="company-city"
                                                value="City"
                                            />
                                            <TextInput
                                                id="company-city"
                                                className="mt-1 block w-full"
                                                value={companyForm.data.city}
                                                onChange={(e) =>
                                                    companyForm.setData(
                                                        'city',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div>
                                            <InputLabel
                                                htmlFor="company-state"
                                                value="State"
                                            />
                                            <TextInput
                                                id="company-state"
                                                className="mt-1 block w-full"
                                                value={companyForm.data.state}
                                                onChange={(e) =>
                                                    companyForm.setData(
                                                        'state',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div>
                                            <InputLabel
                                                htmlFor="company-post"
                                                value="Post code"
                                            />
                                            <TextInput
                                                id="company-post"
                                                className="mt-1 block w-full"
                                                value={
                                                    companyForm.data.post_code
                                                }
                                                onChange={(e) =>
                                                    companyForm.setData(
                                                        'post_code',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div>
                                            <InputLabel
                                                htmlFor="company-country"
                                                value="Country"
                                            />
                                            <TextInput
                                                id="company-country"
                                                className="mt-1 block w-full"
                                                value={
                                                    companyForm.data.country
                                                }
                                                onChange={(e) =>
                                                    companyForm.setData(
                                                        'country',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div>
                                            <InputLabel
                                                htmlFor="company-status"
                                                value="Status"
                                            />
                                            <select
                                                id="company-status"
                                                className="mt-1 block w-full rounded-md border-slate-300 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                                value={companyForm.data.status}
                                                onChange={(e) =>
                                                    companyForm.setData(
                                                        'status',
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                <option value="active">
                                                    Active
                                                </option>
                                                <option value="inactive">
                                                    Inactive
                                                </option>
                                                <option value="prospect">
                                                    Prospect
                                                </option>
                                            </select>
                                        </div>
                                        <div className="flex items-end">
                                            <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                                    checked={
                                                        companyForm.data
                                                            .is_default
                                                    }
                                                    onChange={(e) =>
                                                        companyForm.setData(
                                                            'is_default',
                                                            e.target.checked,
                                                        )
                                                    }
                                                />
                                                Set as default client
                                            </label>
                                        </div>
                                    </div>
                                    <PrimaryButton
                                        loading={companyForm.processing}
                                    >
                                        Save company
                                    </PrimaryButton>
                                </form>
                            </SectionCard>

                            <SectionCard title="Main contact person">
                                <ContactEditor
                                    clientId={selected.id}
                                    contact={selected.main_contact}
                                    title="Main"
                                />
                            </SectionCard>

                            <SectionCard title="Account contact person">
                                <ContactEditor
                                    clientId={selected.id}
                                    contact={selected.account_contact}
                                    title="Account"
                                />
                            </SectionCard>

                            <SectionCard
                                title="Additional contact person"
                                badge={
                                    <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                                        Unlimited
                                    </span>
                                }
                            >
                                <div className="space-y-6">
                                    {(selected.additional_contacts ?? []).map(
                                        (contact) => (
                                            <div
                                                key={contact.id}
                                                className="border-t border-slate-100 pt-5 first:border-t-0 first:pt-0 dark:border-slate-800"
                                            >
                                                <ContactEditor
                                                    clientId={selected.id}
                                                    contact={contact}
                                                    canDelete
                                                />
                                            </div>
                                        ),
                                    )}

                                    <form
                                        onSubmit={submitNewContact}
                                        className="space-y-4 rounded-lg border border-dashed border-slate-300 p-4 dark:border-slate-600"
                                    >
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                            Add contact
                                        </p>
                                        <ContactFields
                                            form={addContactForm}
                                            idPrefix="new-contact"
                                        />
                                        <PrimaryButton
                                            loading={
                                                addContactForm.processing
                                            }
                                        >
                                            <PlusIcon
                                                className="mr-1 h-4 w-4"
                                                aria-hidden
                                            />
                                            Add contact
                                        </PrimaryButton>
                                    </form>
                                </div>
                            </SectionCard>
                        </>
                    )}
                </div>
            </div>

            <Modal
                show={showAddClient}
                onClose={() => setShowAddClient(false)}
                maxWidth="md"
            >
                <form onSubmit={submitNewClient} className="p-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Add client
                    </h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Creates a company with empty Main and Account contact
                        slots.
                    </p>
                    <div className="mt-4">
                        <InputLabel htmlFor="new-client-name" value="Company name" />
                        <TextInput
                            id="new-client-name"
                            className="mt-1 block w-full"
                            value={addClientForm.data.name}
                            onChange={(e) =>
                                addClientForm.setData('name', e.target.value)
                            }
                            required
                            autoFocus
                        />
                        <InputError
                            className="mt-1"
                            message={addClientForm.errors.name}
                        />
                    </div>
                    <div className="mt-4">
                        <InputLabel htmlFor="new-client-status" value="Status" />
                        <select
                            id="new-client-status"
                            className="mt-1 block w-full rounded-md border-slate-300 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                            value={addClientForm.data.status}
                            onChange={(e) =>
                                addClientForm.setData('status', e.target.value)
                            }
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="prospect">Prospect</option>
                        </select>
                        <InputError
                            className="mt-1"
                            message={addClientForm.errors.status}
                        />
                    </div>
                    <div className="mt-6 flex justify-end gap-2">
                        <SecondaryButton
                            type="button"
                            onClick={() => setShowAddClient(false)}
                        >
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton loading={addClientForm.processing}>
                            Create
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            <Modal
                show={archiveTarget != null}
                onClose={() => setArchiveTarget(null)}
            >
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Archive client?
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                        <strong>{archiveTarget?.name}</strong> will be hidden
                        from the encode project client list.
                    </p>
                    <div className="mt-6 flex justify-end gap-2">
                        <SecondaryButton
                            type="button"
                            onClick={() => setArchiveTarget(null)}
                        >
                            Cancel
                        </SecondaryButton>
                        <DangerButton type="button" onClick={confirmArchive}>
                            Archive
                        </DangerButton>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
