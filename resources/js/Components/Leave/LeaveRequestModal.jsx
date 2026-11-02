import DateRangePicker from '@/Components/DateRangePicker';
import FileDropzone from '@/Components/FileDropzone';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { countLeaveDays, formatLeaveCredits } from '@/utils/leaveDays';
import { useForm, usePage } from '@inertiajs/react';

function formatDays(days) {
    if (!days) {
        return '0';
    }

    const rounded = Math.round(Number(days) * 100) / 100;

    if (Number.isInteger(rounded)) {
        return String(rounded);
    }

    return String(rounded);
}

export default function LeaveRequestModal({
    show,
    onClose,
    canManageLeave = false,
    leaveRequestUsers = [],
    currentUserId = null,
}) {
    const {
        leaveTypes = [],
        leaveBalances = null,
        leaveHolidayConfig = {},
        auth,
    } = usePage().props;

    const { data, setData, post, processing, errors, reset } = useForm({
        user_id: currentUserId ? String(currentUserId) : '',
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
    const requestingForSelf =
        !canManageLeave || String(data.user_id || '') === String(currentUserId || '');
    const selectedUser = canManageLeave
        ? leaveRequestUsers.find(
              (user) => String(user.id) === String(data.user_id || currentUserId || ''),
          ) ?? null
        : null;
    const holidayRegion =
        selectedUser?.holiday_region ?? auth.user?.holiday_region ?? null;
    const holidayDates = holidayRegion
        ? Object.values(leaveHolidayConfig?.[holidayRegion] ?? {}).flatMap((yearHolidays) =>
              Object.keys(yearHolidays ?? {}),
          )
        : [];

    const medicalCertificateAfterDays =
        types.find((type) => type.value === 'sl')
            ?.medical_certificate_after_days ?? 2;
    const dayCount = countLeaveDays(
        data.start_date,
        data.end_date,
        data.start_portion,
        data.end_portion,
        holidayDates,
    );
    const needsMedicalCertificate =
        data.type === 'sl' &&
        dayCount >
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
        <Modal show={show} onClose={handleClose} maxWidth="2xl">
            <form onSubmit={submit} className="p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Create leave request
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {canManageLeave
                        ? 'Create a leave request for yourself or another user. It will appear on the team calendar once approved.'
                        : 'Submit your request for admin approval. It will appear on the team calendar once approved.'}
                </p>

                {leaveBalances && requestingForSelf && (
                    <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-700 dark:bg-slate-800/60 sm:grid-cols-4">
                        <div>
                            <p className="text-slate-500 dark:text-slate-400">AL</p>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                {formatLeaveCredits(leaveBalances.al_available)}
                            </p>
                        </div>
                        <div>
                            <p className="text-slate-500 dark:text-slate-400">SL</p>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                {formatLeaveCredits(leaveBalances.sl_credits)}
                            </p>
                        </div>
                        <div>
                            <p className="text-slate-500 dark:text-slate-400">Medical left</p>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                {formatLeaveCredits(leaveBalances.medical_remaining)}
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

                {!leaveBalances?.entitled && requestingForSelf && (
                    <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
                        Probationary/training staff are not entitled to AL, SL, or
                        HL. You may still request other leave types for approval.
                    </p>
                )}

                <div className="mt-5 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                    {canManageLeave && (
                        <div>
                            <InputLabel htmlFor="leave_user_id" value="User" />
                            <select
                                id="leave_user_id"
                                value={data.user_id}
                                onChange={(event) =>
                                    setData('user_id', event.target.value)
                                }
                                className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                            >
                                {leaveRequestUsers.map((user) => (
                                    <option key={user.id} value={String(user.id)}>
                                        {user.email
                                            ? `${user.name} (${user.email})`
                                            : user.name}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.user_id} className="mt-1" />
                        </div>
                    )}

                    <div className={canManageLeave ? '' : 'sm:col-span-2'}>
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

                    <div>
                        <InputLabel htmlFor="leave_dates" value="Leave dates" />
                        <DateRangePicker
                            id="leave_dates"
                            className="mt-1"
                            startDate={data.start_date}
                            endDate={data.end_date}
                            holidayDates={holidayDates}
                            placeholder="Select start and end date"
                            onChange={({ start, end }) =>
                                setData((prev) => ({
                                    ...prev,
                                    start_date: start,
                                    end_date: end,
                                }))
                            }
                        />
                        <InputError message={errors.start_date} className="mt-1" />
                        <InputError message={errors.end_date} className="mt-1" />
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
                        {data.day_type === 'half' && (
                            <select
                                id="half_day_portion"
                                aria-label="Which half?"
                                value={data.half_day_portion}
                                onChange={(event) =>
                                    handleHalfDayPortionChange(event.target.value)
                                }
                                className="mt-2 block w-full rounded-lg border-slate-300 py-1.5 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                            >
                                <option value="morning">Morning</option>
                                <option value="afternoon">Afternoon</option>
                            </select>
                        )}
                        <InputError message={errors.start_portion} className="mt-1" />
                        <InputError message={errors.end_portion} className="mt-1" />
                    </div>

                    {dayCount > 0 && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 sm:col-span-2">
                            This request will use{' '}
                            <span className="font-semibold text-slate-900 dark:text-white">
                                {formatDays(dayCount)}
                            </span>{' '}
                            working day{dayCount === 1 ? '' : 's'} of leave
                            (excluding weekends and holidays).
                        </p>
                    )}

                    {data.type === 'sl' && (
                        <p className="rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-800 dark:bg-sky-500/10 dark:text-sky-200 sm:col-span-2">
                            A medical certificate is required for more than{' '}
                            {medicalCertificateAfterDays} consecutive sick leave
                            days.
                        </p>
                    )}

                    <div>
                        <InputLabel htmlFor="attachment" value="Attachment" />
                        <FileDropzone
                            id="attachment"
                            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                            className="mt-1"
                            required={needsMedicalCertificate}
                            value={data.medical_certificate}
                            onChange={(file) =>
                                setData('medical_certificate', file)
                            }
                        />
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {needsMedicalCertificate
                                ? 'Upload PDF, JPG, or PNG. Maximum 10 MB.'
                                : 'Optional. PDF, JPG, or PNG only.'}
                        </p>
                        <InputError
                            message={errors.attachment ?? errors.medical_certificate}
                            className="mt-1"
                        />
                    </div>

                    <div className="flex flex-col">
                        <InputLabel htmlFor="reason" value="Reason" />
                        <textarea
                            id="reason"
                            value={data.reason}
                            onChange={(event) =>
                                setData('reason', event.target.value)
                            }
                            rows={4}
                            required
                            className="mt-1 block w-full flex-1 rounded-lg border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
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
