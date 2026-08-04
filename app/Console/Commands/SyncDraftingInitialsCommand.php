<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class SyncDraftingInitialsCommand extends Command
{
    protected $signature = 'drafting:sync-initials';

    protected $description = 'Refresh drafter/checker initials on revisions from current user badges';

    public function handle(): int
    {
        $updated = 0;

        User::query()
            ->orderBy('id')
            ->each(function (User $user) use (&$updated): void {
                $user->syncLinkedDraftingInitials();
                $updated++;
            });

        $this->info("Synced drafting initials for {$updated} users.");

        return self::SUCCESS;
    }
}
