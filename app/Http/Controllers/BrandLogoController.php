<?php

namespace App\Http\Controllers;

class BrandLogoController extends Controller
{
    /**
     * Serve app logo from storage/app/public when public/storage symlink is missing
     * (common on shared hosting with disabled symlink/exec).
     */
    public function show()
    {
        $dir = storage_path('app/public');
        $names = [
            'logo.png',
            'logo.jpg',
            'logo.jpeg',
            'logo.webp',
            'logo.svg',
        ];

        foreach ($names as $name) {
            $path = $dir.DIRECTORY_SEPARATOR.$name;
            if (is_file($path)) {
                return response()->file($path, [
                    'Cache-Control' => 'public, max-age=86400',
                ]);
            }
        }

        abort(404);
    }
}
