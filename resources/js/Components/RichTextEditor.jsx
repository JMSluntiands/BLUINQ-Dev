import { useCallback, useEffect, useRef, useState } from 'react';

const TOOLBAR_BUTTONS = [
    { command: 'bold', label: 'B', title: 'Bold', className: 'font-bold' },
    { command: 'italic', label: 'I', title: 'Italic', className: 'italic' },
    { command: 'underline', label: 'U', title: 'Underline', className: 'underline' },
    { command: 'insertUnorderedList', label: '•', title: 'Bullet list' },
    { command: 'insertOrderedList', label: '1.', title: 'Numbered list' },
];

const LINK_COMMAND = 'createLink';

function exec(command, value = null) {
    document.execCommand(command, false, value);
}

function htmlIsEmpty(html) {
    if (!html || html === '<br>') {
        return true;
    }

    return html.replace(/<[^>]*>/g, '').trim() === '';
}

function toolbarButtonClass(isActive) {
    return [
        'min-w-[2rem] rounded px-2 py-1 text-sm transition disabled:opacity-50',
        isActive
            ? 'bg-[#cce5ff] font-semibold text-[#0073ea] ring-1 ring-[#0073ea]/25'
            : 'text-[#323338] hover:bg-[#e6e9ef]',
    ].join(' ');
}

export default function RichTextEditor({
    id,
    value = '',
    onChange,
    placeholder = 'Write a comment…',
    disabled = false,
    className = '',
}) {
    const editorRef = useRef(null);
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

    return (
        <div className={className}>
            <div
                className={`overflow-hidden rounded-lg border border-[#c5c7d0] bg-white shadow-sm focus-within:border-[#0073ea] focus-within:ring-2 focus-within:ring-[#0073ea]/20 ${
                    disabled ? 'pointer-events-none opacity-60' : ''
                }`}
            >
                <div
                    className="flex flex-wrap items-center gap-0.5 border-b border-[#e6e9ef] bg-[#fafbfc] px-2 py-1.5"
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
                        className={toolbarButtonClass(activeCommands[LINK_COMMAND])}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={handleLink}
                    >
                        Link
                    </button>
                </div>
                <div className="relative">
                    {showPlaceholder ? (
                        <p
                            className="pointer-events-none absolute left-3 top-3 text-sm text-[#676879]"
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
                        className="rich-text-editor min-h-[120px] max-h-[320px] overflow-y-auto px-3 py-3 text-sm text-[#323338] outline-none [&_a]:text-[#0073ea] [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-[#c5c7d0] [&_blockquote]:pl-3 [&_blockquote]:text-[#676879] [&_h2]:text-base [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5"
                        onInput={syncValue}
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
