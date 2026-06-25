<?php

namespace App\Http\Middleware;

use App\Models\Permission;
use App\Services\DraftingRequestReviewService;
use App\Services\LeaveService;
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
        if ($user !== null) {
            $user->loadMissing('role');
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user && $user->role
                    ? array_merge($user->makeHidden(['role'])->toArray(), [
                        'role' => $user->role->slug,
                        'role_display_name' => $user->role->name,
                        'permissions' => Permission::slugsForRole($user->role->slug),
                    ])
                    : null,
            ],
            'logo_url' => $this->resolveAppLogoUrl(),
            'flash' => [
                'status' => $request->session()->get('status'),
            ],
            'pendingLeaveCount' => $user?->hasPermission('leave.manage')
                ? app(LeaveService::class)->pendingCount()
                : 0,
            'pendingDraftingRequestCount' => $user?->hasPermission('job.drafting-request.review')
                ? app(DraftingRequestReviewService::class)->pendingCount()
                : 0,
        ];
    }

    /**
     * Prefer /storage/logo.* (symlink or copied file). If missing, use /brand-logo so
     * shared hosts without php artisan storage:link still show the image.
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
            if (is_file($publicPath)) {
                return asset('storage/'.$name);
            }

            return route('app.brand-logo');
        }

        return null;
    }
}
