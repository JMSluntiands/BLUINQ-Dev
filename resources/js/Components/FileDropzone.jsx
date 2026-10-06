import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { useEffect, useRef, useState } from 'react';

function fileMatchesAccept(file, accept) {
    if (!accept) {
        return true;
    }

    const rules = accept
        .split(',')
        .map((rule) => rule.trim().toLowerCase())
        .filter(Boolean);

    if (rules.length === 0) {
        return true;
    }

    const name = file.name.toLowerCase();
    const type = (file.type || '').toLowerCase();

    return rules.some((rule) => {
        if (rule.endsWith('/*')) {
            return type.startsWith(rule.slice(0, -1));
        }

        if (rule.startsWith('.')) {
            return name.endsWith(rule);
        }

        return type === rule;
    });
}

function selectedFiles(value) {
    if (!value) {
        return [];
    }

    return (Array.isArray(value) ? value : [value]).filter(Boolean);
}

export default function FileDropzone({
    id,
    accept,
    multiple = false,
    required = false,
    disabled = false,
    value = null,
    onChange,
    className = '',
}) {
    const inputRef = useRef(null);
    const [dragActive, setDragActive] = useState(false);
    const [rejectMessage, setRejectMessage] = useState('');
    const files = selectedFiles(value);

    useEffect(() => {
        if (files.length === 0 && inputRef.current) {
            inputRef.current.value = '';
        }
    }, [files.length]);

    const applyFiles = (fileList, { syncInput = false } = {}) => {
        const incoming = Array.from(fileList ?? []);
        const accepted = incoming.filter((file) =>
            fileMatchesAccept(file, accept),
        );

        if (incoming.length > 0 && accepted.length === 0) {
            setRejectMessage('That file type is not allowed.');
            return;
        }

        const next = multiple ? accepted : accepted.slice(0, 1);
        setRejectMessage('');

        if (syncInput && inputRef.current) {
            const transfer = new DataTransfer();
            next.forEach((file) => transfer.items.add(file));
            inputRef.current.files = transfer.files;
        }

        onChange?.(multiple ? next : (next[0] ?? null));
    };

    const onDragEnter = (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!disabled) {
            setDragActive(true);
        }
    };

    const onDragOver = (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!disabled) {
            setDragActive(true);
        }
    };

    const onDragLeave = (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (event.currentTarget.contains(event.relatedTarget)) {
            return;
        }
        setDragActive(false);
    };

    const onDrop = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setDragActive(false);
        if (disabled) {
            return;
        }
        applyFiles(event.dataTransfer.files, { syncInput: true });
    };

    return (
        <div className={className}>
            <div
                onDragEnter={onDragEnter}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={
                    'rounded-xl border-2 border-dashed px-4 py-6 text-center transition ' +
                    (disabled
                        ? 'pointer-events-none border-[#c5c7d0] bg-[#fafbfc] opacity-60 dark:border-slate-600 dark:bg-slate-800 '
                        : dragActive
                          ? 'border-[#0073ea] bg-[#e8f4ff] dark:border-sky-400 dark:bg-sky-500/10 '
                          : 'border-[#c5c7d0] bg-[#fafbfc] hover:border-[#0073ea] hover:bg-[#f4f9ff] dark:border-slate-600 dark:bg-slate-800 dark:hover:border-sky-400 dark:hover:bg-slate-700/80 ')
                }
            >
                <label
                    htmlFor={id}
                    className="flex cursor-pointer flex-col items-center justify-center"
                >
                    <ArrowUpTrayIcon
                        className="mb-2 h-8 w-8 text-[#676879] dark:text-slate-400"
                        aria-hidden
                    />
                    <span className="text-sm text-[#323338] dark:text-slate-200">
                        <span className="font-semibold text-[#0073ea] dark:text-sky-400">
                            Browse
                        </span>{' '}
                        or drag and drop
                        {multiple ? ' files' : ' a file'} here
                    </span>
                    <span className="mt-1 max-w-full truncate text-xs text-[#676879] dark:text-slate-400">
                        {files.length > 0
                            ? files.map((file) => file.name).join(', ')
                            : 'No files selected.'}
                    </span>
                    <input
                        ref={inputRef}
                        id={id}
                        type="file"
                        accept={accept}
                        multiple={multiple}
                        required={required}
                        disabled={disabled}
                        className="sr-only"
                        onChange={(event) => applyFiles(event.target.files)}
                    />
                </label>
            </div>
            {rejectMessage ? (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {rejectMessage}
                </p>
            ) : null}
        </div>
    );
}
