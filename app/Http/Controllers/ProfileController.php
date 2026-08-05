<?php

namespace App\Http\Controllers;

use App\Services\WeeklyTimesheetService;
use Carbon\Carbon;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function __construct(
        private WeeklyTimesheetService $weeklyTimesheet,
    ) {}

    /**
     * Display the user's profile (read-only; admins edit accounts in Settings).
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();
        $user->loadMissing(['role', 'milestones']);

        $weekStart = $request->filled('week')
            ? Carbon::parse((string) $request->input('week'))->startOfWeek(Carbon::MONDAY)
            : now()->startOfWeek(Carbon::MONDAY);

        return Inertia::render('Profile/Edit', [
            'profile' => $this->profilePayload($user),
            'weeklyTimesheet' => $this->weeklyTimesheet->payloadForUser($user, $weekStart),
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => session('status'),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function profilePayload($user): array
    {
        return [
            'name' => $user->name,
            'initials' => $user->initials,
            'badge_initials' => $user->badgeInitials(),
            'email' => $user->email,
            'company_name' => $user->company_name,
            'employee_number' => $user->employee_number,
            'job_title' => $user->job_title,
            'position' => $user->position,
            'date_hired' => $user->date_hired?->format('Y-m-d'),
            'employment_status' => $user->employment_status ?? 'regular',
            'leave_credits' => app(\App\Services\LeaveEntitlementService::class)->balancesFor($user)['al_available'],
            'leave_balances' => app(\App\Services\LeaveEntitlementService::class)->balancesFor($user),
            'birthday' => $user->birthday?->format('Y-m-d'),
            'personal_details' => $user->personal_details,
            'personal_file_url' => $user->personal_file_url,
            'claims_excel_url' => $user->claims_excel_url,
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
    }
}
