/**
 * Simple determinate upload progress bar.
 * @param {{
 *   percent?: number|null;
 *   label?: string;
 *   className?: string;
 * }} props
 */
export default function UploadProgressBar({
    percent = 0,
    label = 'Uploading…',
    className = '',
}) {
    const value = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)));

    return (
        <div
            className={`rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 dark:border-sky-900/60 dark:bg-sky-950/40 ${className}`}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={value}
            aria-label={label}
        >
            <div className="mb-1.5 flex items-center justify-between gap-2 text-xs font-medium text-sky-800 dark:text-sky-300">
                <span>{label}</span>
                <span className="tabular-nums">{value}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-sky-100 dark:bg-sky-950">
                <div
                    className="h-full rounded-full bg-sky-500 transition-[width] duration-150 ease-out dark:bg-sky-400"
                    style={{ width: `${value}%` }}
                />
            </div>
        </div>
    );
}
