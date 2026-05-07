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

        $routeName = $request->route()?->getName();
        if (! $routeName) {
            return $next($request);
        }

        $map = config('permissions.routes', []);
        $slug = $map[$routeName] ?? null;
        if ($slug === null) {
            return $next($request);
        }

        $slugs = Permission::slugsForRole($user->role->value);
        if (! in_array($slug, $slugs, true)) {
            abort(Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
