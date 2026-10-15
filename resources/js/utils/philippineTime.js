export const PHILIPPINE_TIMEZONE = 'Asia/Manila';

export function philippineNow() {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: PHILIPPINE_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(new Date());

    const value = (type) =>
        parts.find((part) => part.type === type)?.value ?? '00';

    return new Date(
        Number(value('year')),
        Number(value('month')) - 1,
        Number(value('day')),
        Number(value('hour')),
        Number(value('minute')),
        Number(value('second')),
    );
}

export function philippineTodayInput() {
    const now = philippineNow();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${now.getFullYear()}-${month}-${day}`;
}

export function formatPhilippineDateTime(value) {
    if (!value) {
        return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleString('en-PH', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: PHILIPPINE_TIMEZONE,
    });
}

export function formatPhilippineDate(value) {
    if (!value) {
        return '—';
    }

    const raw = String(value);
    const date = new Date(raw.includes('T') ? raw : `${raw}T00:00:00+08:00`);

    if (Number.isNaN(date.getTime())) {
        return raw;
    }

    return date.toLocaleDateString('en-PH', {
        dateStyle: 'medium',
        timeZone: PHILIPPINE_TIMEZONE,
    });
}
