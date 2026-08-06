<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreLeaveCreditsRequest;
use App\Http\Requests\UpdateLeaveCreditsRequest;
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
        $user = $request->user();
        $canView = $user?->hasPermission('leave.credits.view') ?? false;
        $canEdit = $user?->hasPermission('leave.credits.edit') ?? false;

        abort_unless($canView || $canEdit, 403);

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
                ->paginate(10)
                ->withQueryString()
                ->through(fn (User $row) => [
                    'id' => $row->id,
                    'name' => $row->name,
                    'email' => $row->email,
                    'job_title' => $row->job_title,
                    'role' => $row->role?->name ?? $row->role?->slug,
                    'profile_image_url' => $row->profile_image_url,
                    'employment_status' => $row->employment_status ?? 'regular',
                    'leave_credits' => $this->leave->creditsForUser($row),
                    'balances' => $this->leave->balancesForUser($row),
                ]),
            'filters' => [
                'search' => $search,
            ],
            'canEdit' => $canEdit,
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
            $request->validated('bucket'),
        );

        return back()->with('status', 'leave-credits-added');
    }

    public function update(UpdateLeaveCreditsRequest $request, User $user): RedirectResponse
    {
        $employee = User::query()->active()->findOrFail($user->id);

        $this->leave->updateBalances(
            $employee,
            (int) $request->validated('al_credits'),
            (int) $request->validated('sl_credits'),
            $request->user(),
            $request->validated('notes'),
        );

        return back()->with('status', 'leave-credits-updated');
    }
}
