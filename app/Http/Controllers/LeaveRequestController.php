<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreLeaveRequestRequest;
use App\Models\LeaveRequest;
use App\Services\LeaveService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class LeaveRequestController extends Controller
{
    public function __construct(
        private LeaveService $leave,
    ) {}

    public function approvals(Request $request): Response
    {
        $status = $request->string('status')->toString();
        if (! in_array($status, ['pending', 'approved', 'rejected', 'all'], true)) {
            $status = 'pending';
        }

        $query = LeaveRequest::query()
            ->with(['user:id,name,job_title,profile_image,leave_credits', 'reviewer:id,name'])
            ->orderByDesc('created_at');

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        $search = trim((string) $request->input('search', ''));
        if ($search !== '') {
            $query->whereHas('user', function ($userQuery) use ($search) {
                $userQuery->where('name', 'like', "%{$search}%");
            });
        }

        return Inertia::render('Leave/Approvals', [
            'requests' => $query
                ->paginate(15)
                ->withQueryString()
                ->through(fn (LeaveRequest $row) => $this->leave->formatForApproval($row)),
            'filters' => [
                'status' => $status,
                'search' => $search,
            ],
            'pendingCount' => $this->leave->pendingCount(),
        ]);
    }

    public function store(StoreLeaveRequestRequest $request): RedirectResponse
    {
        LeaveRequest::query()->create([
            'user_id' => $request->user()->id,
            'start_date' => $request->validated('start_date'),
            'end_date' => $request->validated('end_date'),
            'type' => $request->validated('type'),
            'reason' => $request->validated('reason'),
            'status' => LeaveRequest::STATUS_PENDING,
        ]);

        return back()->with('status', 'leave-request-submitted');
    }

    public function approve(Request $request, LeaveRequest $leaveRequest): RedirectResponse
    {
        abort_unless($request->user()?->hasPermission('leave.manage'), 403);

        if ($leaveRequest->status !== LeaveRequest::STATUS_PENDING) {
            return back()->with('status', 'leave-already-reviewed');
        }

        try {
            DB::transaction(function () use ($request, $leaveRequest): void {
                $leaveRequest->loadMissing('user');

                $this->leave->deductCreditsForApprovedLeave(
                    $leaveRequest,
                    $request->user(),
                );

                $leaveRequest->update([
                    'status' => LeaveRequest::STATUS_APPROVED,
                    'reviewed_by' => $request->user()->id,
                    'reviewed_at' => now('UTC'),
                    'admin_notes' => $request->input('admin_notes'),
                ]);
            });
        } catch (RuntimeException $exception) {
            return back()->with('status', 'leave-insufficient-credits');
        }

        return back()->with('status', 'leave-approved');
    }

    public function reject(Request $request, LeaveRequest $leaveRequest): RedirectResponse
    {
        abort_unless($request->user()?->hasPermission('leave.manage'), 403);

        if ($leaveRequest->status !== LeaveRequest::STATUS_PENDING) {
            return back()->with('status', 'leave-already-reviewed');
        }

        $request->validate([
            'admin_notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $leaveRequest->update([
            'status' => LeaveRequest::STATUS_REJECTED,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now('UTC'),
            'admin_notes' => $request->input('admin_notes'),
        ]);

        return back()->with('status', 'leave-rejected');
    }
}
