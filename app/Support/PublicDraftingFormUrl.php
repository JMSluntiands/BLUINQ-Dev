<?php

namespace App\Support;

class PublicDraftingFormUrl
{
    public static function base(): string
    {
        $domain = trim((string) config('drafting.public_form_domain'));

        if ($domain !== '') {
            $scheme = parse_url((string) config('app.url'), PHP_URL_SCHEME) ?: 'https';

            return $scheme.'://'.$domain;
        }

        $path = trim((string) config('drafting.public_form_path', 'bluinqform'), '/');

        return url('/'.$path);
    }
}
