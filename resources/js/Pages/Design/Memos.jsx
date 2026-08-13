import DraftingMemosIndex from '@/Pages/Job/DraftingMemos/Index';

const FLASH_MESSAGES = {
    'design-memo-created': 'Design memo added.',
    'design-memo-updated': 'Design memo updated.',
    'design-memo-deleted': 'Design memo deleted.',
    'design-memo-tag-created': 'Tag added.',
};

export default function Memos(props) {
    return (
        <DraftingMemosIndex
            {...props}
            pageTitle="Design Memos"
            pageDescription="Latest design memos visible and editable by the team."
            emptyMessage="No design memos yet."
            indexRoute="design-memos.index"
            destroyRoute="design-memos.destroy"
            storeRoute="design-memos.store"
            updateRoute="design-memos.update"
            tagsStoreRoute="design-memos.tags.store"
            flashMessages={FLASH_MESSAGES}
        />
    );
}
