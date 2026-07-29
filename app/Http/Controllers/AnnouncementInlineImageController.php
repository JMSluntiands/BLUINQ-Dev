<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AnnouncementInlineImageController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'image' => ['required', 'image', 'max:5120'],
        ]);

        $path = $request->file('image')->store('announcement-inline-images', 'public');
        $filename = basename($path);

        return response()->json([
            'url' => route('announcements.inline-image.show', ['filename' => $filename]),
        ]);
    }

    public function show(string $filename): BinaryFileResponse
    {
        $filename = basename($filename);
        $path = 'announcement-inline-images/'.$filename;
        $fullPath = Storage::disk('public')->path($path);

        if (! is_file($fullPath)) {
            abort(404);
        }

        $mtime = (int) filemtime($fullPath);

        return response()->file($fullPath, [
            'Cache-Control' => 'public, max-age=86400',
            'Last-Modified' => gmdate('D, d M Y H:i:s', $mtime).' GMT',
            'ETag' => '"'.md5($path.'|'.$mtime).'"',
        ]);
    }
}
