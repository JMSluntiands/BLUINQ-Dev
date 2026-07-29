import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    ChevronLeftIcon,
    ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartOutlineIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { Head, Link, router } from '@inertiajs/react';
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

/**
 * @param {{
 *   announcement: {
 *     id: number;
 *     title: string;
 *     description?: string;
 *     image_url?: string | null;
 *     date?: string;
 *     time?: string;
 *     author?: string;
 *     likes_count?: number;
 *     liked_by_me?: boolean;
 *   };
 *   siblings?: Array<{ id: number; title: string; date?: string }>;
 *   prev?: { id: number; title: string } | null;
 *   next?: { id: number; title: string } | null;
 * }} props
 */
export default function Show({
    announcement,
    siblings = [],
    prev = null,
    next = null,
}) {
    const [liking, setLiking] = useState(false);
    const liked = Boolean(announcement.liked_by_me);
    const likesCount = announcement.likes_count ?? 0;

    const toggleLike = () => {
        if (liking) {
            return;
        }

        setLiking(true);
        router.post(
            route('announcements.like', announcement.id),
            {},
            {
                preserveScroll: true,
                onFinish: () => setLiking(false),
            },
        );
    };

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

            <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-12 lg:gap-8">
                <aside className="order-2 min-w-0 lg:order-1 lg:col-span-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-5">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                            Other announcements
                        </h3>
                        {siblings.length === 0 ? (
                            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                                No other announcements.
                            </p>
                        ) : (
                            <ul className="mt-3 max-h-[28rem] space-y-1.5 overflow-y-auto pr-1">
                                {siblings.map((item) => {
                                    const isActive =
                                        item.id === announcement.id;

                                    return (
                                        <li key={item.id}>
                                            <Link
                                                href={route(
                                                    'announcements.show',
                                                    item.id,
                                                )}
                                                className={
                                                    'block w-full rounded-xl border px-3 py-2.5 text-left transition ' +
                                                    (isActive
                                                        ? 'border-sky-200 bg-sky-50 dark:border-sky-500/40 dark:bg-sky-500/10'
                                                        : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60')
                                                }
                                            >
                                                <p
                                                    className={
                                                        'text-sm font-medium leading-snug ' +
                                                        (isActive
                                                            ? 'text-sky-800 dark:text-sky-300'
                                                            : 'text-slate-700 dark:text-slate-200')
                                                    }
                                                >
                                                    {item.title}
                                                </p>
                                                {item.date ? (
                                                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                                        {item.date}
                                                    </p>
                                                ) : null}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </aside>

                <article className="order-1 min-w-0 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-8 lg:order-2 lg:col-span-9">
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

                    <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-4 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={toggleLike}
                            disabled={liking}
                            aria-pressed={liked}
                            aria-label={liked ? 'Unlike' : 'Like'}
                            className={
                                'inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium transition ' +
                                (liked
                                    ? 'text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10'
                                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800') +
                                (liking ? ' cursor-wait opacity-70' : '')
                            }
                        >
                            {liked ? (
                                <HeartSolidIcon
                                    className="h-5 w-5"
                                    aria-hidden
                                />
                            ) : (
                                <HeartOutlineIcon
                                    className="h-5 w-5"
                                    aria-hidden
                                />
                            )}
                            <span className="tabular-nums">{likesCount}</span>
                        </button>

                        <div className="flex items-center gap-2">
                            {prev ? (
                                <Link
                                    href={route(
                                        'announcements.show',
                                        prev.id,
                                    )}
                                    title={prev.title}
                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                    <ChevronLeftIcon
                                        className="h-4 w-4"
                                        aria-hidden
                                    />
                                    Prev
                                </Link>
                            ) : (
                                <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg border border-transparent px-3 py-1.5 text-sm text-slate-300 dark:text-slate-600">
                                    <ChevronLeftIcon
                                        className="h-4 w-4"
                                        aria-hidden
                                    />
                                    Prev
                                </span>
                            )}
                            {next ? (
                                <Link
                                    href={route(
                                        'announcements.show',
                                        next.id,
                                    )}
                                    title={next.title}
                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                    Next
                                    <ChevronRightIcon
                                        className="h-4 w-4"
                                        aria-hidden
                                    />
                                </Link>
                            ) : (
                                <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg border border-transparent px-3 py-1.5 text-sm text-slate-300 dark:text-slate-600">
                                    Next
                                    <ChevronRightIcon
                                        className="h-4 w-4"
                                        aria-hidden
                                    />
                                </span>
                            )}
                        </div>
                    </div>
                </article>
            </div>
        </AuthenticatedLayout>
    );
}
