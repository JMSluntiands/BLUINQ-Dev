<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\PasswordChangeRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class PasswordController extends Controller
{
    /**
     * Submit a password change request for admin approval.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', Password::defaults(), 'confirmed'],
        ]);

        $user = $request->user();

        PasswordChangeRequest::query()
            ->where('user_id', $user->id)
            ->where('status', PasswordChangeRequest::STATUS_PENDING)
            ->update(['status' => PasswordChangeRequest::STATUS_CANCELLED]);

        PasswordChangeRequest::query()->create([
            'user_id' => $user->id,
            'password' => Hash::make($validated['password']),
            'status' => PasswordChangeRequest::STATUS_PENDING,
        ]);

        return back()->with('status', 'password-change-requested');
    }
}
