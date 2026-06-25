import AppLogo from '@/Components/AppLogo';
import ThemeToggle from '@/Components/ThemeToggle';
import { Head, usePage } from '@inertiajs/react';

export default function PublicFormLayout({ children, title = 'BLUINQ' }) {
    const { logo_url: logoUrl } = usePage().props;

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
            <Head title={title} />
            <div className="relative mx-auto w-full min-w-0 max-w-[1400px] px-4 py-8 sm:px-6 sm:py-10">
                <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
                    <ThemeToggle />
                </div>
                <div className="mb-6 flex justify-center sm:mb-8">
                    <AppLogo
                        logoUrl={logoUrl}
                        alt="Bluinq"
                        className="h-12 w-auto object-contain sm:h-14"
                        fallback={null}
                    />
                </div>
                {children}
            </div>
        </div>
    );
}
