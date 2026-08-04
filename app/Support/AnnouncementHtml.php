<?php

namespace App\Support;

final class AnnouncementHtml
{
    public static function sanitizeDescription(?string $html): string
    {
        $allowed = '<p><br><strong><b><em><i><u><ul><ol><li><a><h2><h3><blockquote><img>';
        $clean = strip_tags((string) $html, $allowed);

        $clean = preg_replace_callback(
            '/<img\b[^>]*>/i',
            static function (array $match): string {
                if (! preg_match('/\bsrc\s*=\s*([\'"])(.*?)\1/i', $match[0], $srcMatch)) {
                    return '';
                }

                $url = html_entity_decode($srcMatch[2], ENT_QUOTES | ENT_HTML5, 'UTF-8');
                $url = self::normalizeInlineImageSrc($url);
                if (! self::isAllowedImageSrc($url)) {
                    return '';
                }

                $alt = '';
                if (preg_match('/\balt\s*=\s*([\'"])(.*?)\1/i', $match[0], $altMatch)) {
                    $alt = htmlspecialchars(
                        html_entity_decode($altMatch[2], ENT_QUOTES | ENT_HTML5, 'UTF-8'),
                        ENT_QUOTES,
                        'UTF-8',
                    );
                }

                return '<img src="'.htmlspecialchars($url, ENT_QUOTES, 'UTF-8').'" alt="'.$alt.'">';
            },
            $clean,
        ) ?? $clean;

        return trim($clean);
    }

    /**
     * Rewrite stored HTML so inline image URLs work on the current host.
     */
    public static function forDisplay(?string $html): string
    {
        $html = (string) $html;
        if ($html === '' || ! str_contains($html, '<img')) {
            return $html;
        }

        return preg_replace_callback(
            '/(<img\b[^>]*\bsrc\s*=\s*[\'"])([^\'"]+)([\'"][^>]*>)/i',
            static function (array $match): string {
                $url = html_entity_decode($match[2], ENT_QUOTES | ENT_HTML5, 'UTF-8');
                $url = self::normalizeInlineImageSrc($url);

                return $match[1].htmlspecialchars($url, ENT_QUOTES, 'UTF-8').$match[3];
            },
            $html,
        ) ?? $html;
    }

    public static function descriptionHasContent(?string $html): bool
    {
        $html = (string) $html;
        if (preg_match('/<img\b/i', $html) === 1) {
            return true;
        }

        return trim(strip_tags($html)) !== '';
    }

    public static function isAllowedImageSrc(string $url): bool
    {
        $url = trim($url);
        if ($url === '' || preg_match('#^\s*javascript:#i', $url) === 1) {
            return false;
        }

        if (str_starts_with($url, 'data:image/')) {
            return (bool) preg_match('#^data:image/(png|jpe?g|gif|webp);base64,#i', $url);
        }

        return (bool) preg_match('#^(https?:)?/#i', $url);
    }

    /**
     * Prefer same-origin relative paths for app-hosted inline images.
     */
    public static function normalizeInlineImageSrc(string $url): string
    {
        $url = trim($url);
        if ($url === '') {
            return $url;
        }

        if (preg_match('#/announcements/inline-images/([A-Za-z0-9._-]+)#i', $url, $match) === 1) {
            return route('announcements.inline-image.show', [
                'filename' => $match[1],
            ], false);
        }

        if (preg_match('#/job/drafting/comments/inline-images/([A-Za-z0-9._-]+)#i', $url, $match) === 1) {
            return route('job.drafting.comments.inline-image.show', [
                'filename' => $match[1],
            ], false);
        }

        return $url;
    }

    public static function relativeInlineImageUrl(string $routeName, string $filename): string
    {
        return route($routeName, ['filename' => basename($filename)], false);
    }
}
