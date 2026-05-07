<?php

namespace App\Http\Middleware;

use App\Models\ActivityLog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LogSuccessfulWrites
{
    /** @var list<string> */
    private const METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

    public function handle(Request $request, Closure $next): Response
    {
        return $next($request);
    }

    public function terminate(Request $request, Response $response): void
    {
        if (! $request->user()) {
            return;
        }

        if (! in_array($request->method(), self::METHODS, true)) {
            return;
        }

        $status = $response->getStatusCode();
        if ($status >= 400) {
            return;
        }

        if ($this->shouldSkip($request)) {
            return;
        }

        $path = $request->path();
        $normalizedPath = $path === '' ? '/' : '/'.$path;

        ActivityLog::query()->create([
            'user_id' => $request->user()->id,
            'method' => $request->method(),
            'route_name' => $request->route()?->getName(),
            'path' => strlen($normalizedPath) > 2048 ? substr($normalizedPath, 0, 2048) : $normalizedPath,
            'status_code' => $status,
        ]);
    }

    private function shouldSkip(Request $request): bool
    {
        $routeName = $request->route()?->getName();
        if ($routeName === 'logout') {
            return true;
        }

        if ($request->is('api/v1/auth/logout')) {
            return true;
        }

        return false;
    }
}
