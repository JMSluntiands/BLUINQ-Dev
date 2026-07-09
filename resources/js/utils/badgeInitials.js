/**
 * Match App\Models\User::badgeInitials() — short label for badges and profile headers.
 */
export function badgeInitialsFromName(name) {
    if (!name || typeof name !== 'string') {
        return '?';
    }

    const trimmed = name.trim();
    if (trimmed === '') {
        return '?';
    }

    const parts = trimmed.split(/\s+/).filter(Boolean);

    if (parts.length >= 2) {
        const first = parts[0][0] ?? '';
        const last = parts[parts.length - 1][0] ?? '';

        return `${first}${last}`.toLocaleUpperCase();
    }

    return trimmed.slice(0, Math.min(3, trimmed.length)).toLocaleUpperCase();
}
