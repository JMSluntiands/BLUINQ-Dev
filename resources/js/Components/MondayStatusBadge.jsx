/**
 * monday.com–style status label (solid pill).
 */
export default function MondayStatusBadge({ value }) {
    const v = String(value ?? '').toLowerCase();

    if (v === 'active') {
        return (
            <span className="inline-flex items-center rounded-md bg-[#00c875] px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm">
                Active
            </span>
        );
    }

    if (v === 'inactive') {
        return (
            <span className="inline-flex items-center rounded-md bg-[#fdab3d] px-2.5 py-0.5 text-xs font-semibold text-[#323338] shadow-sm">
                Inactive
            </span>
        );
    }

    return (
        <span className="inline-flex items-center rounded-md bg-[#e6e9ef] px-2.5 py-0.5 text-xs font-semibold capitalize text-[#676879]">
            {value}
        </span>
    );
}
