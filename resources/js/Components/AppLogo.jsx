import { useState } from 'react';

/**
 * Renders the app logo from `logo_url`, or `fallback` when missing / failed to load
 * (e.g. production missing `php artisan storage:link`).
 */
export default function AppLogo({
    logoUrl,
    alt = '',
    className = '',
    fallback = null,
}) {
    const [broken, setBroken] = useState(false);

    if (!logoUrl || broken) {
        return fallback;
    }

    return (
        <img
            src={logoUrl}
            alt={alt}
            className={className}
            onError={() => setBroken(true)}
        />
    );
}
