<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Support\StoredUpload;
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

        $path = StoredUpload::absolutePath($announcement->image);

        if (! is_file($path)) {
            abort(404);
        }

        $mtime = (int) filemtime($path);

        return response()->file($path, [
            'Cache-Control' => 'private, no-cache, must-revalidate',
            'Last-Modified' => gmdate('D, d M Y H:i:s', $mtime).' GMT',
            'ETag' => '"'.md5($announcement->image.'|'.$mtime).'"',
        ]);
    }
}
