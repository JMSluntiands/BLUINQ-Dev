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
     * Uploaded logo lives in storage/. public/logo.png is the Git fallback only.
     *
     * @return list<string>
     */
    public static function directories(): array
    {
        return array_values(array_unique([
            storage_path('app/public'),
            base_path('storage/app/public'),
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

        return route('app.brand-logo', [
            'v' => (string) filemtime($path),
        ]);
    }
}
