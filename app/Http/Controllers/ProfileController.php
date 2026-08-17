<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\LeaveEntitlementService;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the signed-in user's profile (read-only; admins edit accounts in Settings).
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();
        $user->loadMissing(['role', 'milestones']);

        return Inertia::render('Profile/Edit', [
            'profile' => self::payload($user, canViewPrivate: true),
            'canViewPrivate' => true,
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => session('status'),
            'backUrl' => null,
            'editAccountUrl' => null,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public static function payload(User $user, bool $canViewPrivate): array
    {
        $user->loadMissing(['role', 'milestones']);

        $payload = [
            'id' => $user->id,
            'name' => $user->name,
            'initials' => $user->initials,
            'badge_initials' => $user->badgeInitials(),
            'email' => $user->email,
            'company_name' => $user->company_name,
            'employee_number' => $user->employee_number,
            'job_title' => $user->job_title ?: $user->position,
            'position' => $user->position,
            'birthday' => $user->birthday?->format('Y-m-d'),
            'personal_details' => $user->personal_details,
            'milestones' => $user->milestones->map(fn ($milestone) => [
                'id' => $milestone->id,
                'milestone_date_label' => $milestone->milestone_date->format('M Y'),
                'title' => $milestone->title,
                'impact_result' => $milestone->impact_result,
            ]),
            'profile_image_url' => $user->profile_image_url,
            'role_display_name' => $user->role?->name,
            'email_verified_at' => $user->email_verified_at,
        ];

        if (! $canViewPrivate) {
            return $payload;
        }

        $balances = app(LeaveEntitlementService::class)->balancesFor($user);

        return [
            ...$payload,
            'date_hired' => $user->date_hired?->format('Y-m-d'),
            'employment_status' => $user->employment_status ?? 'regular',
            'leave_credits' => $balances['al_available'],
            'leave_balances' => $balances,
            'personal_file_url' => $user->personal_file_url,
            'claims_excel_url' => $user->claims_excel_url,
        ];
    }
}
