/**
 * Upload an inline image for announcement rich text.
 * @param {File} file
 * @param {(percent: number) => void} [onProgress]
 * @returns {Promise<string>}
 */
export function uploadAnnouncementInlineImage(file, onProgress) {
    return uploadInlineImageWithProgress(
        route('announcements.inline-image.store'),
        file,
        onProgress,
    );
}

/**
 * @param {string} url
 * @param {File} file
 * @param {(percent: number) => void} [onProgress]
 * @returns {Promise<string>}
 */
export function uploadInlineImageWithProgress(url, file, onProgress) {
    const csrf =
        document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content') ?? '';

    const body = new FormData();
    body.append('image', file);

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        if (csrf) {
            xhr.setRequestHeader('X-CSRF-TOKEN', csrf);
        }
        xhr.withCredentials = true;

        xhr.upload.onprogress = (event) => {
            if (!event.lengthComputable || typeof onProgress !== 'function') {
                return;
            }
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
        };

        xhr.onload = () => {
            if (xhr.status < 200 || xhr.status >= 300) {
                reject(new Error('Upload failed'));
                return;
            }

            try {
                const data = JSON.parse(xhr.responseText);
                if (typeof data?.url !== 'string' || data.url.trim() === '') {
                    reject(new Error('Upload failed'));
                    return;
                }
                if (typeof onProgress === 'function') {
                    onProgress(100);
                }
                resolve(data.url.trim());
            } catch {
                reject(new Error('Upload failed'));
            }
        };

        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.onabort = () => reject(new Error('Upload aborted'));

        if (typeof onProgress === 'function') {
            onProgress(0);
        }
        xhr.send(body);
    });
}
