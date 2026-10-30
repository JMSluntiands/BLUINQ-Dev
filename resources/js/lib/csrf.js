/**
 * Laravel refreshes the XSRF-TOKEN cookie on every response, so it stays valid
 * after the session is renewed. The csrf-token meta tag is only correct for the
 * session that rendered the page.
 */
export function xsrfHeaders() {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
    if (match) {
        return { 'X-XSRF-TOKEN': decodeURIComponent(match[1]) };
    }

    const meta = document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute('content');

    return meta ? { 'X-CSRF-TOKEN': meta } : {};
}

const PING_INTERVAL_MS = 5 * 60 * 1000;
let lastPingAt = Date.now();
let pending = null;

/**
 * Touch the session so a page left open for hours gets a live session and a
 * fresh XSRF-TOKEN cookie before the next POST (avoids a first-try 419).
 */
export function refreshSession({ force = false } = {}) {
    if (pending) {
        return pending;
    }
    if (!force && Date.now() - lastPingAt < PING_INTERVAL_MS) {
        return Promise.resolve();
    }

    pending = window.axios
        .get(route('session.ping'), { headers: { Accept: 'application/json' } })
        .catch(() => {})
        .finally(() => {
            lastPingAt = Date.now();
            pending = null;
        });

    return pending;
}

export function refreshSessionWhenTabReturns() {
    const onReturn = () => {
        if (document.visibilityState === 'visible') {
            refreshSession();
        }
    };

    document.addEventListener('visibilitychange', onReturn);
    window.addEventListener('focus', onReturn);
}
