<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules\Password;

class ProfileApiController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->loadMissing('role');

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'email_verified_at' => $user->email_verified_at,
                'role' => $user->role?->slug,
                'profile_image_url' => $user->profile_image_url,
            ],
        ]);
    }

    public function update(ProfileUpdateRequest $request): JsonResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return response()->json([
            'message' => 'Profile updated.',
            'user' => [
                'id' => $request->user()->id,
                'name' => $request->user()->name,
                'email' => $request->user()->email,
                'email_verified_at' => $request->user()->email_verified_at,
            ],
        ]);
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', Password::defaults(), 'confirmed'],
        ]);

        $request->user()->update([
            'password' => $validated['password'],
        ]);

        return response()->json(['message' => 'Password updated.']);
    }

    public function destroy(Request $request): JsonResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();
        Auth::logout();
        $user->delete();

        return response()->json(['message' => 'Account deleted.']);
    }
}
