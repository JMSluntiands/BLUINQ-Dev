<?php

use App\Support\PublicUrl;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $base = rtrim((string) config('app.url'), '/');
        $baseHost = strtolower((string) (parse_url($base, PHP_URL_HOST) ?: ''));

        if ($base === '' || in_array($baseHost, ['localhost', '127.0.0.1', '::1', '0.0.0.0', ''], true)) {
            return;
        }

        DB::table('drafting_request_revisions')
            ->whereNotNull('link')
            ->where('link', '!=', '')
            ->orderBy('id')
            ->chunkById(100, function ($rows) use ($base): void {
                foreach ($rows as $row) {
                    $next = PublicUrl::rewriteLocalhost($row->link, $base);
                    if ($next !== null && $next !== $row->link) {
                        DB::table('drafting_request_revisions')
                            ->where('id', $row->id)
                            ->update(['link' => $next]);
                    }
                }
            });
    }

    public function down(): void
    {
        // Irreversible data rewrite.
    }
};
