<?php

namespace App\Http\Middleware;

use App\Models\Permission;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRoutePermission
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (! $user) {
            return $next($request);
        }

        $user->loadMissing('role');

        $routeName = $request->route()?->getName();
        if (! $routeName) {
            return $next($request);
        }

        $map = config('permissions.routes', []);
        $required = $map[$routeName] ?? null;
        if ($required === null) {
            return $next($request);
        }

        $requiredSlugs = is_array($required) ? $required : [$required];
        $slugs = Permission::slugsForRole($user->role->slug);

        foreach ($requiredSlugs as $slug) {
            if (in_array($slug, $slugs, true)) {
                return $next($request);
            }
        }

        abort(Response::HTTP_FORBIDDEN);
    }
}
