import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

function isImageMime(mimeType) {
    return (mimeType ?? '').startsWith('image/');
}

function isPdfMime(mimeType, filename) {
    if ((mimeType ?? '') === 'application/pdf') {
        return true;
    }

    return (filename ?? '').toLowerCase().endsWith('.pdf');
}

function canPreviewInline(file) {
    if (!file?.view_url) {
        return false;
    }

    return (
        isImageMime(file.mime_type) ||
        isPdfMime(file.mime_type, file.original_name)
    );
}

export default function DraftingFileViewModal({ file, show, onClose }) {
    const previewable = file ? canPreviewInline(file) : false;

    return (
        <Modal show={show} onClose={onClose} maxWidth="6xl">
            <div className="flex max-h-[90vh] flex-col">
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-700">
                    <div className="min-w-0">
                        <h2 className="truncate text-lg font-semibold text-slate-800 dark:text-white">
                            {file?.original_name ?? 'File preview'}
                        </h2>
                        {file?.size_label ? (
                            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                                {file.size_label}
                            </p>
                        ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        {file?.download_url ? (
                            <a
                                href={file.download_url}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                            >
                                <ArrowDownTrayIcon
                                    className="h-4 w-4"
                                    aria-hidden
                                />
                                Download
                            </a>
                        ) : null}
                        <SecondaryButton
                            type="button"
                            onClick={onClose}
                            className="rounded-lg normal-case tracking-normal"
                        >
                            Close
                        </SecondaryButton>
                    </div>
                </div>

                <div className="min-h-[20rem] flex-1 overflow-auto bg-slate-100 p-4 dark:bg-slate-950/60">
                    {!file ? null : previewable ? (
                        isImageMime(file.mime_type) ? (
                            <div className="flex min-h-[18rem] items-center justify-center">
                                <img
                                    src={file.view_url}
                                    alt={file.original_name}
                                    className="max-h-[70vh] max-w-full rounded-lg object-contain shadow-sm"
                                />
                            </div>
                        ) : (
                            <iframe
                                title={file.original_name}
                                src={file.view_url}
                                className="h-[70vh] w-full rounded-lg border border-slate-200 bg-white dark:border-slate-700"
                            />
                        )
                    ) : (
                        <div className="flex min-h-[18rem] flex-col items-center justify-center text-center">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                Preview is not available for this file type.
                            </p>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Use download to open it on your device.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
