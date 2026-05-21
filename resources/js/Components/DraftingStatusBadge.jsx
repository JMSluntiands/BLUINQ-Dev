import { draftingStatusPillClass } from '@/Components/draftingStatusStyles';

export default function DraftingStatusBadge({ status, label }) {
    return (
        <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${draftingStatusPillClass(status)}`}
        >
            {label}
        </span>
    );
}
