<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ProfileImageController extends Controller
{
    public function show(User $user): BinaryFileResponse
    {
        if (! $user->profile_image) {
            abort(404);
        }

        $path = Storage::disk('public')->path($user->profile_image);

        if (! is_file($path)) {
            abort(404);
        }

        return response()->file($path, [
            'Cache-Control' => 'private, max-age=3600',
        ]);
    }
}
