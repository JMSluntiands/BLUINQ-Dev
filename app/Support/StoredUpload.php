<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * User-uploaded files live only under storage/ (Laravel "public" disk =
 * storage/app/public). Never write into public/. Serve via app routes,
 * not /storage symlink URLs.
 */
final class StoredUpload
{
    public const DISK = 'public';

    public static function store(UploadedFile $file, string $directory): string
    {
        return $file->store($directory, self::DISK);
    }

    public static function delete(?string $path): void
    {
        if (! filled($path)) {
            return;
        }

        Storage::disk(self::DISK)->delete($path);
    }

    public static function exists(?string $path): bool
    {
        return filled($path) && Storage::disk(self::DISK)->exists($path);
    }

    public static function absolutePath(string $path): string
    {
        return Storage::disk(self::DISK)->path($path);
    }

    public static function mtime(?string $path): ?int
    {
        if (! self::exists($path)) {
            return null;
        }

        $mtime = @filemtime(self::absolutePath($path));

        return $mtime === false ? null : $mtime;
    }
}
