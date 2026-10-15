import FlashNoticeModal from '@/Components/FlashNoticeModal';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

const FLASH_MESSAGES = {
    'public-holiday-created': 'Public holiday added.',
    'public-holidays-created': 'Public holidays added.',
    'public-holiday-deleted': 'Public holiday removed.',
};

const fieldClass =
    'block w-full rounded-lg border-slate-300 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100';

function blankHoliday(region = 'philippines') {
    return {
        key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        region,
        holiday_date: '',
        name: '',
        repeats_yearly: false,
    };
}

export default function Index({
    holidays = [],
    year,
    years = [],
    regions = [],
}) {
    const [showModal, setShowModal] = useState(false);
    const defaultRegion = regions[0]?.value ?? 'philippines';
    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            holidays: [blankHoliday(defaultRegion)],
        });

    const changeYear = (nextYear) => {
        router.get(
            route('public-holidays.index'),
            { year: nextYear },
            { preserveState: true, preserveScroll: true },
        );
    };

    const closeModal = () => {
        setShowModal(false);
        clearErrors();
        reset();
        setData('holidays', [blankHoliday(defaultRegion)]);
    };

    const updateRow = (index, field, value) => {
        setData(
            'holidays',
            data.holidays.map((row, rowIndex) =>
                rowIndex === index ? { ...row, [field]: value } : row,
            ),
        );
    };

    const addRow = () => {
        const region =
            data.holidays[data.holidays.length - 1]?.region ?? defaultRegion;
        setData('holidays', [...data.holidays, blankHoliday(region)]);
    };

    const removeRow = (index) => {
        setData(
            'holidays',
            data.holidays.filter((_, rowIndex) => rowIndex !== index),
        );
    };

    const submit = (event) => {
        event.preventDefault();
        post(route('public-holidays.store'), {
            preserveScroll: true,
            onSuccess: () => {
                closeModal();
            },
            onError: () => {
                setShowModal(true);
            },
        });
    };

    const removeHoliday = (holiday) => {
        router.delete(route('public-holidays.destroy', holiday.id), {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-slate-800 dark:text-slate-100">
                    Holidays
                </h2>
            }
        >
            <Head title="Holidays" />
            <FlashNoticeModal messages={FLASH_MESSAGES} />

            <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700/70 dark:bg-slate-900/90">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Holidays for the Philippines, Singapore, and Australia.
                        A yearly holiday keeps the same month and day every
                        year.
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                            Year
                            <select
                                value={year}
                                onChange={(event) =>
                                    changeYear(event.target.value)
                                }
                                className="rounded-lg border-slate-300 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                            >
                                {years.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <button
                            type="button"
                            onClick={() => setShowModal(true)}
                            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500"
                        >
                            <PlusIcon className="h-4 w-4" aria-hidden />
                            Add holiday
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 text-sm dark:divide-slate-800">
                        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                            <tr>
                                <th className="px-5 py-3">Country</th>
                                <th className="px-5 py-3">Date</th>
                                <th className="px-5 py-3">Holiday</th>
                                <th className="px-5 py-3">Repeat yearly</th>
                                <th className="px-5 py-3 text-right"> </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {holidays.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-5 py-10 text-center text-slate-500 dark:text-slate-400"
                                    >
                                        No holidays for {year}.
                                    </td>
                                </tr>
                            ) : (
                                holidays.map((holiday) => (
                                    <tr key={holiday.key}>
                                        <td className="whitespace-nowrap px-5 py-3 font-medium text-slate-800 dark:text-slate-100">
                                            {holiday.country_label}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-slate-600 dark:text-slate-300">
                                            {holiday.display_date}
                                        </td>
                                        <td className="px-5 py-3 text-slate-800 dark:text-slate-100">
                                            {holiday.name}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-slate-600 dark:text-slate-300">
                                            {holiday.repeats_yearly
                                                ? 'Yearly'
                                                : '—'}
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            {holiday.manual && holiday.id ? (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeHoliday(holiday)
                                                    }
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
                                                    aria-label={`Remove ${holiday.name}`}
                                                >
                                                    <TrashIcon
                                                        className="h-4 w-4"
                                                        aria-hidden
                                                    />
                                                </button>
                                            ) : null}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal show={showModal} onClose={closeModal} maxWidth="4xl">
                <form onSubmit={submit} className="p-6">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Add holiday
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Add one or more holidays for the Philippines, Singapore,
                        or Australia.
                    </p>

                    <div className="mt-6 space-y-3">
                        {data.holidays.map((row, index) => (
                            <div
                                key={row.key}
                                className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,1.2fr)_auto_auto] sm:items-end dark:border-slate-700"
                            >
                                <div>
                                    <InputLabel
                                        htmlFor={`holiday_region_${index}`}
                                        value="Country"
                                    />
                                    <select
                                        id={`holiday_region_${index}`}
                                        value={row.region}
                                        onChange={(event) =>
                                            updateRow(
                                                index,
                                                'region',
                                                event.target.value,
                                            )
                                        }
                                        className={`mt-1 ${fieldClass}`}
                                        required
                                    >
                                        {regions.map((option) => (
                                            <option
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError
                                        message={errors[`holidays.${index}.region`]}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <InputLabel
                                        htmlFor={`holiday_date_${index}`}
                                        value="Date"
                                    />
                                    <TextInput
                                        id={`holiday_date_${index}`}
                                        type="date"
                                        value={row.holiday_date}
                                        onChange={(event) =>
                                            updateRow(
                                                index,
                                                'holiday_date',
                                                event.target.value,
                                            )
                                        }
                                        className="mt-1 block w-full"
                                        required
                                    />
                                    <InputError
                                        message={
                                            errors[`holidays.${index}.holiday_date`]
                                        }
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <InputLabel
                                        htmlFor={`holiday_name_${index}`}
                                        value="Holiday"
                                    />
                                    <TextInput
                                        id={`holiday_name_${index}`}
                                        value={row.name}
                                        onChange={(event) =>
                                            updateRow(
                                                index,
                                                'name',
                                                event.target.value,
                                            )
                                        }
                                        className="mt-1 block w-full"
                                        placeholder="Holiday name"
                                        required
                                    />
                                    <InputError
                                        message={errors[`holidays.${index}.name`]}
                                        className="mt-1"
                                    />
                                </div>
                                <label className="inline-flex items-center gap-2 pb-2 text-sm text-slate-700 dark:text-slate-200">
                                    <input
                                        type="checkbox"
                                        checked={row.repeats_yearly}
                                        onChange={(event) =>
                                            updateRow(
                                                index,
                                                'repeats_yearly',
                                                event.target.checked,
                                            )
                                        }
                                        className="rounded border-slate-300 text-sky-600 shadow-sm focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800"
                                    />
                                    Repeat yearly
                                </label>
                                {data.holidays.length > 1 ? (
                                    <button
                                        type="button"
                                        onClick={() => removeRow(index)}
                                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
                                        aria-label={`Remove row ${index + 1}`}
                                    >
                                        <TrashIcon className="h-4 w-4" aria-hidden />
                                    </button>
                                ) : (
                                    <span className="hidden h-10 w-10 sm:block" />
                                )}
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={addRow}
                        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sky-700 transition hover:text-sky-600 dark:text-sky-300"
                    >
                        <PlusIcon className="h-4 w-4" aria-hidden />
                        Add row
                    </button>

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={closeModal}>
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton disabled={processing}>
                            Add holiday
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
