<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Session\TokenMismatchException;
use Inertia\Inertia;
use Symfony\Component\HttpKernel\Exception\HttpException;

$isCsrfMismatch = static function (\Throwable $e): bool {
    if ($e instanceof TokenMismatchException) {
        return true;
    }

    if ($e instanceof HttpException && $e->getStatusCode() === 419) {
        return true;
    }

    return $e->getPrevious() instanceof TokenMismatchException;
};

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Hostinger / reverse proxies terminate TLS; without this, session + CSRF
        // cookies can mismatch on POST (login/logout → 419 Page Expired).
        $middleware->trustProxies(
            at: '*',
            headers: Request::HEADER_X_FORWARDED_FOR
                | Request::HEADER_X_FORWARDED_HOST
                | Request::HEADER_X_FORWARDED_PORT
                | Request::HEADER_X_FORWARDED_PROTO
                | Request::HEADER_X_FORWARDED_AWS_ELB
        );

        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
            \App\Http\Middleware\EnsureUserIsNotArchived::class,
            \App\Http\Middleware\LogSuccessfulWrites::class,
            \App\Http\Middleware\PreventPageCache::class,
        ]);

        $middleware->api(append: [
            \App\Http\Middleware\LogSuccessfulWrites::class,
        ]);

        $middleware->alias([
            'admin' => \App\Http\Middleware\EnsureUserIsAdmin::class,
            'permission.route' => \App\Http\Middleware\EnsureRoutePermission::class,
            'api.permission' => \App\Http\Middleware\EnsureApiPermission::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) use ($isCsrfMismatch): void {
        // Laravel converts TokenMismatchException → HttpException(419) before render,
        // so we must handle HttpException 419 (not only TokenMismatchException).
        $exceptions->reportable(function (Throwable $e) use ($isCsrfMismatch): void {
            if (! $isCsrfMismatch($e)) {
                return;
            }

            logger()->error('CSRF token mismatch (419)', [
                'url' => request()->fullUrl(),
                'method' => request()->method(),
                'secure' => request()->secure(),
                'ip' => request()->ip(),
                'has_session_cookie' => request()->cookies->has(config('session.cookie')),
                'session_cookie_name' => config('session.cookie'),
            ]);
        });

        $exceptions->renderable(function (Throwable $e, Request $request) use ($isCsrfMismatch) {
            if (! $isCsrfMismatch($e)) {
                return null;
            }

            $target = $request->headers->get('referer') ?: url('/');

            // Force a full page reload so the browser picks up a fresh CSRF cookie/token.
            // This is what a manual refresh does — automate it instead of showing 419.
            if ($request->header('X-Inertia')) {
                return Inertia::location($target);
            }

            return redirect()->to($target)->with(
                'status',
                'Your session expired. Please try again.',
            );
        });
    })->create();
