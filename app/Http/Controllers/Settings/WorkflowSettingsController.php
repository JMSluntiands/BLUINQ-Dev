<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class WorkflowSettingsController extends Controller
{
    /**
     * @var list<string>
     */
    private const WORKFLOW_VIEW_PERMISSIONS = [
        'settings.service-engaging.view',
        'settings.external-wall-construction.view',
        'settings.roof-type.view',
        'settings.scope-of-work.view',
        'settings.deliverables.view',
        'settings.building-type.view',
        'settings.crm.arrival-input-files.view',
        'settings.crm.categories.view',
        'settings.level-of-difficulty.view',
    ];

    public function index(Request $request): Response|HttpResponse
    {
        $user = $request->user();
        $user?->loadMissing('role');

        $permissions = $user?->role
            ? Permission::slugsForRole($user->role->slug)
            : [];

        $canAccess = collect(self::WORKFLOW_VIEW_PERMISSIONS)
            ->contains(fn (string $slug) => in_array($slug, $permissions, true));

        if (! $canAccess) {
            abort(HttpResponse::HTTP_FORBIDDEN);
        }

        return Inertia::render('Settings/Workflow/Index');
    }
}
