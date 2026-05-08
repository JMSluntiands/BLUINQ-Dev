<?php

namespace App\Http\Middleware;

use App\Models\Permission;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? array_merge($user->toArray(), [
                    'permissions' => Permission::slugsForRole($user->role->value),
                ]) : null,
            ],
            'logo_url' => $this->resolveAppLogoUrl(),
            'flash' => [
                'status' => $request->session()->get('status'),
            ],
        ];
    }

    /**
     * Public URL for storage/app/public/logo.* only when the file is also reachable
     * via public/storage (requires `php artisan storage:link`). Otherwise the browser
     * gets 404 on /storage/logo.* while PHP still sees the private path — broken img.
     */
    protected function resolveAppLogoUrl(): ?string
    {
        $dir = storage_path('app/public');
        $names = [
            'logo.png',
            'logo.jpg',
            'logo.jpeg',
            'logo.webp',
            'logo.svg',
        ];

        foreach ($names as $name) {
            $stored = $dir.DIRECTORY_SEPARATOR.$name;
            if (! is_file($stored)) {
                continue;
            }

            $publicPath = public_path('storage'.DIRECTORY_SEPARATOR.$name);
            if (! is_file($publicPath)) {
                continue;
            }

            return asset('storage/'.$name);
        }

        return null;
    }
}
