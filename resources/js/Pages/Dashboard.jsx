import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';

const STAT_CARD_SOLIDS = [
    'bg-blue-600',
    'bg-emerald-600',
    'bg-violet-600',
    'bg-amber-500',
];

function roleLabel(role) {
    if (role === 'admin') {
        return 'Administrator';
    }
    if (role === 'user') {
        return 'User';
    }
    return role ?? '—';
}

function formatCount(n) {
    const num = Number(n);
    if (Number.isNaN(num)) {
        return '—';
    }
    return num.toLocaleString();
}

export default function Dashboard() {
    const { auth, stats = [] } = usePage().props;
    const role = auth.user?.role;

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-slate-800">
                    Dashboard
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, index) => (
                    <div
                        key={stat.label}
                        className={`min-w-0 w-full ${STAT_CARD_SOLIDS[index] ?? 'bg-slate-600'} rounded-2xl px-5 py-6 text-white shadow-md`}
                    >
                        <p className="text-sm font-medium text-white/90">
                            {stat.label}
                        </p>
                        <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight">
                            {formatCount(stat.value)}
                        </p>
                    </div>
                ))}
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-lg font-medium text-slate-900">
                        You are signed in.
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                        Role:{' '}
                        <span className="font-semibold text-slate-800">
                            {roleLabel(role)}
                        </span>
                    </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-sky-50 to-white p-6 shadow-sm">
                    <h3 className="text-sm font-medium text-slate-500">
                        Quick tip
                    </h3>
                    <p className="mt-2 text-sm text-slate-600">
                        Use the sidebar to move between sections. On mobile, open
                        the menu from the top bar.
                    </p>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
