<?php

namespace App\Support;

/**
 * Normalize stored absolute URLs so local hosts resolve to the live app URL.
 */
class PublicUrl
{
    /**
     * @var list<string>
     */
    private const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1', '0.0.0.0'];

    public static function rewriteLocalhost(?string $url, ?string $baseUrl = null): ?string
    {
        $url = trim((string) $url);
        if ($url === '') {
            return null;
        }

        $parts = parse_url($url);
        if (! is_array($parts) || empty($parts['host'])) {
            return $url;
        }

        $host = strtolower((string) $parts['host']);
        if (! in_array($host, self::LOCAL_HOSTS, true)) {
            return $url;
        }

        $base = rtrim($baseUrl ?: self::appBaseUrl(), '/');
        if ($base === '') {
            return $url;
        }

        $baseParts = parse_url($base);
        $baseHost = is_array($baseParts) ? strtolower((string) ($baseParts['host'] ?? '')) : '';
        if ($baseHost === '' || in_array($baseHost, self::LOCAL_HOSTS, true)) {
            return $url;
        }

        $path = ($parts['path'] ?? '')
            .(isset($parts['query']) ? '?'.$parts['query'] : '')
            .(isset($parts['fragment']) ? '#'.$parts['fragment'] : '');

        return $base.$path;
    }

    public static function appBaseUrl(): string
    {
        if (! app()->runningInConsole()) {
            try {
                $request = request();
                if ($request !== null) {
                    $host = strtolower((string) $request->getHost());
                    if ($host !== '' && ! in_array($host, self::LOCAL_HOSTS, true)) {
                        return $request->getSchemeAndHttpHost();
                    }
                }
            } catch (\Throwable) {
                // Fall through to configured APP_URL.
            }
        }

        return rtrim((string) config('app.url'), '/');
    }
}
