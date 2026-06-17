<?php

use App\Models\Announcement;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Carbon;

return new class extends Migration
{
    public function up(): void
    {
        Announcement::query()->each(function (Announcement $announcement): void {
            $publishedRaw = $announcement->getRawOriginal('published_at');
            $createdRaw = $announcement->getRawOriginal('created_at');

            if (! $publishedRaw || ! $createdRaw || $publishedRaw === $createdRaw) {
                return;
            }

            $published = Carbon::parse($publishedRaw);
            $created = Carbon::parse($createdRaw);

            if ($published->greaterThan($created) && abs($published->diffInHours($created)) >= 6) {
                $announcement->forceFill([
                    'published_at' => $created,
                ])->saveQuietly();
            }
        });
    }

    public function down(): void
    {
        // Data correction is not reversible.
    }
};
