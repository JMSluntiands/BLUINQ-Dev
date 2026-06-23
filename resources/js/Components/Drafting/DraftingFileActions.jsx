import DraftingFileViewModal from '@/Components/Drafting/DraftingFileViewModal';
import {
    ArrowDownTrayIcon,
    EyeIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';

const actionBtnClass =
    'inline-flex h-8 w-8 items-center justify-center rounded-md text-[#676879] transition hover:bg-[#e6e9ef] hover:text-[#0073ea] dark:text-slate-400 dark:hover:bg-[#243044] dark:hover:text-[#60a5fa]';

export default function DraftingFileActions({
    file,
    onRequestDelete = null,
    deleting = false,
}) {
    const [viewOpen, setViewOpen] = useState(false);

    return (
        <>
            <div className="flex shrink-0 gap-1">
                <button
                    type="button"
                    onClick={() => setViewOpen(true)}
                    className={actionBtnClass}
                    title="View"
                    aria-label={`View ${file.original_name}`}
                >
                    <EyeIcon className="h-4 w-4" />
                </button>
                <a
                    href={file.download_url}
                    className={actionBtnClass}
                    title="Download"
                    aria-label={`Download ${file.original_name}`}
                >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                </a>
                {onRequestDelete ? (
                    <button
                        type="button"
                        onClick={() => onRequestDelete(file)}
                        disabled={deleting}
                        className={
                            actionBtnClass +
                            ' hover:bg-red-50 hover:text-[#e44258] disabled:opacity-50 dark:hover:bg-red-500/10'
                        }
                        title="Remove"
                        aria-label={`Remove ${file.original_name}`}
                    >
                        <TrashIcon className="h-4 w-4" />
                    </button>
                ) : null}
            </div>

            <DraftingFileViewModal
                file={file}
                show={viewOpen}
                onClose={() => setViewOpen(false)}
            />
        </>
    );
}
