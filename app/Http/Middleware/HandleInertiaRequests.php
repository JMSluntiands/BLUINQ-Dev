<?php

namespace App\Http\Middleware;

use App\Models\PasswordChangeRequest;
use App\Models\Permission;
use App\Services\DraftingRequestReviewService;
use App\Services\LeaveEntitlementService;
use App\Services\LeaveService;
use App\Support\AppLogoFile;
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
                'revision_code' => $request->session()->get('revision_code'),
            ],
            'pendingLeaveCount' => $user?->hasPermission('leave.manage')
                ? app(LeaveService::class)->pendingCount()
                : 0,
            'leaveBalances' => $user && $user->hasPermission('leave.apply')
                ? app(LeaveEntitlementService::class)->balancesFor($user)
                : null,
            'leaveTypes' => collect(config('leave.types', []))
                ->map(fn (array $meta, string $key) => [
                    'value' => $key,
                    'label' => $meta['label'],
                    'code' => $meta['code'],
                    'deduct' => $meta['deduct'],
                    'requires_entitlement' => (bool) ($meta['requires_entitlement'] ?? false),
                    'medical_certificate_after_days' => $key === 'sl'
                        ? (int) config('leave.sl.medical_certificate_after_days', 2)
                        : null,
                ])
                ->values()
                ->all(),
            'pendingPasswordChangeCount' => $user?->hasPermission('settings.user-accounts.manage')
                ? PasswordChangeRequest::query()->pending()->count()
                : 0,
            'pendingDraftingRequestCount' => $user?->hasPermission('job.drafting-request.review')
                ? app(DraftingRequestReviewService::class)->pendingCount()
                : 0,
        ];
    }

    /**
     * Serve logo from storage/ (or public/logo.png Git fallback) via /brand-logo.
     */
    protected function resolveAppLogoUrl(): ?string
    {
        return AppLogoFile::url();
    }
}
