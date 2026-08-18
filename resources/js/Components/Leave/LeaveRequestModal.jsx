import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useForm, usePage } from '@inertiajs/react';

function inclusiveDayCount(startDate, endDate) {
    if (!startDate || !endDate) {
        return 0;
    }

    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);

    if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime()) ||
        end < start
    ) {
        return 0;
    }

    return Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
}

function calculateRequestedDays(startDate, endDate, startPortion, endPortion) {
    const baseDays = inclusiveDayCount(startDate, endDate);

    if (!baseDays) {
        return 0;
    }

    let total = baseDays;

    if (startPortion === 'afternoon') {
        total -= 0.5;
    }

    if (endPortion === 'morning') {
        total -= 0.5;
    }

    return Math.max(0.5, total);
}

function formatDays(days) {
    if (!days) {
        return '0';
    }

    return Number.isInteger(days) ? String(days) : days.toFixed(1);
}

export default function LeaveRequestModal({ show, onClose }) {
    const { leaveTypes = [], leaveBalances = null } = usePage().props;

    const { data, setData, post, processing, errors, reset } = useForm({
        start_date: '',
        end_date: '',
        start_portion: 'morning',
        end_portion: 'afternoon',
        day_type: 'whole',
        half_day_portion: 'morning',
        // day_type and half_day_portion are UI-only; start_portion/end_portion are sent to server
        type: 'al',
        reason: '',
        medical_certificate: null,
    });

    const handleDayTypeChange = (value) => {
        setData((prev) => ({
            ...prev,
            day_type: value,
            start_portion: value === 'whole' ? 'morning' : prev.half_day_portion,
            end_portion: value === 'whole' ? 'afternoon' : prev.half_day_portion,
        }));
    };

    const handleHalfDayPortionChange = (value) => {
        setData((prev) => ({
            ...prev,
            half_day_portion: value,
            start_portion: value,
            end_portion: value,
        }));
    };

    const types =
        leaveTypes.length > 0
            ? leaveTypes
            : [{ value: 'al', label: 'Annual Leave', code: 'AL' }];

    const medicalCertificateAfterDays =
        types.find((type) => type.value === 'sl')
            ?.medical_certificate_after_days ?? 2;
    const dayCount = calculateRequestedDays(
        data.start_date,
        data.end_date,
        data.start_portion,
        data.end_portion,
    );
    const needsMedicalCertificate =
        data.type === 'sl' &&
        inclusiveDayCount(data.start_date, data.end_date) >
            medicalCertificateAfterDays;

    const submit = (event) => {
        event.preventDefault();
        post(route('leave.store'), {
            preserveScroll: true,
            forceFormData: true,
            transform: (d) => {
                const { day_type, half_day_portion, ...payload } = d;
                return payload;
            },
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
                    Create leave request
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Submit your request for admin approval. It will appear on the
                    team calendar once approved.
                </p>

                {leaveBalances && (
                    <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-700 dark:bg-slate-800/60 sm:grid-cols-4">
                        <div>
                            <p className="text-slate-500 dark:text-slate-400">AL</p>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                {leaveBalances.al_available}
                            </p>
                        </div>
                        <div>
                            <p className="text-slate-500 dark:text-slate-400">SL</p>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                {leaveBalances.sl_credits}
                            </p>
                        </div>
                        <div>
                            <p className="text-slate-500 dark:text-slate-400">Medical left</p>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                {leaveBalances.medical_remaining}
                            </p>
                        </div>
                        <div>
                            <p className="text-slate-500 dark:text-slate-400">Status</p>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                {leaveBalances.employment_status_label}
                            </p>
                        </div>
                    </div>
                )}

                {!leaveBalances?.entitled && (
                    <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
                        Probationary/training staff are not entitled to AL, SL, or
                        HL. You may still request other leave types for approval.
                    </p>
                )}

                <div className="mt-6 space-y-4">
                    <div>
                        <InputLabel htmlFor="leave_type" value="Type" />
                        <select
                            id="leave_type"
                            value={data.type}
                            onChange={(event) =>
                                setData('type', event.target.value)
                            }
                            className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                        >
                            {types.map((type) => (
                                <option key={type.value} value={type.value}>
                                    {type.code} — {type.label}
                                </option>
                            ))}
                        </select>
                        <InputError message={errors.type} className="mt-1" />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <InputLabel
                                htmlFor="start_date"
                                value="Start date"
                            />
                            <TextInput
                                id="start_date"
                                type="date"
                                value={data.start_date}
                                onChange={(event) =>
                                    setData('start_date', event.target.value)
                                }
                                className="mt-1 block w-full"
                                required
                            />
                            <InputError
                                message={errors.start_date}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <InputLabel htmlFor="end_date" value="End date" />
                            <TextInput
                                id="end_date"
                                type="date"
                                value={data.end_date}
                                onChange={(event) =>
                                    setData('end_date', event.target.value)
                                }
                                className="mt-1 block w-full"
                                required
                            />
                            <InputError
                                message={errors.end_date}
                                className="mt-1"
                            />
                        </div>
                    </div>

                    <div>
                        <InputLabel value="Day type" />
                        <div className="mt-1 flex gap-3">
                            {[
                                { value: 'whole', label: 'Whole day' },
                                { value: 'half', label: 'Half day' },
                            ].map(({ value, label }) => (
                                <label
                                    key={value}
                                    className={
                                        'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition ' +
                                        (data.day_type === value
                                            ? 'border-sky-500 bg-sky-50 text-sky-700 dark:border-sky-400 dark:bg-sky-500/10 dark:text-sky-300'
                                            : 'border-slate-300 bg-white text-slate-700 hover:border-sky-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200')
                                    }
                                >
                                    <input
                                        type="radio"
                                        name="day_type"
                                        value={value}
                                        checked={data.day_type === value}
                                        onChange={() => handleDayTypeChange(value)}
                                        className="sr-only"
                                    />
                                    {label}
                                </label>
                            ))}
                        </div>
                        <InputError message={errors.start_portion} className="mt-1" />
                        <InputError message={errors.end_portion} className="mt-1" />
                    </div>

                    {data.day_type === 'half' && (
                        <div>
                            <InputLabel htmlFor="half_day_portion" value="Which half?" />
                            <select
                                id="half_day_portion"
                                value={data.half_day_portion}
                                onChange={(event) =>
                                    handleHalfDayPortionChange(event.target.value)
                                }
                                className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                            >
                                <option value="morning">Morning</option>
                                <option value="afternoon">Afternoon</option>
                            </select>
                        </div>
                    )}

                    {dayCount > 0 && (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            This request will use{' '}
                            <span className="font-semibold text-slate-900 dark:text-white">
                                {formatDays(dayCount)}
                            </span>{' '}
                            day{dayCount === 1 ? '' : 's'} of leave.
                        </p>
                    )}

                    {data.type === 'sl' && (
                        <p className="rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-800 dark:bg-sky-500/10 dark:text-sky-200">
                            A medical certificate is required for more than{' '}
                            {medicalCertificateAfterDays} consecutive sick leave
                            days.
                        </p>
                    )}

                    {needsMedicalCertificate && (
                        <div>
                            <InputLabel
                                htmlFor="medical_certificate"
                                value="Medical certificate"
                            />
                            <input
                                id="medical_certificate"
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                                onChange={(event) =>
                                    setData(
                                        'medical_certificate',
                                        event.target.files?.[0] ?? null,
                                    )
                                }
                                className="mt-1 block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-sky-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-sky-700 hover:file:bg-sky-100 dark:text-slate-200 dark:file:bg-sky-500/20 dark:file:text-sky-300"
                                required
                            />
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                PDF, JPG, or PNG. Maximum 10 MB.
                            </p>
                            <InputError
                                message={errors.medical_certificate}
                                className="mt-1"
                            />
                        </div>
                    )}

                    <div>
                        <InputLabel htmlFor="reason" value="Reason" />
                        <textarea
                            id="reason"
                            value={data.reason}
                            onChange={(event) =>
                                setData('reason', event.target.value)
                            }
                            rows={3}
                            required
                            className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                            placeholder="Brief reason for your request..."
                        />
                        <InputError message={errors.reason} className="mt-1" />
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <SecondaryButton type="button" onClick={handleClose}>
                        Cancel
                    </SecondaryButton>
                    <PrimaryButton type="submit" loading={processing}>
                        Submit request
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
