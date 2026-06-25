<?php

namespace App\Support;

use Illuminate\Http\Request;

class PublicDraftingFormUrl
{
    public static function configuredDomain(): string
    {
        return strtolower(trim((string) config('drafting.public_form_domain')));
    }

    public static function pathSegment(): string
    {
        return trim((string) config('drafting.public_form_path', 'bluinqform'), '/');
    }

    public static function requestIsPublicFormHost(Request $request): bool
    {
        $domain = self::configuredDomain();

        if ($domain === '') {
            return false;
        }

        $host = strtolower($request->getHost());

        return $host === $domain || $host === 'www.'.$domain;
    }

    public static function base(?Request $request = null): string
    {
        if ($request !== null && self::requestIsPublicFormHost($request)) {
            return $request->getSchemeAndHttpHost();
        }

        $domain = self::configuredDomain();

        if ($domain !== '') {
            $scheme = 'https';
            if ($request !== null) {
                $scheme = $request->getScheme();
            } else {
                $scheme = parse_url((string) config('app.url'), PHP_URL_SCHEME) ?: 'https';
            }

            return $scheme.'://'.$domain;
        }

        return url('/'.self::pathSegment());
    }

    public static function submitUrl(?Request $request = null): string
    {
        $base = rtrim(self::base($request), '/');

        if ($request !== null && self::requestIsPublicFormHost($request)) {
            return $base.'/';
        }

        return $base;
    }

    /**
     * @return list<string>
     */
    public static function domainHosts(): array
    {
        $domain = self::configuredDomain();

        if ($domain === '') {
            return [];
        }

        return array_values(array_unique([$domain, 'www.'.$domain]));
    }
}
