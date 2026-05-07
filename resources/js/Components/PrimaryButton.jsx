export default function PrimaryButton({
    className = '',
    disabled,
    loading = false,
    children,
    ...props
}) {
    const isLoading = Boolean(loading);
    const isDisabled = Boolean(disabled) || isLoading;
    const showFadedDisabled = Boolean(disabled) && !isLoading;

    return (
        <button
            {...props}
            disabled={isDisabled}
            aria-busy={isLoading || undefined}
            className={
                'inline-flex items-center justify-center gap-2 rounded-md border border-transparent bg-gray-800 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-200 ease-out hover:bg-gray-700 focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:bg-gray-900 ' +
                (showFadedDisabled ? 'opacity-25 ' : '') +
                (isLoading
                    ? 'primary-button-is-loading cursor-wait shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)] '
                    : '') +
                className
            }
        >
            {isLoading && (
                <svg
                    className="h-4 w-4 shrink-0 motion-safe:animate-spin motion-reduce:animate-none text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="opacity-90"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                </svg>
            )}
            <span
                className={
                    isLoading
                        ? 'motion-safe:animate-pulse motion-reduce:animate-none'
                        : undefined
                }
            >
                {children}
            </span>
        </button>
    );
}
