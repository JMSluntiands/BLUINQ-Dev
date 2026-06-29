import { useEffect, useRef } from 'react';
import 'select2/dist/css/select2.min.css';
import '../../css/select2-overrides.css';

function jQuery() {
    if (typeof window === 'undefined') {
        return null;
    }

    return window.jQuery ?? null;
}

/**
 * @param {{
 *   id?: string;
 *   value?: string;
 *   onChange: (value: string) => void;
 *   options?: Array<{ value: string; label: string }>;
 *   placeholder?: string;
 *   allowClear?: boolean;
 *   disabled?: boolean;
 *   enabled?: boolean;
 *   className?: string;
 *   required?: boolean;
 * }} props
 */
export default function Select2({
    id,
    value = '',
    onChange,
    options = [],
    placeholder = 'Select…',
    allowClear = false,
    disabled = false,
    enabled = true,
    className = '',
    required = false,
}) {
    const selectRef = useRef(null);
    const onChangeRef = useRef(onChange);
    const optionsKey = options.map((option) => option.value).join('\0');

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        if (!enabled || !selectRef.current) {
            return undefined;
        }

        const $ = jQuery();
        if ($ === null || typeof $.fn.select2 !== 'function') {
            return undefined;
        }

        const $el = $(selectRef.current);

        $el.select2({
            placeholder,
            allowClear,
            width: '100%',
            dropdownParent: $(document.body),
        });

        const handleChange = () => {
            onChangeRef.current(String($el.val() ?? ''));
        };

        $el.on('change', handleChange);

        return () => {
            $el.off('change', handleChange);
            if ($el.data('select2')) {
                $el.select2('destroy');
            }
        };
    }, [enabled, placeholder, allowClear, optionsKey]);

    useEffect(() => {
        if (!enabled || !selectRef.current) {
            return;
        }

        const $ = jQuery();
        if ($ === null || typeof $.fn.select2 !== 'function') {
            return;
        }

        const $el = $(selectRef.current);
        const next = value ?? '';

        if (String($el.val() ?? '') !== next) {
            $el.val(next).trigger('change.select2');
        }
    }, [value, enabled]);

    useEffect(() => {
        if (!enabled || !selectRef.current) {
            return;
        }

        const $ = jQuery();
        if ($ === null) {
            return;
        }

        $(selectRef.current).prop('disabled', disabled);
    }, [disabled, enabled]);

    if (!enabled) {
        return null;
    }

    return (
        <select
            ref={selectRef}
            id={id}
            className={className}
            defaultValue={value}
            required={required}
        >
            <option value="">{placeholder}</option>
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
}
