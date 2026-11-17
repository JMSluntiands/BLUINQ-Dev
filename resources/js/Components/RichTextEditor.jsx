import UploadProgressBar from '@/Components/UploadProgressBar';
import { useCallback, useEffect, useRef, useState } from 'react';

const TOOLBAR_BUTTONS = [
    { command: 'bold', label: 'B', title: 'Bold', className: 'font-bold' },
    { command: 'italic', label: 'I', title: 'Italic', className: 'italic' },
    { command: 'underline', label: 'U', title: 'Underline', className: 'underline' },
    { command: 'insertUnorderedList', label: '•', title: 'Bullet list' },
    { command: 'insertOrderedList', label: '1.', title: 'Numbered list' },
];

const LINK_COMMAND = 'createLink';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function dragHasFiles(event) {
    const types = Array.from(event.dataTransfer?.types ?? []);

    return (
        types.includes('Files') || types.includes('application/x-moz-file')
    );
}

function isImageFile(file) {
    if (!file) {
        return false;
    }

    if (file.type?.startsWith('image/')) {
        return true;
    }

    return /\.(png|jpe?g|gif|webp|bmp)$/i.test(file.name ?? '');
}

function pointerIsOver(element, event) {
    if (!element) {
        return false;
    }

    const rect = element.getBoundingClientRect();

    return (
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom
    );
}

const PASTE_ALLOWED_TAGS = new Set([
    'P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'UL', 'OL', 'LI', 'A', 'H2',
    'H3', 'BLOCKQUOTE', 'IMG',
]);
const PASTE_BLOCK_AS_PARAGRAPH = new Set([
    'DIV', 'TR', 'H1', 'H4', 'H5', 'H6', 'SECTION', 'ARTICLE', 'HEADER',
    'FOOTER', 'PRE', 'TABLE',
]);
const PASTE_NESTED_BLOCK_SELECTOR =
    'p, div, ul, ol, table, tr, blockquote, h1, h2, h3, h4, h5, h6, section, article';
const PASTE_DROPPED_TAGS = new Set([
    'SCRIPT', 'STYLE', 'META', 'LINK', 'TITLE', 'HEAD', 'IFRAME', 'OBJECT',
    'EMBED', 'SVG', 'XML',
]);

function isUsableImageSrc(src) {
    return /^(https?:)?\/|^data:image\/(png|jpe?g|gif|webp);base64,/i.test(
        src ?? '',
    );
}

function dataUrlToFile(dataUrl) {
    const [header, base64] = dataUrl.split(',');
    const mime = header.match(/^data:([^;]+)/)?.[1] ?? 'image/png';
    const bytes = atob(base64);
    const buffer = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i += 1) {
        buffer[i] = bytes.charCodeAt(i);
    }

    return new File([buffer], `pasted.${mime.split('/')[1] || 'png'}`, {
        type: mime,
    });
}

/**
 * Keeps only comment-safe markup from pasted HTML (Word, Outlook, browsers).
 */
function sanitizePastedHtml(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');

    const clean = (node, target) => {
        node.childNodes.forEach((child) => {
            if (child.nodeType === Node.TEXT_NODE) {
                target.appendChild(document.createTextNode(child.textContent));
                return;
            }

            if (child.nodeType !== Node.ELEMENT_NODE) {
                return;
            }

            const tag = child.tagName.toUpperCase();
            if (PASTE_DROPPED_TAGS.has(tag)) {
                return;
            }

            if (PASTE_BLOCK_AS_PARAGRAPH.has(tag)) {
                if (child.querySelector(PASTE_NESTED_BLOCK_SELECTOR)) {
                    clean(child, target);
                    return;
                }
                const paragraph = document.createElement('p');
                clean(child, paragraph);
                target.appendChild(paragraph);
                return;
            }

            if (!PASTE_ALLOWED_TAGS.has(tag)) {
                clean(child, target);
                if (tag === 'TD' || tag === 'TH') {
                    target.appendChild(document.createTextNode(' '));
                }
                return;
            }

            const el = document.createElement(tag);
            if (tag === 'A') {
                const href = child.getAttribute('href') ?? '';
                if (/^(https?:|mailto:)/i.test(href)) {
                    el.setAttribute('href', href);
                }
            }
            if (tag === 'IMG') {
                el.setAttribute('src', child.getAttribute('src') ?? '');
                el.setAttribute('alt', child.getAttribute('alt') || 'Image');
            }
            clean(child, el);
            target.appendChild(el);
        });
    };

    const fragment = document.createDocumentFragment();
    clean(doc.body, fragment);

    return fragment;
}

function exec(command, value = null) {
    document.execCommand(command, false, value);
}

function htmlIsEmpty(html) {
    if (!html || html === '<br>') {
        return true;
    }

    if (/<img\b/i.test(html)) {
        return false;
    }

    return html.replace(/<[^>]*>/g, '').trim() === '';
}

function toolbarButtonClass(isActive) {
    const base =
        'min-w-[2rem] rounded px-2 py-1 text-sm transition disabled:opacity-50';

    if (isActive) {
        return [
            base,
            'bg-[#cce5ff] font-semibold text-[#0073ea] ring-1 ring-[#0073ea]/25',
            'dark:bg-[#2563eb]/30 dark:text-[#60a5fa] dark:ring-[#60a5fa]/30',
        ].join(' ');
    }

    return [
        base,
        'text-[#323338] hover:bg-[#e6e9ef]',
        'dark:text-slate-300 dark:hover:bg-[#243044]',
    ].join(' ');
}

export default function RichTextEditor({
    id,
    value = '',
    onChange,
    placeholder = 'Write a comment…',
    disabled = false,
    allowImages = false,
    uploadImage = null,
    className = '',
}) {
    const editorRef = useRef(null);
    const dropZoneRef = useRef(null);
    const imageInputRef = useRef(null);
    const isInternalChange = useRef(false);
    const [activeCommands, setActiveCommands] = useState({});
    const [showPlaceholder, setShowPlaceholder] = useState(true);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [imageDragActive, setImageDragActive] = useState(false);

    const updateActiveState = useCallback(() => {
        if (!editorRef.current || disabled) {
            return;
        }

        const selection = document.getSelection();
        if (
            selection &&
            selection.rangeCount > 0 &&
            !editorRef.current.contains(selection.anchorNode)
        ) {
            return;
        }

        const states = {};
        for (const btn of TOOLBAR_BUTTONS) {
            try {
                states[btn.command] = document.queryCommandState(btn.command);
            } catch {
                states[btn.command] = false;
            }
        }

        try {
            states[LINK_COMMAND] = document.queryCommandState(LINK_COMMAND);
        } catch {
            states[LINK_COMMAND] = false;
        }

        setActiveCommands(states);
    }, [disabled]);

    const syncValue = useCallback(() => {
        if (!editorRef.current || !onChange) {
            return;
        }
        const html = editorRef.current.innerHTML;
        isInternalChange.current = true;
        setShowPlaceholder(htmlIsEmpty(html));
        onChange(html);
        updateActiveState();
    }, [onChange, updateActiveState]);

    useEffect(() => {
        if (!editorRef.current) {
            return;
        }

        if (htmlIsEmpty(value)) {
            if (!htmlIsEmpty(editorRef.current.innerHTML)) {
                editorRef.current.innerHTML = '';
            }
            setShowPlaceholder(true);
            isInternalChange.current = false;
            return;
        }

        setShowPlaceholder(false);

        if (isInternalChange.current) {
            isInternalChange.current = false;
            return;
        }

        if (editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value;
        }
    }, [value]);

    useEffect(() => {
        document.addEventListener('selectionchange', updateActiveState);
        return () =>
            document.removeEventListener('selectionchange', updateActiveState);
    }, [updateActiveState]);

    const handleLink = () => {
        const url = window.prompt('Enter link URL');
        if (!url) {
            return;
        }
        exec(LINK_COMMAND, url);
        syncValue();
        editorRef.current?.focus();
    };

    const insertImageAtCursor = useCallback(
        (src) => {
            if (!editorRef.current || !src) {
                return;
            }

            editorRef.current.focus();

            const img = document.createElement('img');
            img.src = src;
            img.alt = 'Image';

            const selection = document.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                if (editorRef.current.contains(range.commonAncestorContainer)) {
                    range.deleteContents();
                    range.insertNode(img);
                    range.setStartAfter(img);
                    range.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(range);
                    syncValue();
                    return;
                }
            }

            editorRef.current.appendChild(img);
            syncValue();
        },
        [syncValue],
    );

    const activeUploads = useRef(0);

    /** Resolves to a usable src for the file (uploaded URL or data URL), or null. */
    const resolveImageSrc = useCallback(
        (file) => {
            if (!isImageFile(file)) {
                return Promise.resolve(null);
            }

            if (file.size > MAX_IMAGE_BYTES) {
                window.alert('Image is too large. Maximum size is 5 MB.');
                return Promise.resolve(null);
            }

            if (typeof uploadImage === 'function') {
                activeUploads.current += 1;
                setUploadingImage(true);
                setUploadProgress(0);

                return Promise.resolve(
                    uploadImage(file, (percent) => {
                        setUploadProgress(percent);
                    }),
                )
                    .then((url) => {
                        if (typeof url === 'string' && url.trim() !== '') {
                            return url.trim();
                        }
                        window.alert('Failed to upload image.');
                        return null;
                    })
                    .catch(() => {
                        window.alert('Failed to upload image.');
                        return null;
                    })
                    .finally(() => {
                        activeUploads.current -= 1;
                        if (activeUploads.current === 0) {
                            setUploadingImage(false);
                            setUploadProgress(0);
                        }
                    });
            }

            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () =>
                    resolve(
                        typeof reader.result === 'string' ? reader.result : null,
                    );
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(file);
            });
        },
        [uploadImage],
    );

    const insertImageFile = useCallback(
        (file) =>
            resolveImageSrc(file).then((src) => {
                if (src) {
                    insertImageAtCursor(src);
                }
            }),
        [insertImageAtCursor, resolveImageSrc],
    );

    const insertNodeAtCursor = useCallback((node) => {
        const editor = editorRef.current;
        editor.focus();

        const selection = document.getSelection();
        const range =
            selection && selection.rangeCount > 0
                ? selection.getRangeAt(0)
                : null;

        if (!range || !editor.contains(range.commonAncestorContainer)) {
            editor.appendChild(node);
            return;
        }

        const last = node.lastChild;
        range.deleteContents();
        range.insertNode(node);
        if (last) {
            range.setStartAfter(last);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }, []);

    useEffect(() => {
        if (!allowImages || disabled) {
            return undefined;
        }

        const onDragOver = (event) => {
            if (!dragHasFiles(event) || !pointerIsOver(dropZoneRef.current, event)) {
                setImageDragActive(false);
                return;
            }

            event.preventDefault();
            if (event.dataTransfer) {
                event.dataTransfer.dropEffect = 'copy';
            }
            setImageDragActive(true);
        };

        const onDrop = (event) => {
            if (!pointerIsOver(dropZoneRef.current, event)) {
                return;
            }

            event.preventDefault();
            setImageDragActive(false);

            const files = Array.from(event.dataTransfer?.files ?? []).filter(
                isImageFile,
            );

            files.reduce(
                (chain, file) => chain.then(() => insertImageFile(file)),
                Promise.resolve(),
            );
        };

        const onDragEnd = () => setImageDragActive(false);

        window.addEventListener('dragover', onDragOver, true);
        window.addEventListener('drop', onDrop, true);
        window.addEventListener('dragend', onDragEnd, true);

        return () => {
            window.removeEventListener('dragover', onDragOver, true);
            window.removeEventListener('drop', onDrop, true);
            window.removeEventListener('dragend', onDragEnd, true);
        };
    }, [allowImages, disabled, insertImageFile]);

    const handlePaste = (event) => {
        if (!allowImages || disabled) {
            return;
        }

        const clipboard = event.clipboardData;
        if (!clipboard) {
            return;
        }

        const files = Array.from(clipboard.items ?? [])
            .filter((item) => item.type.startsWith('image/'))
            .map((item) => item.getAsFile())
            .filter(Boolean);
        const html = clipboard.getData('text/html');
        const fragment = html ? sanitizePastedHtml(html) : null;
        const hasText = fragment
            ? fragment.textContent.trim() !== ''
            : clipboard.getData('text/plain').trim() !== '';

        if (!hasText) {
            if (files.length === 0) {
                return;
            }
            event.preventDefault();
            files.reduce(
                (chain, file) => chain.then(() => insertImageFile(file)),
                Promise.resolve(),
            );
            return;
        }

        if (!fragment) {
            if (files.length === 0) {
                return;
            }
            event.preventDefault();
            exec('insertText', clipboard.getData('text/plain'));
            files.reduce(
                (chain, file) => chain.then(() => insertImageFile(file)),
                Promise.resolve(),
            );
            return;
        }

        event.preventDefault();

        // Word/Outlook reference images as file:/cid: paths the browser cannot
        // load; the clipboard carries those pictures as files in the same order.
        const unusedFiles = [...files];
        const pending = [];
        fragment.querySelectorAll('img').forEach((img) => {
            const src = img.getAttribute('src') ?? '';
            let file = null;

            if (src.startsWith('data:')) {
                if (!isUsableImageSrc(src)) {
                    img.remove();
                    return;
                }
                if (typeof uploadImage === 'function') {
                    file = dataUrlToFile(src);
                }
            } else if (!isUsableImageSrc(src)) {
                file = unusedFiles.shift() ?? null;
                if (!file) {
                    img.remove();
                    return;
                }
            }

            if (file) {
                const preview = URL.createObjectURL(file);
                img.setAttribute('src', preview);
                pending.push({ img, file, preview });
            }
        });

        insertNodeAtCursor(fragment);
        syncValue();

        pending.forEach(({ img, file, preview }) => {
            resolveImageSrc(file).then((src) => {
                URL.revokeObjectURL(preview);
                if (src) {
                    img.setAttribute('src', src);
                } else {
                    img.remove();
                }
                syncValue();
            });
        });
    };

    return (
        <div className={className}>
            <div
                className={`overflow-hidden rounded-lg border border-[#c5c7d0] bg-white shadow-sm focus-within:border-[#0073ea] focus-within:ring-2 focus-within:ring-[#0073ea]/20 dark:border-[#3b82f6]/40 dark:bg-[#151622] dark:focus-within:border-[#60a5fa] dark:focus-within:ring-[#60a5fa]/20 ${disabled ? 'pointer-events-none opacity-60' : ''}`}
            >
                <div
                    className="flex flex-wrap items-center gap-0.5 border-b border-[#e6e9ef] bg-[#fafbfc] px-2 py-1.5 dark:border-[#3b82f6]/30 dark:bg-[#1a2744]"
                    role="toolbar"
                    aria-label="Formatting"
                >
                    {TOOLBAR_BUTTONS.map((btn) => (
                        <button
                            key={btn.command}
                            type="button"
                            title={btn.title}
                            disabled={disabled}
                            aria-pressed={activeCommands[btn.command] || false}
                            className={`${toolbarButtonClass(activeCommands[btn.command])} ${btn.className ?? ''}`}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                                exec(btn.command);
                                editorRef.current?.focus();
                                syncValue();
                            }}
                        >
                            {btn.label}
                        </button>
                    ))}
                    <button
                        type="button"
                        title="Insert link"
                        disabled={disabled}
                        aria-pressed={activeCommands[LINK_COMMAND] || false}
                        className={toolbarButtonClass(
                            activeCommands[LINK_COMMAND],
                        )}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={handleLink}
                    >
                        Link
                    </button>
                    {allowImages ? (
                        <>
                            <input
                                ref={imageInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={disabled}
                                onChange={(event) => {
                                    const file = event.target.files?.[0];
                                    if (file) {
                                        insertImageFile(file);
                                    }
                                    event.target.value = '';
                                }}
                            />
                            <button
                                type="button"
                                title="Insert image"
                                disabled={disabled || uploadingImage}
                                className={toolbarButtonClass(false)}
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => imageInputRef.current?.click()}
                            >
                                {uploadingImage ? `${uploadProgress || 0}%` : 'Image'}
                            </button>
                        </>
                    ) : null}
                </div>
                {uploadingImage ? (
                    <div className="border-b border-[#e6e9ef] bg-white px-3 py-2 dark:border-[#3b82f6]/30 dark:bg-[#151622]">
                        <UploadProgressBar
                            percent={uploadProgress}
                            label="Uploading image…"
                        />
                    </div>
                ) : null}
                <div ref={dropZoneRef} className="relative">
                    {imageDragActive ? (
                        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-b-lg border-2 border-dashed border-[#0073ea] bg-[#e8f4ff]/90 text-sm font-medium text-[#0073ea] dark:border-sky-400 dark:bg-sky-500/20 dark:text-sky-300">
                            Drop image to insert
                        </div>
                    ) : null}
                    {showPlaceholder ? (
                        <p
                            className="pointer-events-none absolute left-3 top-3 text-sm text-[#676879] dark:text-slate-500"
                            aria-hidden
                        >
                            {placeholder}
                        </p>
                    ) : null}
                    <div
                        ref={editorRef}
                        id={id}
                        contentEditable={!disabled}
                        suppressContentEditableWarning
                        role="textbox"
                        aria-multiline="true"
                        aria-placeholder={placeholder}
                        className="rich-text-editor min-h-[120px] max-h-[320px] overflow-y-auto bg-white px-3 py-3 text-sm text-[#323338] outline-none dark:bg-[#151622] dark:text-slate-200 [&_a]:text-[#0073ea] [&_a]:underline dark:[&_a]:text-[#60a5fa] [&_blockquote]:border-l-2 [&_blockquote]:border-[#c5c7d0] [&_blockquote]:pl-3 [&_blockquote]:text-[#676879] dark:[&_blockquote]:border-slate-600 dark:[&_blockquote]:text-slate-400 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-semibold [&_img]:my-2 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-md [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5"
                        onInput={syncValue}
                        onPaste={handlePaste}
                        onBlur={syncValue}
                        onKeyUp={updateActiveState}
                        onMouseUp={updateActiveState}
                        onFocus={updateActiveState}
                    />
                </div>
            </div>
        </div>
    );
}
