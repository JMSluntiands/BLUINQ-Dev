<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class SecurityHeadersTest extends TestCase
{
    public function test_login_page_sends_security_headers(): void
    {
        $response = $this->get('/');

        $response->assertOk();
        $response->assertHeader('X-Frame-Options', 'SAMEORIGIN');
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->assertHeader(
            'Permissions-Policy',
            'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
        );
        $this->assertFalse($response->headers->has('X-Powered-By'));
    }

    public function test_https_responses_include_hsts(): void
    {
        URL::forceScheme('https');

        $response = $this->get('https://matrix.bluinq.test/');

        $response->assertOk();
        $response->assertHeader(
            'Strict-Transport-Security',
            'max-age=31536000; includeSubDomains',
        );
    }
}
