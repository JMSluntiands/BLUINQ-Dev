<?php

namespace App\Http\Middleware;

use App\Models\Permission;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureApiPermission
{
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();
        if ($user === null) {
            return response()->json(['message' => 'Unauthenticated.'], Response::HTTP_UNAUTHORIZED);
        }

        $user->loadMissing('role');

        $slugs = Permission::slugsForRole($user->role->slug);
        if (! in_array($permission, $slugs, true)) {
            return response()->json(['message' => 'You do not have permission for this action.'], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
