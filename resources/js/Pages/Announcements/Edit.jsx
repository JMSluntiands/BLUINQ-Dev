import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import RichTextEditor from '@/Components/RichTextEditor';
import TextInput from '@/Components/TextInput';
import UploadProgressBar from '@/Components/UploadProgressBar';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { uploadAnnouncementInlineImage } from '@/lib/uploadAnnouncementInlineImage';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

function filterQueryString(filters) {
    const p = new URLSearchParams();
    if (filters?.search) {
        p.set('search', filters.search);
    }
    if (filters?.per_page) {
        p.set('per_page', String(filters.per_page));
    }
    const s = p.toString();
    return s ? `?${s}` : '';
}

export default function Edit({ announcement, listFilters = {} }) {
    const listQs = filterQueryString(listFilters);
    const [imagePreview, setImagePreview] = useState(null);
    const [coverBroken, setCoverBroken] = useState(false);

    const form = useForm({
        title: announcement.title,
        description: announcement.description,
        image: null,
        _method: 'patch',
    });

    useEffect(() => {
        if (!form.data.image) {
            setImagePreview(null);
            return;
        }

        const objectUrl = URL.createObjectURL(form.data.image);
        setImagePreview(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [form.data.image]);

    const displayImage = imagePreview || announcement.image_url || null;

    const coverUploadPercent =
        form.processing && form.progress && form.data.image instanceof File
            ? Math.round(form.progress.percentage ?? 0)
            : null;

    useEffect(() => {
        setCoverBroken(false);
    }, [displayImage]);

    const submit = (e) => {
        e.preventDefault();

        form.transform((data) => {
            const payload = { ...data };
            if (!(payload.image instanceof File)) {
                delete payload.image;
            }

            return payload;
        });

        form.post(route('announcements.update', announcement.id) + listQs, {
            forceFormData: true,
            onFinish: () => form.transform((data) => data),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-slate-800 dark:text-slate-100">
                        Edit announcement
                    </h2>
                    <Link
                        href={route('announcements.index') + listQs}
                        className="text-sm font-medium text-sky-700 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300"
                    >
                        Back to announcements
                    </Link>
                </div>
            }
        >
            <Head title="Edit announcement" />

            <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-8">
                <form onSubmit={submit} className="space-y-6">
                    <div>
                        <InputLabel htmlFor="title" value="Title" />
                        <TextInput
                            id="title"
                            className="mt-1 block w-full"
                            value={form.data.title}
                            onChange={(e) =>
                                form.setData('title', e.target.value)
                            }
                            required
                        />
                        <InputError
                            className="mt-2"
                            message={form.errors.title}
                        />
                    </div>

                    <div>
                        <InputLabel htmlFor="image" value="Cover image" />
                        <div className="mt-1.5 space-y-3">
                            {displayImage && !coverBroken ? (
                                <img
                                    src={displayImage}
                                    alt=""
                                    className="h-40 w-full rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                                    onError={() => setCoverBroken(true)}
                                />
                            ) : (
                                <div className="flex h-40 w-full items-center justify-center rounded-xl bg-slate-100 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                                    <PhotoIcon className="h-10 w-10 text-slate-400 dark:text-slate-500" />
                                </div>
                            )}
                            <label
                                className={
                                    'inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-sky-500 hover:text-sky-600 dark:border-slate-600 dark:text-slate-300 dark:hover:border-sky-500 dark:hover:text-sky-400 ' +
                                    (form.processing
                                        ? 'pointer-events-none opacity-60'
                                        : '')
                                }
                            >
                                <PhotoIcon className="h-4 w-4" />
                                {displayImage && !coverBroken
                                    ? 'Change image'
                                    : 'Upload image'}
                                <input
                                    id="image"
                                    type="file"
                                    accept="image/*"
                                    className="sr-only"
                                    disabled={form.processing}
                                    onChange={(e) =>
                                        form.setData(
                                            'image',
                                            e.target.files?.[0] ?? null,
                                        )
                                    }
                                />
                            </label>
                            {coverUploadPercent !== null ? (
                                <UploadProgressBar
                                    percent={coverUploadPercent}
                                    label="Uploading cover image…"
                                />
                            ) : null}
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Optional. JPG, PNG, or GIF up to 4 MB.
                            </p>
                        </div>
                        <InputError
                            className="mt-2"
                            message={form.errors.image}
                        />
                    </div>

                    <div>
                        <InputLabel htmlFor="description" value="Description" />
                        <div className="mt-1">
                            <RichTextEditor
                                id="description"
                                value={form.data.description}
                                onChange={(html) =>
                                    form.setData('description', html)
                                }
                                placeholder="Write the announcement details…"
                                allowImages
                                uploadImage={uploadAnnouncementInlineImage}
                                disabled={form.processing}
                            />
                        </div>
                        <InputError
                            className="mt-2"
                            message={form.errors.description}
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <PrimaryButton loading={form.processing}>
                            Save changes
                        </PrimaryButton>
                        <Link
                            href={route('announcements.index') + listQs}
                            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
