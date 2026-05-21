import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import {
    ArrowDownTrayIcon,
    DocumentTextIcon,
    EyeIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';
import { router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const PANEL_META = {
    facade: {
        title: 'Edit facade / plans',
        description: 'Replace or remove the facade file for this request.',
    },
    documents: {
        title: 'Edit documents',
        description: 'Add or remove document uploads for this request.',
    },
    team: {
        title: 'Edit team uploads',
        description: 'Add or remove internal team files for this request.',
    },
};

function RemoveFileModal({ file, show, onClose, onConfirm, processing }) {
    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <div className="p-6">
                <h2 className="text-lg font-semibold text-[#323338]">
                    Remove file?
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[#676879]">
                    <span className="font-medium text-[#323338]">
                        {file?.original_name}
                    </span>{' '}
                    will be permanently removed from this drafting request.
                </p>
                <div className="mt-6 flex flex-wrap justify-end gap-2">
                    <SecondaryButton
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        className="rounded-lg normal-case tracking-normal"
                    >
                        Cancel
                    </SecondaryButton>
                    <DangerButton
                        type="button"
                        onClick={onConfirm}
                        disabled={processing}
                        className="rounded-lg normal-case tracking-normal"
                    >
                        Remove
                    </DangerButton>
                </div>
            </div>
        </Modal>
    );
}

function FileRow({ file, onRequestDelete, deleting }) {
    return (
        <li className="flex items-center justify-between gap-2 rounded-lg border border-[#e6e9ef] bg-[#fafbfc] px-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
                <DocumentTextIcon
                    className="h-5 w-5 shrink-0 text-[#676879]"
                    aria-hidden
                />
                <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#323338]">
                        {file.original_name}
                    </p>
                    <p className="text-xs text-[#676879]">{file.size_label}</p>
                </div>
            </div>
            <div className="flex shrink-0 gap-1">
                <a
                    href={file.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#676879] transition hover:bg-[#e6e9ef] hover:text-[#0073ea]"
                    title="View"
                >
                    <EyeIcon className="h-4 w-4" />
                </a>
                <a
                    href={file.download_url}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#676879] transition hover:bg-[#e6e9ef] hover:text-[#0073ea]"
                    title="Download"
                >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                </a>
                <button
                    type="button"
                    onClick={() => onRequestDelete(file)}
                    disabled={deleting}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#676879] transition hover:bg-red-50 hover:text-[#e44258] disabled:opacity-50"
                    title="Remove"
                >
                    <TrashIcon className="h-4 w-4" />
                </button>
            </div>
        </li>
    );
}

function UploadField({ id, label, hint, multiple, accept, onChange, error }) {
    return (
        <div>
            <InputLabel htmlFor={id} value={label} />
            {hint ? (
                <p className="mt-0.5 text-xs text-[#676879]">{hint}</p>
            ) : null}
            <input
                id={id}
                type="file"
                multiple={multiple}
                accept={accept}
                onChange={onChange}
                className="mt-2 block w-full text-sm text-[#323338] file:mr-3 file:rounded-md file:border-0 file:bg-[#0073ea] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[#0060c4]"
            />
            <InputError className="mt-2" message={error} />
        </div>
    );
}

function FacadeSection({ files, form, onRequestDelete, deleting }) {
    return (
        <>
            {files.length > 0 ? (
                <ul className="space-y-2">
                    {files.map((file) => (
                        <FileRow
                            key={file.id}
                            file={file}
                            onRequestDelete={onRequestDelete}
                            deleting={deleting}
                        />
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-[#676879]">No facade file yet.</p>
            )}
            <div className={files.length > 0 ? 'mt-4' : 'mt-2'}>
                <UploadField
                    id="edit-facade"
                    label="Replace or add facade"
                    hint="Uploading replaces any existing facade file."
                    accept="image/*,.pdf"
                    onChange={(e) =>
                        form.setData('facade', e.target.files?.[0] ?? null)
                    }
                    error={form.errors.facade}
                />
            </div>
        </>
    );
}

function DocumentsSection({ files, form, onRequestDelete, deleting }) {
    return (
        <>
            {files.length > 0 ? (
                <ul className="space-y-2">
                    {files.map((file) => (
                        <FileRow
                            key={file.id}
                            file={file}
                            onRequestDelete={onRequestDelete}
                            deleting={deleting}
                        />
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-[#676879]">No documents yet.</p>
            )}
            <div className={files.length > 0 ? 'mt-4' : 'mt-2'}>
                <UploadField
                    id="edit-documents"
                    label="Add documents"
                    multiple
                    onChange={(e) =>
                        form.setData(
                            'documents',
                            Array.from(e.target.files ?? []),
                        )
                    }
                    error={
                        form.errors.documents ?? form.errors['documents.0']
                    }
                />
            </div>
        </>
    );
}

function TeamSection({ files, form, onRequestDelete, deleting }) {
    return (
        <>
            {files.length > 0 ? (
                <ul className="space-y-2">
                    {files.map((file) => (
                        <FileRow
                            key={file.id}
                            file={file}
                            onRequestDelete={onRequestDelete}
                            deleting={deleting}
                        />
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-[#676879]">No team uploads yet.</p>
            )}
            <div className={files.length > 0 ? 'mt-4' : 'mt-2'}>
                <UploadField
                    id="edit-team-files"
                    label="Add team files"
                    multiple
                    onChange={(e) =>
                        form.setData(
                            'team_files',
                            Array.from(e.target.files ?? []),
                        )
                    }
                    error={
                        form.errors.team_files ?? form.errors['team_files.0']
                    }
                />
            </div>
        </>
    );
}

export default function DraftingFilesEditModal({
    panel,
    onClose,
    draftingRequestId,
    facadeFiles = [],
    documentFiles = [],
    teamFiles = [],
    listUrl,
}) {
    const form = useForm({
        facade: null,
        documents: [],
        team_files: [],
    });

    const meta = panel ? PANEL_META[panel] : null;
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (panel == null) {
            setDeleteTarget(null);
        }
    }, [panel]);

    const submit = (e) => {
        e.preventDefault();
        form.post(route('job.drafting.files.store', draftingRequestId) + listUrl, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                onClose();
                router.reload({ only: ['draftingRequest'], preserveScroll: true });
            },
        });
    };

    const confirmDelete = () => {
        if (!deleteTarget) {
            return;
        }

        setDeleting(true);
        router.delete(
            route('job.drafting.files.destroy', [
                draftingRequestId,
                deleteTarget.id,
            ]) + listUrl,
            {
                preserveScroll: true,
                onSuccess: () => {
                    setDeleteTarget(null);
                    router.reload({
                        only: ['draftingRequest'],
                        preserveScroll: true,
                    });
                },
                onFinish: () => setDeleting(false),
            },
        );
    };

    const isBusy = form.processing || deleting;

    const panelContent =
        panel === 'facade' ? (
            <FacadeSection
                files={facadeFiles}
                form={form}
                onRequestDelete={setDeleteTarget}
                deleting={isBusy}
            />
        ) : panel === 'documents' ? (
            <DocumentsSection
                files={documentFiles}
                form={form}
                onRequestDelete={setDeleteTarget}
                deleting={isBusy}
            />
        ) : panel === 'team' ? (
            <TeamSection
                files={teamFiles}
                form={form}
                onRequestDelete={setDeleteTarget}
                deleting={isBusy}
            />
        ) : null;

    return (
        <>
            <Modal
                show={panel != null}
                onClose={onClose}
                maxWidth="lg"
                closeable={deleteTarget == null}
            >
            <form onSubmit={submit} className="p-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold text-[#323338]">
                            {meta?.title}
                        </h2>
                        <p className="mt-1 text-sm text-[#676879]">
                            {meta?.description}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={deleteTarget != null || isBusy}
                        className="text-sm font-medium text-[#676879] hover:text-[#323338] disabled:opacity-50"
                    >
                        Close
                    </button>
                </div>

                <div className="mt-6">{panelContent}</div>

                <div className="mt-6 flex flex-wrap justify-end gap-2">
                    <SecondaryButton
                        type="button"
                        onClick={onClose}
                        disabled={deleteTarget != null || isBusy}
                        className="rounded-lg normal-case tracking-normal"
                    >
                        Cancel
                    </SecondaryButton>
                    <PrimaryButton
                        loading={form.processing}
                        disabled={isBusy}
                        className="rounded-lg normal-case tracking-normal !bg-[#0073ea] hover:!bg-[#0060c4]"
                    >
                        Upload selected
                    </PrimaryButton>
                </div>
            </form>
            </Modal>

            <RemoveFileModal
                file={deleteTarget}
                show={deleteTarget != null}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                processing={deleting}
            />
        </>
    );
}
