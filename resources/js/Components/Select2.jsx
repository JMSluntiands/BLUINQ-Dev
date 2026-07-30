import { useEffect, useRef } from 'react';
import 'select2/dist/css/select2.min.css';
import '../../css/select2-overrides.css';

function jQuery() {
    if (typeof window === 'undefined') {
        return null;
    }

    return window.jQuery ?? null;
}

function sameStringList(a, b) {
    if (a.length !== b.length) {
        return false;
    }

    const left = [...a].map(String).sort();
    const right = [...b].map(String).sort();

    return left.every((value, index) => value === right[index]);
}

/**
 * @param {{
 *   id?: string;
 *   value?: string | string[];
 *   onChange: (value: string | string[]) => void;
 *   options?: Array<{ value: string; label: string }>;
 *   placeholder?: string;
 *   allowClear?: boolean;
 *   disabled?: boolean;
 *   enabled?: boolean;
 *   className?: string;
 *   required?: boolean;
 *   multiple?: boolean;
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
    multiple = false,
}) {
    const selectRef = useRef(null);
    const onChangeRef = useRef(onChange);
    const syncingRef = useRef(false);
    const optionsKey = options.map((option) => `${option.value}:${option.label}`).join('\0');
    const valueKey = multiple
        ? (Array.isArray(value) ? value : []).map(String).sort().join('\0')
        : String(value ?? '');

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
            allowClear: multiple ? false : allowClear,
            width: '100%',
            dropdownParent: $(document.body),
            multiple,
            closeOnSelect: !multiple,
        });

        const handleChange = () => {
            if (syncingRef.current) {
                return;
            }

            const raw = $el.val();
            if (multiple) {
                onChangeRef.current(
                    Array.isArray(raw)
                        ? raw.map(String)
                        : raw
                          ? [String(raw)]
                          : [],
                );
            } else {
                onChangeRef.current(String(raw ?? ''));
            }
        };

        $el.on('change', handleChange);

        return () => {
            $el.off('change', handleChange);
            if ($el.data('select2')) {
                $el.select2('destroy');
            }
        };
    }, [enabled, placeholder, allowClear, optionsKey, multiple]);

    useEffect(() => {
        if (!enabled || !selectRef.current) {
            return;
        }

        const $ = jQuery();
        if ($ === null || typeof $.fn.select2 !== 'function') {
            return;
        }

        const $el = $(selectRef.current);

        if (multiple) {
            const next = Array.isArray(value) ? value.map(String) : [];
            const current = (($el.val() ?? [])).map(String);
            if (!sameStringList(next, current)) {
                syncingRef.current = true;
                $el.val(next).trigger('change');
                syncingRef.current = false;
            }
        } else {
            const next = value ?? '';
            if (String($el.val() ?? '') !== String(next)) {
                syncingRef.current = true;
                $el.val(next).trigger('change');
                syncingRef.current = false;
            }
        }
    }, [valueKey, enabled, multiple, value]);

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

    const selected = multiple
        ? Array.isArray(value)
            ? value.map(String)
            : []
        : value;

    return (
        <select
            ref={selectRef}
            id={id}
            className={className}
            defaultValue={selected}
            required={required}
            multiple={multiple}
        >
            {!multiple ? <option value="">{placeholder}</option> : null}
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
}
