export function formatLeaveCredits(value) {
    const number = Number(value ?? 0);

    return Number.isFinite(number) ? number.toFixed(2) : '0.00';
}

function toDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Mirrors LeaveRequest::calculateRequestedDays(): weekends and public holidays
 * are skipped, unless the whole range falls on them, then every calendar day counts.
 */
export function countLeaveDays(
    startDate,
    endDate,
    startPortion,
    endPortion,
    holidayDates = [],
) {
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

    const holidaySet = new Set(holidayDates);
    const allDates = [];
    let workDates = [];

    for (
        const cursor = new Date(start);
        cursor <= end;
        cursor.setDate(cursor.getDate() + 1)
    ) {
        const dateKey = toDateKey(cursor);
        allDates.push(dateKey);
        const day = cursor.getDay();
        if (day !== 0 && day !== 6 && !holidaySet.has(dateKey)) {
            workDates.push(dateKey);
        }
    }

    if (workDates.length === 0) {
        workDates = allDates;
    }

    let total = workDates.length;

    if (startPortion === 'afternoon' && workDates.includes(startDate)) {
        total -= 0.5;
    }

    if (endPortion === 'morning' && workDates.includes(endDate)) {
        total -= 0.5;
    }

    return Math.max(0.5, total);
}
