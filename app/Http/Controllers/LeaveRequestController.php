<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreLeaveRequestRequest;
use App\Models\LeaveRequest;
use App\Services\LeaveService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LeaveRequestController extends Controller
{
    private const ATTACHMENT_DISK = 'local';

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
        $actor = $request->user();
        $targetUserId = (int) ($request->validated('user_id') ?: $actor->id);

        $leaveRequest = LeaveRequest::query()->create([
            'user_id' => $targetUserId,
            'start_date' => $request->validated('start_date'),
            'end_date' => $request->validated('end_date'),
            'start_portion' => $request->validated('start_portion'),
            'end_portion' => $request->validated('end_portion'),
            'type' => LeaveRequest::normalizeType($request->validated('type')),
            'reason' => $request->validated('reason'),
            'status' => LeaveRequest::STATUS_PENDING,
        ]);

        $this->storeMedicalCertificate($request, $leaveRequest);

        return back()->with('status', 'leave-request-submitted');
    }

    public function downloadCertificate(Request $request, LeaveRequest $leaveRequest): StreamedResponse
    {
        $user = $request->user();
        $isOwner = $user?->id === $leaveRequest->user_id;
        $canManage = $user?->hasPermission('leave.manage') ?? false;

        abort_unless($isOwner || $canManage, 403);
        abort_unless($leaveRequest->hasAttachment(), 404);

        return Storage::disk($leaveRequest->attachment_disk ?? self::ATTACHMENT_DISK)
            ->download(
                $leaveRequest->attachment_path,
                $leaveRequest->attachment_name ?? 'medical-certificate.pdf',
            );
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

    private function storeMedicalCertificate(Request $request, LeaveRequest $leaveRequest): void
    {
        $file = $request->file('attachment') ?? $request->file('medical_certificate');
        if ($file === null) {
            return;
        }
        $path = $file->store('leave-requests/'.$leaveRequest->id, self::ATTACHMENT_DISK);

        $leaveRequest->update([
            'attachment_disk' => self::ATTACHMENT_DISK,
            'attachment_path' => $path,
            'attachment_name' => $file->getClientOriginalName(),
        ]);
    }
}
