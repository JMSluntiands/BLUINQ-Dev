<?php

namespace App\Http\Controllers;

use App\Support\AppLogoFile;

class BrandLogoController extends Controller
{
    /**
     * Serve app logo when public/storage symlink is missing
     * (common on shared hosting with disabled symlink/exec).
     */
    public function show()
    {
        $path = AppLogoFile::path();
        if ($path === null) {
            abort(404);
        }

        return response()->file($path, [
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }
}
