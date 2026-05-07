import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { Head, useForm, usePage } from '@inertiajs/react';

/** Subtle blueprint / architectural line texture for the login brand column */
function ArchitectLineBackground() {
    return (
        <svg
            className="pointer-events-none absolute inset-0 h-full w-full text-slate-400/35"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            aria-hidden
        >
            <defs>
                <pattern
                    id="login-arch-grid"
                    width="56"
                    height="56"
                    patternUnits="userSpaceOnUse"
                >
                    <path
                        d="M 56 0 L 0 0 0 56"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="0.6"
                    />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="white" />
            <rect width="100%" height="100%" fill="url(#login-arch-grid)" />
            <g
                fill="none"
                stroke="currentColor"
                strokeWidth="0.75"
                vectorEffect="non-scaling-stroke"
            >
                {/* Vanishing diagonals */}
                <line x1="0%" y1="100%" x2="50%" y2="35%" />
                <line x1="100%" y1="100%" x2="50%" y2="35%" />
                <line x1="0%" y1="75%" x2="50%" y2="25%" />
                <line x1="100%" y1="75%" x2="50%" y2="25%" />
                {/* Horizontal “construction” lines */}
                <line x1="0%" y1="18%" x2="100%" y2="18%" strokeDasharray="4 8" />
                <line x1="0%" y1="42%" x2="72%" y2="42%" strokeDasharray="3 6" />
                <line x1="28%" y1="68%" x2="100%" y2="68%" strokeDasharray="3 6" />
                {/* Vertical accents */}
                <line x1="12%" y1="0%" x2="12%" y2="100%" strokeDasharray="2 10" />
                <line x1="88%" y1="0%" x2="88%" y2="100%" strokeDasharray="2 10" />
                {/* Light framing */}
                <rect
                    x="6%"
                    y="8%"
                    width="88%"
                    height="72%"
                    rx="4"
                    strokeDasharray="6 4"
                    opacity="0.6"
                />
            </g>
        </svg>
    );
}

export default function Login({ status }) {
    const { logo_url: logoUrl } = usePage().props;
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Login" />
            <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
                {/* Left: white + architectural lines + logo */}
                <div className="relative flex min-h-[36vh] flex-col items-center justify-center overflow-hidden bg-white px-8 py-12 lg:min-h-screen lg:py-16">
                    <ArchitectLineBackground />
                    <div className="relative z-10 flex w-full flex-col items-center justify-center">
                        {logoUrl ? (
                            <img
                                src={logoUrl}
                                alt=""
                                className="mx-auto block h-auto max-h-24 w-auto max-w-[min(100%,14rem)] object-contain object-center lg:max-h-28"
                            />
                        ) : (
                            <h1 className="w-full text-center text-3xl font-semibold tracking-tight text-slate-800">
                                Bluinq
                            </h1>
                        )}
                    </div>
                </div>

                {/* Right: dark + form (login animations only on this column) */}
                <div
                    className={
                        'relative flex flex-col justify-center overflow-hidden bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-950 to-slate-950 px-4 py-12 transition-[box-shadow] duration-300 sm:px-8 lg:min-h-screen lg:px-12 lg:py-16 ' +
                        (processing ? 'login-column--submitting' : '')
                    }
                >
                    {processing && (
                        <div
                            className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-slate-950/45 backdrop-blur-[3px]"
                            aria-busy="true"
                            aria-live="polite"
                        >
                            <ArrowPathIcon
                                className="h-12 w-12 text-sky-400 drop-shadow-lg motion-safe:animate-spin"
                                aria-hidden
                            />
                            <p className="text-sm font-semibold tracking-wide text-sky-200">
                                Signing in…
                            </p>
                        </div>
                    )}

                    <div className="relative z-10 mx-auto w-full max-w-md">
                        <p className="text-center text-base font-bold tracking-tight text-slate-300 lg:text-left">
                            Sign in to your account
                        </p>

                        <div className="mt-8 rounded-2xl bg-slate-900/60 px-6 py-8 backdrop-blur-sm">
                            {status && (
                                <div
                                    className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"
                                    role="status"
                                >
                                    {status}
                                </div>
                            )}

                            <form
                                className="space-y-6"
                                onSubmit={submit}
                                noValidate
                            >
                                <div>
                                    <label
                                        htmlFor="email"
                                        className="block text-sm font-medium text-slate-200"
                                    >
                                        Email
                                    </label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="username"
                                        value={data.email}
                                        onChange={(e) =>
                                            setData('email', e.target.value)
                                        }
                                        className="mt-2 block w-full rounded-lg border border-slate-600 bg-slate-950/80 px-3 py-2.5 text-slate-100 placeholder-slate-500 shadow-sm outline-none ring-sky-500 transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
                                        required
                                    />
                                    {errors.email && (
                                        <p className="mt-2 text-sm text-rose-400">
                                            {errors.email}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor="password"
                                        className="block text-sm font-medium text-slate-200"
                                    >
                                        Password
                                    </label>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        value={data.password}
                                        onChange={(e) =>
                                            setData(
                                                'password',
                                                e.target.value,
                                            )
                                        }
                                        className="mt-2 block w-full rounded-lg border border-slate-600 bg-slate-950/80 px-3 py-2.5 text-slate-100 placeholder-slate-500 shadow-sm outline-none ring-sky-500 transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
                                        required
                                    />
                                    {errors.password && (
                                        <p className="mt-2 text-sm text-rose-400">
                                            {errors.password}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center justify-between">
                                    <label className="flex cursor-pointer items-center gap-2">
                                        <input
                                            type="checkbox"
                                            name="remember"
                                            checked={data.remember}
                                            onChange={(e) =>
                                                setData(
                                                    'remember',
                                                    e.target.checked,
                                                )
                                            }
                                            className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-sky-500 focus:ring-sky-500/40"
                                        />
                                        <span className="text-sm text-slate-300">
                                            Remember me
                                        </span>
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex w-full justify-center rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-900/40 transition hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {processing ? 'Signing in…' : 'Sign in'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
