<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Session\TokenMismatchException;

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
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->reportable(function (TokenMismatchException $e): void {
            logger()->warning('CSRF token mismatch (419)', [
                'url' => request()->fullUrl(),
                'method' => request()->method(),
                'secure' => request()->secure(),
                'ip' => request()->ip(),
                'has_session_cookie' => request()->cookies->has(config('session.cookie')),
                'session_cookie_name' => config('session.cookie'),
            ]);
        });

        $exceptions->renderable(function (TokenMismatchException $e, Request $request) {
            $message = 'Your session expired. Please try again.';

            if ($request->header('X-Inertia')) {
                return redirect()->back()->with('status', $message);
            }

            if ($request->expectsJson()) {
                return response()->json(['message' => $message], 419);
            }

            return redirect()
                ->guest(route('login'))
                ->with('status', $message);
        });
    })->create();
