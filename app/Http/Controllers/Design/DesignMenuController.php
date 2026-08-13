<?php

namespace App\Http\Controllers\Design;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class DesignMenuController extends Controller
{
    public function memos(): Response
    {
        return Inertia::render('Design/Memos', [
            'title' => 'Design Memos',
        ]);
    }

    public function catalogue(): Response
    {
        return Inertia::render('Design/Catalogue', [
            'title' => 'Design Catalogue',
        ]);
    }
}
