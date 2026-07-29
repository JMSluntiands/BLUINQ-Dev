/**
 * Upload an inline image for announcement rich text.
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function uploadAnnouncementInlineImage(file) {
    const csrf =
        document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content') ?? '';

    const body = new FormData();
    body.append('image', file);

    const response = await fetch(route('announcements.inline-image.store'), {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...(csrf ? { 'X-CSRF-TOKEN': csrf } : {}),
        },
        credentials: 'same-origin',
        body,
    });

    if (!response.ok) {
        throw new Error('Upload failed');
    }

    const data = await response.json();
    if (typeof data?.url !== 'string' || data.url.trim() === '') {
        throw new Error('Upload failed');
    }

    return data.url.trim();
}
