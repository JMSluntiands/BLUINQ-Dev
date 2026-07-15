import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';

const EVENT_CATEGORIES = [
    { value: 'meeting', label: 'Meeting' },
    { value: 'party', label: 'Party / celebration' },
    { value: 'team_schedule', label: 'Team schedule' },
    { value: 'other', label: 'Other' },
];

export default function CalendarEventModal({ show, onClose, defaultDate = '' }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        category: 'meeting',
        start_date: defaultDate,
        end_date: defaultDate,
        description: '',
    });

    useEffect(() => {
        if (!show) {
            return;
        }

        setData((current) => ({
            ...current,
            start_date: defaultDate || current.start_date,
            end_date: defaultDate || current.end_date,
        }));
    }, [show, defaultDate, setData]);

    const submit = (event) => {
        event.preventDefault();
        post(route('calendar-events.store'), {
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
                    Add calendar event
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Team meetings, parties, schedules, and other events appear on
                    the dashboard calendar for everyone.
                </p>

                <div className="mt-6 space-y-4">
                    <div>
                        <InputLabel htmlFor="event_title" value="Title" />
                        <TextInput
                            id="event_title"
                            value={data.title}
                            onChange={(event) =>
                                setData('title', event.target.value)
                            }
                            className="mt-1 block w-full"
                            placeholder="e.g. Xmas party, Team standup"
                            required
                        />
                        <InputError message={errors.title} className="mt-1" />
                    </div>

                    <div>
                        <InputLabel htmlFor="event_category" value="Type" />
                        <select
                            id="event_category"
                            value={data.category}
                            onChange={(event) =>
                                setData('category', event.target.value)
                            }
                            className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                        >
                            {EVENT_CATEGORIES.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <InputError message={errors.category} className="mt-1" />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <InputLabel
                                htmlFor="event_start_date"
                                value="Start date"
                            />
                            <TextInput
                                id="event_start_date"
                                type="date"
                                value={data.start_date}
                                onChange={(event) => {
                                    const value = event.target.value;
                                    setData((current) => ({
                                        ...current,
                                        start_date: value,
                                        end_date:
                                            !current.end_date ||
                                            current.end_date < value
                                                ? value
                                                : current.end_date,
                                    }));
                                }}
                                className="mt-1 block w-full"
                                required
                            />
                            <InputError
                                message={errors.start_date}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="event_end_date"
                                value="End date"
                            />
                            <TextInput
                                id="event_end_date"
                                type="date"
                                value={data.end_date}
                                min={data.start_date || undefined}
                                onChange={(event) =>
                                    setData('end_date', event.target.value)
                                }
                                className="mt-1 block w-full"
                            />
                            <InputError
                                message={errors.end_date}
                                className="mt-1"
                            />
                        </div>
                    </div>

                    <div>
                        <InputLabel
                            htmlFor="event_description"
                            value="Notes (optional)"
                        />
                        <textarea
                            id="event_description"
                            value={data.description}
                            onChange={(event) =>
                                setData('description', event.target.value)
                            }
                            rows={3}
                            className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                            placeholder="Location, agenda, or other details"
                        />
                        <InputError
                            message={errors.description}
                            className="mt-1"
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <SecondaryButton type="button" onClick={handleClose}>
                        Cancel
                    </SecondaryButton>
                    <PrimaryButton disabled={processing}>
                        Add event
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
