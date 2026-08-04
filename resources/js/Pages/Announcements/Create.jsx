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

export default function Create() {
    const [editorKey, setEditorKey] = useState(0);
    const [imagePreview, setImagePreview] = useState(null);
    const form = useForm({
        title: '',
        description: '',
        image: null,
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

    const coverUploadPercent =
        form.processing && form.progress && form.data.image
            ? Math.round(form.progress.percentage ?? 0)
            : null;

    const submit = (e) => {
        e.preventDefault();
        form.post(route('announcements.store'), {
            forceFormData: true,
            onSuccess: () => {
                form.reset('title', 'description', 'image');
                setEditorKey((key) => key + 1);
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-slate-800 dark:text-slate-100">
                        New announcement
                    </h2>
                    <Link
                        href={route('announcements.index')}
                        className="text-sm font-medium text-sky-700 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300"
                    >
                        Back to announcements
                    </Link>
                </div>
            }
        >
            <Head title="New announcement" />

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
                            {imagePreview && (
                                <img
                                    src={imagePreview}
                                    alt=""
                                    className="h-40 w-full rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                                />
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
                                {imagePreview ? 'Change image' : 'Upload image'}
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
                                key={editorKey}
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
                            Post announcement
                        </PrimaryButton>
                        <Link
                            href={route('announcements.index')}
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
