import AppLogo from '@/Components/AppLogo';
import ThemeToggle from '@/Components/ThemeToggle';
import { Head, useForm, usePage } from '@inertiajs/react';

function BrandMark({ logoUrl, className = 'max-h-10 max-w-[10rem]' }) {
    return (
        <AppLogo
            logoUrl={logoUrl}
            alt="Bluinq"
            className={`block h-auto w-auto object-contain ${className}`}
            fallback={
                <span className="text-2xl font-extrabold tracking-tight text-[#0094FF]">
                    Bluinq
                </span>
            }
        />
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
            <Head title="Login">
                <link
                    rel="stylesheet"
                    href="https://fonts.bunny.net/css?family=plus-jakarta-sans:400,500,600,700,800&display=swap"
                />
            </Head>

            <div
                className={
                    'login-v6 relative flex min-h-screen items-center justify-center overflow-hidden bg-[#06101a] px-4 py-10 ' +
                    (processing ? 'login-page--submitting' : '')
                }
                style={{
                    fontFamily:
                        "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif",
                }}
            >
                <div className="pointer-events-none absolute inset-0" aria-hidden>
                    <div className="absolute -left-24 top-[-20%] h-[70vw] max-h-[520px] w-[70vw] max-w-[520px] rounded-full bg-[#0094FF]/25 blur-[90px]" />
                    <div className="absolute -right-16 bottom-[-15%] h-[55vw] max-h-[420px] w-[55vw] max-w-[420px] rounded-full bg-[#0ea5e9]/20 blur-[100px]" />
                    <div className="login-v6-lines absolute inset-0 opacity-40" />
                </div>

                <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
                    <ThemeToggle className="border border-white/15 bg-white/10 text-white hover:bg-white/20 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/20" />
                </div>

                {processing && (
                    <div
                        className="absolute inset-0 z-40 flex items-center justify-center bg-[#06101a]/75 backdrop-blur-md"
                        aria-busy="true"
                        aria-live="polite"
                    >
                        <div className="flex flex-col items-center gap-5">
                            <div className="relative flex h-28 w-28 items-center justify-center">
                                <span className="login-v6-ring pointer-events-none absolute inset-0 rounded-full" />
                                <span className="login-v6-ring login-v6-ring--slow pointer-events-none absolute inset-2 rounded-full" />
                                <div className="relative z-10 flex h-[4.75rem] w-[4.75rem] items-center justify-center rounded-2xl bg-white p-3 shadow-[0_0_40px_rgba(0,148,255,0.35)]">
                                    <BrandMark
                                        logoUrl={logoUrl}
                                        className="max-h-10 max-w-[3.75rem]"
                                    />
                                </div>
                            </div>
                            <p className="text-sm font-semibold tracking-[0.22em] text-white/90 uppercase">
                                Signing in
                            </p>
                        </div>
                    </div>
                )}

                <main className="relative z-10 w-full max-w-[420px]">
                    <div className="login-v6-card rounded-[30px] border border-white/10 bg-white/8 p-8 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)] backdrop-blur-2xl sm:p-10">
                        <div className="flex flex-col items-center text-center">
                            <div className="flex h-[4.25rem] items-center justify-center rounded-2xl bg-white px-5 py-3 shadow-sm">
                                <BrandMark logoUrl={logoUrl} />
                            </div>
                            <p className="mt-6 text-[11px] font-semibold tracking-[0.28em] text-sky-300 uppercase">
                                Workspace
                            </p>
                            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
                                Welcome back
                            </h1>
                            <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-300">
                                Sign in to continue. Your projects are waiting.
                            </p>
                        </div>

                        {status && (
                            <div
                                className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-center text-sm text-emerald-100"
                                role="status"
                            >
                                {status}
                            </div>
                        )}

                        <form
                            method="post"
                            action={route('login')}
                            className="mt-8 space-y-4"
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
                                    className="mt-2 block w-full rounded-2xl border border-white/15 bg-white/10 px-3.5 py-3 text-white outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white/15 focus:ring-2 focus:ring-sky-400/25"
                                    required
                                />
                                {errors.email && (
                                    <p className="mt-2 text-sm text-rose-300">
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
                                        setData('password', e.target.value)
                                    }
                                    className="mt-2 block w-full rounded-2xl border border-white/15 bg-white/10 px-3.5 py-3 text-white outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white/15 focus:ring-2 focus:ring-sky-400/25"
                                    required
                                />
                                {errors.password && (
                                    <p className="mt-2 text-sm text-rose-300">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            <label className="flex cursor-pointer items-center gap-2.5 pt-1">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) =>
                                        setData('remember', e.target.checked)
                                    }
                                    className="h-4 w-4 rounded border-white/30 bg-white/10 text-[#0094FF] focus:ring-sky-400/40"
                                />
                                <span className="text-sm text-slate-300">
                                    Remember me
                                </span>
                            </label>

                            <button
                                type="submit"
                                disabled={processing}
                                className="mt-1 w-full rounded-2xl bg-[#0094FF] px-4 py-3.5 text-sm font-bold tracking-wide text-white transition hover:bg-[#00a2ff] focus:outline-none focus:ring-2 focus:ring-sky-300/50 focus:ring-offset-2 focus:ring-offset-[#06101a] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {processing ? 'Signing in…' : 'Sign in'}
                            </button>
                        </form>
                    </div>
                </main>
            </div>
        </>
    );
}
