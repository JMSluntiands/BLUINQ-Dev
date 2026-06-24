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
    className = '',
}) {
    const editorRef = useRef(null);
    const imageInputRef = useRef(null);
    const isInternalChange = useRef(false);
    const [activeCommands, setActiveCommands] = useState({});
    const [showPlaceholder, setShowPlaceholder] = useState(true);

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

    const insertImageFile = useCallback(
        (file) => {
            if (!file?.type?.startsWith('image/')) {
                return;
            }

            if (file.size > MAX_IMAGE_BYTES) {
                window.alert('Image is too large. Maximum size is 5 MB.');
                return;
            }

            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    insertImageAtCursor(reader.result);
                }
            };
            reader.readAsDataURL(file);
        },
        [insertImageAtCursor],
    );

    const handlePaste = (event) => {
        if (!allowImages || disabled) {
            return;
        }

        const items = event.clipboardData?.items;
        if (!items) {
            return;
        }

        for (const item of items) {
            if (!item.type.startsWith('image/')) {
                continue;
            }

            event.preventDefault();
            const file = item.getAsFile();
            if (file) {
                insertImageFile(file);
            }
            return;
        }
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
                                disabled={disabled}
                                className={toolbarButtonClass(false)}
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => imageInputRef.current?.click()}
                            >
                                Image
                            </button>
                        </>
                    ) : null}
                </div>
                <div className="relative">
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
