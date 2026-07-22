import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

function AnnouncementCover({ imageUrl, title }) {
    const [imageFailed, setImageFailed] = useState(false);
    const showImage = Boolean(imageUrl) && !imageFailed;

    if (!showImage) {
        return null;
    }

    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
            <img
                src={imageUrl}
                alt={title}
                className="h-52 w-full object-cover sm:h-72"
                onError={() => setImageFailed(true)}
            />
        </div>
    );
}

export default function Show({ announcement }) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-slate-800 dark:text-slate-100">
                        Announcement
                    </h2>
                    <Link
                        href={route('dashboard')}
                        className="text-sm font-medium text-sky-700 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300"
                    >
                        Back to dashboard
                    </Link>
                </div>
            }
        >
            <Head title={announcement.title} />

            <article className="mx-auto max-w-3xl space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-8">
                <AnnouncementCover
                    imageUrl={announcement.image_url}
                    title={announcement.title}
                />

                <div>
                    <h1 className="text-2xl font-semibold leading-snug text-slate-900 dark:text-white">
                        {announcement.title}
                    </h1>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        {announcement.date} · {announcement.time} ·{' '}
                        {announcement.author}
                    </p>
                </div>

                <div
                    className="rich-text-content text-sm leading-relaxed text-slate-700 dark:text-slate-300 [&_a]:text-sky-600 [&_a]:underline dark:[&_a]:text-sky-400 [&_blockquote]:border-l-2 [&_blockquote]:border-slate-300 [&_blockquote]:pl-3 [&_blockquote]:text-slate-500 dark:[&_blockquote]:border-slate-600 dark:[&_blockquote]:text-slate-400 [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_img]:my-3 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-lg [&_li]:mb-1 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5"
                    dangerouslySetInnerHTML={{
                        __html: announcement.description || '<p>—</p>',
                    }}
                />
            </article>
        </AuthenticatedLayout>
    );
}
