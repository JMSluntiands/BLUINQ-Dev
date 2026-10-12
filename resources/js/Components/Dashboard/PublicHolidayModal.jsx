import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';

export default function PublicHolidayModal({
    show,
    onClose,
    defaultDate = '',
    holidayRegions = [],
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        region: holidayRegions[0]?.value ?? 'philippines',
        holiday_date: defaultDate,
    });

    useEffect(() => {
        if (!show) {
            return;
        }

        setData((current) => ({
            ...current,
            holiday_date: defaultDate || current.holiday_date,
            region: current.region || holidayRegions[0]?.value || 'philippines',
        }));
    }, [show, defaultDate, holidayRegions, setData]);

    const submit = (event) => {
        event.preventDefault();
        post(route('public-holidays.store'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    return (
        <Modal show={show} onClose={handleClose} maxWidth="lg">
            <form onSubmit={submit} className="p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Add public holiday
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Holidays for the Philippines, Singapore, and Australia show
                    on the calendar and on that region&apos;s timesheet.
                </p>

                <div className="mt-6 space-y-4">
                    <div>
                        <InputLabel htmlFor="holiday_region" value="Country" />
                        <select
                            id="holiday_region"
                            value={data.region}
                            onChange={(event) =>
                                setData('region', event.target.value)
                            }
                            className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                            required
                        >
                            {holidayRegions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <InputError message={errors.region} className="mt-1" />
                    </div>

                    <div>
                        <InputLabel htmlFor="holiday_name" value="Holiday name" />
                        <TextInput
                            id="holiday_name"
                            value={data.name}
                            onChange={(event) =>
                                setData('name', event.target.value)
                            }
                            className="mt-1 block w-full"
                            placeholder="e.g. Special non-working day"
                            required
                        />
                        <InputError message={errors.name} className="mt-1" />
                    </div>

                    <div>
                        <InputLabel htmlFor="holiday_date" value="Date" />
                        <TextInput
                            id="holiday_date"
                            type="date"
                            value={data.holiday_date}
                            onChange={(event) =>
                                setData('holiday_date', event.target.value)
                            }
                            className="mt-1 block w-full"
                            required
                        />
                        <InputError
                            message={errors.holiday_date}
                            className="mt-1"
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <SecondaryButton type="button" onClick={handleClose}>
                        Cancel
                    </SecondaryButton>
                    <PrimaryButton disabled={processing}>
                        Add holiday
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
