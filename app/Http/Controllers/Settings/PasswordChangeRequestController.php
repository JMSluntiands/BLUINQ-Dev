<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\PasswordChangeRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PasswordChangeRequestController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->hasPermission('settings.user-accounts.manage'), 403);

        $status = (string) $request->input('status', 'pending');
        if (! in_array($status, ['pending', 'approved', 'declined', 'all'], true)) {
            $status = 'pending';
        }

        $query = PasswordChangeRequest::query()
            ->with(['user:id,name,email,position', 'reviewer:id,name'])
            ->orderByDesc('created_at');

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        return Inertia::render('Settings/PasswordRequests/Index', [
            'requests' => $query
                ->paginate(15)
                ->withQueryString()
                ->through(fn (PasswordChangeRequest $changeRequest) => [
                    'id' => $changeRequest->id,
                    'status' => $changeRequest->status,
                    'created_at' => $changeRequest->created_at?->timezone(config('app.timezone'))->format('d M Y, h:i A'),
                    'reviewed_at' => $changeRequest->reviewed_at?->timezone(config('app.timezone'))->format('d M Y, h:i A'),
                    'admin_notes' => $changeRequest->admin_notes,
                    'user' => [
                        'id' => $changeRequest->user?->id,
                        'name' => $changeRequest->user?->name,
                        'email' => $changeRequest->user?->email,
                        'position' => $changeRequest->user?->position,
                    ],
                    'reviewer_name' => $changeRequest->reviewer?->name,
                ]),
            'filters' => [
                'status' => $status,
            ],
        ]);
    }

    public function approve(Request $request, PasswordChangeRequest $passwordChangeRequest): RedirectResponse
    {
        abort_unless($request->user()?->hasPermission('settings.user-accounts.manage'), 403);

        if (! $passwordChangeRequest->isPending()) {
            return back()->with('status', 'password-change-already-reviewed');
        }

        $user = $passwordChangeRequest->user;
        if ($user === null) {
            abort(404);
        }

        $user->forceFill(['password' => $passwordChangeRequest->password])->save();

        $passwordChangeRequest->update([
            'status' => PasswordChangeRequest::STATUS_APPROVED,
            'reviewed_by' => $request->user()?->id,
            'reviewed_at' => now(),
            'admin_notes' => $request->input('admin_notes'),
        ]);

        return back()->with('status', 'password-change-approved');
    }

    public function decline(Request $request, PasswordChangeRequest $passwordChangeRequest): RedirectResponse
    {
        abort_unless($request->user()?->hasPermission('settings.user-accounts.manage'), 403);

        if (! $passwordChangeRequest->isPending()) {
            return back()->with('status', 'password-change-already-reviewed');
        }

        $passwordChangeRequest->update([
            'status' => PasswordChangeRequest::STATUS_DECLINED,
            'reviewed_by' => $request->user()?->id,
            'reviewed_at' => now(),
            'admin_notes' => $request->input('admin_notes'),
        ]);

        return back()->with('status', 'password-change-declined');
    }
}
