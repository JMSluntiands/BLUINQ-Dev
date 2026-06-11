<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();
        $user->loadMissing('role');

        return Inertia::render('Profile/Edit', [
            'profile' => $this->profilePayload($user),
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => session('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        $user->fill($request->safe()->except('profile_image'));

        if ($request->hasFile('profile_image')) {
            if ($user->profile_image) {
                Storage::disk('public')->delete($user->profile_image);
            }

            $user->profile_image = $request->file('profile_image')->store(
                'profile-images',
                'public',
            );
        }

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        return Redirect::route('profile.edit');
    }

    /**
     * @return array<string, mixed>
     */
    private function profilePayload($user): array
    {
        return [
            'name' => $user->name,
            'email' => $user->email,
            'company_name' => $user->company_name,
            'employee_number' => $user->employee_number,
            'job_title' => $user->job_title,
            'birthday' => $user->birthday?->format('Y-m-d'),
            'personal_details' => $user->personal_details,
            'personal_file_url' => $user->personal_file_url,
            'claims_excel_url' => $user->claims_excel_url,
            'achievements_milestones' => $user->achievements_milestones,
            'profile_image_url' => $user->profile_image_url,
            'role_display_name' => $user->role?->name,
            'email_verified_at' => $user->email_verified_at,
        ];
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
