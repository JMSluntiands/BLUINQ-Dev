import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import RichTextEditor from '@/Components/RichTextEditor';
import TextInput from '@/Components/TextInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function Create() {
    const [editorKey, setEditorKey] = useState(0);
    const form = useForm({
        title: '',
        description: '',
    });

    const submit = (e) => {
        e.preventDefault();
        form.post(route('announcements.store'), {
            onSuccess: () => {
                form.reset('title', 'description');
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
