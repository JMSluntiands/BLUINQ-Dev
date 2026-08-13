<?php

namespace App\Support;

class AppLogoFile
{
    /**
     * @return list<string>
     */
    public static function names(): array
    {
        return [
            'logo.png',
            'logo.jpg',
            'logo.jpeg',
            'logo.webp',
            'logo.svg',
        ];
    }

    /**
     * Check Laravel storage, the Git deploy storage folder, and public/.
     *
     * @return list<string>
     */
    public static function directories(): array
    {
        return array_values(array_unique([
            storage_path('app/public'),
            base_path('storage/app/public'),
            public_path('storage'),
            public_path(),
        ]));
    }

    public static function path(): ?string
    {
        foreach (self::directories() as $dir) {
            foreach (self::names() as $name) {
                $path = $dir.DIRECTORY_SEPARATOR.$name;
                if (is_file($path)) {
                    return $path;
                }
            }
        }

        return null;
    }

    public static function url(): ?string
    {
        $path = self::path();
        if ($path === null) {
            return null;
        }

        $publicRoot = realpath(public_path()) ?: public_path();
        $realPath = realpath($path) ?: $path;
        $publicPrefix = rtrim(str_replace('\\', '/', $publicRoot), '/').'/';
        $normalized = str_replace('\\', '/', $realPath);

        if (str_starts_with($normalized, $publicPrefix)) {
            $relative = substr($normalized, strlen($publicPrefix));

            return asset($relative);
        }

        return route('app.brand-logo', [
            'v' => (string) filemtime($path),
        ]);
    }
}
