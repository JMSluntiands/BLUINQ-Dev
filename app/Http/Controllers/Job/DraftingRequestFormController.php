<?php

namespace App\Http\Controllers\Job;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;

class DraftingRequestFormController extends Controller
{
    public function create(): RedirectResponse
    {
        return redirect()->route('job.masterlist.create');
    }

    public function store(): RedirectResponse
    {
        return redirect()->route('job.masterlist.create');
    }
}
