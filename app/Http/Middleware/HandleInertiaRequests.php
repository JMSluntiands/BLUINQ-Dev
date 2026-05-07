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
     * Public URL for storage/app/public/logo.* if the file exists (requires storage:link).
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
            $path = $dir.DIRECTORY_SEPARATOR.$name;
            if (is_file($path)) {
                return asset('storage/'.$name);
            }
        }

        return null;
    }
}
