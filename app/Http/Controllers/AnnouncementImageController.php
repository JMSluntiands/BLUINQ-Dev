<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AnnouncementImageController extends Controller
{
    /**
     * Serve announcement cover from storage/app/public when public/storage symlink is missing.
     */
    public function show(Announcement $announcement): BinaryFileResponse
    {
        if (! $announcement->image || $announcement->isArchived()) {
            abort(404);
        }

        $path = Storage::disk('public')->path($announcement->image);

        if (! is_file($path)) {
            abort(404);
        }

        return response()->file($path, [
            'Cache-Control' => 'private, max-age=3600',
        ]);
    }
}
