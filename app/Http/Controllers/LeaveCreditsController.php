<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreLeaveCreditsRequest;
use App\Models\User;
use App\Services\LeaveService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LeaveCreditsController extends Controller
{
    public function __construct(
        private LeaveService $leave,
    ) {}

    public function index(Request $request): Response
    {
        abort_unless($request->user()?->hasPermission('leave.credits.manage'), 403);

        $search = trim((string) $request->input('search', ''));

        $query = User::query()
            ->active()
            ->with('role:id,slug,name')
            ->orderBy('name');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        return Inertia::render('Leave/Credits/Index', [
            'employees' => $query
                ->paginate(15)
                ->withQueryString()
                ->through(fn (User $user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'job_title' => $user->job_title,
                    'role' => $user->role?->name ?? $user->role?->slug,
                    'profile_image_url' => $user->profile_image_url,
                    'leave_credits' => $this->leave->creditsForUser($user),
                ]),
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function store(StoreLeaveCreditsRequest $request): RedirectResponse
    {
        $employee = User::query()->active()->findOrFail($request->validated('user_id'));

        $this->leave->addCredits(
            $employee,
            (int) $request->validated('amount'),
            $request->user(),
            $request->validated('notes'),
        );

        return back()->with('status', 'leave-credits-added');
    }
}
