<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class TimesheetController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Timesheet/Index');
    }
}
