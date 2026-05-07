import { useState } from 'react';

function initialFromName(name) {
    if (!name || typeof name !== 'string') {
        return '?';
    }
    const trimmed = name.trim();
    if (!trimmed) {
        return '?';
    }
    const char = trimmed[0];
    return char.toLocaleUpperCase();
}

/**
 * Circular profile image, or first letter of name when missing / broken image.
 */
export default function UserAvatar({
    user,
    className = 'h-8 w-8 text-xs',
    ringClassName = 'ring-2 ring-white',
}) {
    const [imageFailed, setImageFailed] = useState(false);
    const url = user?.profile_image_url;
    const initial = initialFromName(user?.name);

    const base =
        'flex shrink-0 select-none items-center justify-center rounded-full font-semibold uppercase tracking-tight text-white ' +
        ringClassName +
        ' ' +
        className;

    if (url && !imageFailed) {
        return (
            <img
                src={url}
                alt=""
                className={
                    'shrink-0 rounded-full object-cover ' +
                    ringClassName +
                    ' ' +
                    className
                }
                onError={() => setImageFailed(true)}
            />
        );
    }

    return (
        <span
            className={
                base +
                ' bg-gradient-to-br from-sky-500 to-sky-700 shadow-inner shadow-sky-900/20'
            }
            aria-hidden
        >
            {initial}
        </span>
    );
}
