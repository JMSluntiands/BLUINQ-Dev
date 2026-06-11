import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import { usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

/**
 * Shows a dismissible modal when `flash.status` matches a key in `messages`.
 *
 * @param {{
 *   messages: Record<string, string>;
 *   title?: string;
 * }} props
 */
export default function FlashNoticeModal({
    messages,
    title = 'Success',
}) {
    const status = usePage().props.flash?.status ?? null;
    const message =
        status != null && typeof messages[status] === 'string'
            ? messages[status]
            : null;

    const prevStatusRef = useRef(status);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (prevStatusRef.current === status) {
            return;
        }
        prevStatusRef.current = status;
        setDismissed(false);
    }, [status]);

    const show = Boolean(message) && !dismissed;
    const close = () => setDismissed(true);

    if (!message) {
        return null;
    }

    return (
        <Modal show={show} onClose={close} maxWidth="md">
            <div className="p-6">
                <h2 className="text-lg font-semibold text-[#323338] dark:text-slate-100">{title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-[#676879] dark:text-slate-400">
                    {message}
                </p>
                <div className="mt-6 flex justify-end">
                    <SecondaryButton
                        type="button"
                        onClick={close}
                        className="rounded-lg normal-case tracking-normal"
                    >
                        OK
                    </SecondaryButton>
                </div>
            </div>
        </Modal>
    );
}
