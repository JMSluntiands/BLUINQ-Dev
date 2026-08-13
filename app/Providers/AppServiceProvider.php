<?php

namespace App\Providers;

use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        $publicRoot = storage_path('app/public');
        $privateRoot = storage_path('app/private');
        config([
            'filesystems.disks.public.root' => $publicRoot,
            'filesystems.disks.local.root' => $privateRoot,
            'filesystems.links' => [
                public_path('storage') => $publicRoot,
            ],
        ]);

        if ($this->app->environment('production')) {
            URL::forceScheme('https');
        }
    }
}
