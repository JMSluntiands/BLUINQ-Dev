import { uploadInlineImageWithProgress } from '@/lib/uploadAnnouncementInlineImage';

/**
 * Upload an inline image for drafting request comments.
 * @param {File} file
 * @param {(percent: number) => void} [onProgress]
 * @returns {Promise<string>}
 */
export function uploadDraftingCommentInlineImage(file, onProgress) {
    return uploadInlineImageWithProgress(
        route('job.drafting.comments.inline-image.store'),
        file,
        onProgress,
    );
}
