<?php

namespace App\Http\Controllers\Job;

use App\Http\Controllers\Controller;
use App\Support\AnnouncementHtml;
use App\Support\StoredUpload;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class DraftingCommentInlineImageController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'image' => ['required', 'image', 'max:5120'],
        ]);

        $path = StoredUpload::store($request->file('image'), 'drafting-comment-inline-images');
        $filename = basename($path);

        return response()->json([
            'url' => AnnouncementHtml::relativeInlineImageUrl(
                'job.drafting.comments.inline-image.show',
                $filename,
            ),
        ]);
    }

    public function show(string $filename): BinaryFileResponse
    {
        $filename = basename($filename);
        $path = 'drafting-comment-inline-images/'.$filename;
        $fullPath = StoredUpload::absolutePath($path);

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
