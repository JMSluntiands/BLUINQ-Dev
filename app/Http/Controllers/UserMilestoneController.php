<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserMilestoneRequest;
use App\Http\Requests\UpdateUserMilestoneRequest;
use App\Models\User;
use App\Models\UserMilestone;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserMilestoneController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->hasPermission('profile.milestones.manage'), 403);

        $search = trim((string) $request->input('search', ''));

        $query = User::query()
            ->active()
            ->with('role:id,slug,name')
            ->withCount('milestones')
            ->orderBy('name');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        return Inertia::render('Settings/UserMilestones/Index', [
            'users' => $query
                ->paginate(10)
                ->withQueryString()
                ->through(fn (User $user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'position' => $user->position,
                    'job_title' => $user->job_title,
                    'role' => $user->role?->name ?? $user->role?->slug,
                    'profile_image_url' => $user->profile_image_url,
                    'milestones_count' => $user->milestones_count,
                ]),
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function show(Request $request, User $user): Response
    {
        abort_unless($request->user()?->hasPermission('profile.milestones.manage'), 403);

        if ($user->archived_at !== null) {
            abort(404);
        }

        $user->loadMissing('role');

        return Inertia::render('Settings/UserMilestones/Show', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'position' => $user->position,
                'job_title' => $user->job_title,
                'role' => $user->role?->name ?? $user->role?->slug,
                'profile_image_url' => $user->profile_image_url,
            ],
            'milestones' => $user->milestones()
                ->with('author:id,name')
                ->get()
                ->map(fn (UserMilestone $milestone) => [
                    'id' => $milestone->id,
                    'milestone_date' => $milestone->milestone_date->format('Y-m-d'),
                    'milestone_date_label' => $milestone->milestone_date->format('M Y'),
                    'title' => $milestone->title,
                    'impact_result' => $milestone->impact_result,
                    'created_by_name' => $milestone->author?->name,
                ]),
        ]);
    }

    public function store(
        StoreUserMilestoneRequest $request,
        User $user,
    ): RedirectResponse {
        if ($user->archived_at !== null) {
            abort(404);
        }

        $user->milestones()->create([
            ...$request->validated(),
            'created_by' => $request->user()?->id,
        ]);

        return back()->with('status', 'milestone-created');
    }

    public function update(
        UpdateUserMilestoneRequest $request,
        User $user,
        UserMilestone $milestone,
    ): RedirectResponse {
        if ($user->archived_at !== null || $milestone->user_id !== $user->id) {
            abort(404);
        }

        $milestone->update($request->validated());

        return back()->with('status', 'milestone-updated');
    }

    public function destroy(
        Request $request,
        User $user,
        UserMilestone $milestone,
    ): RedirectResponse {
        abort_unless($request->user()?->hasPermission('profile.milestones.manage'), 403);

        if ($user->archived_at !== null || $milestone->user_id !== $user->id) {
            abort(404);
        }

        $milestone->delete();

        return back()->with('status', 'milestone-deleted');
    }
}
