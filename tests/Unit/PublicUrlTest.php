<?php

namespace Tests\Unit;

use App\Support\PublicUrl;
use Tests\TestCase;

class PublicUrlTest extends TestCase
{
    public function test_rewrites_localhost_links_to_live_base(): void
    {
        $this->assertSame(
            'https://dev.bluinq.net/job/drafting/12',
            PublicUrl::rewriteLocalhost(
                'http://localhost:8000/job/drafting/12',
                'https://dev.bluinq.net',
            ),
        );
    }

    public function test_leaves_non_local_links_unchanged(): void
    {
        $this->assertSame(
            'https://sharepoint.example/folder/abc',
            PublicUrl::rewriteLocalhost(
                'https://sharepoint.example/folder/abc',
                'https://dev.bluinq.net',
            ),
        );
    }

    public function test_skips_rewrite_when_app_url_is_also_localhost(): void
    {
        $this->assertSame(
            'http://localhost:8000/job/drafting/12',
            PublicUrl::rewriteLocalhost(
                'http://localhost:8000/job/drafting/12',
                'http://localhost',
            ),
        );
    }
}
