import {
    ArrowDownTrayIcon,
    BuildingLibraryIcon,
    BuildingOffice2Icon,
    ChartBarIcon,
    CheckBadgeIcon,
    ClipboardDocumentListIcon,
    HomeIcon,
    HomeModernIcon,
    InboxStackIcon,
    RectangleStackIcon,
    Squares2X2Icon,
    TagIcon,
    WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

export const WORKFLOW_SETTINGS_MODULES = [
    {
        key: 'service-engaging',
        label: 'Service Engaging',
        permission: 'settings.service-engaging.view',
        icon: WrenchScrewdriverIcon,
        routes: {
            index: 'settings.service-engaging.index',
            create: 'settings.service-engaging.create',
            archive: 'settings.service-engaging.archive',
            edit: 'settings.service-engaging.edit',
        },
    },
    {
        key: 'external-wall-construction',
        label: 'External Wall Construction',
        permission: 'settings.external-wall-construction.view',
        icon: HomeModernIcon,
        routes: {
            index: 'settings.external-wall-construction.index',
            create: 'settings.external-wall-construction.create',
            archive: 'settings.external-wall-construction.archive',
            edit: 'settings.external-wall-construction.edit',
        },
    },
    {
        key: 'roof-type',
        label: 'Roof Type',
        permission: 'settings.roof-type.view',
        icon: HomeIcon,
        routes: {
            index: 'settings.roof-type.index',
            create: 'settings.roof-type.create',
            archive: 'settings.roof-type.archive',
            edit: 'settings.roof-type.edit',
        },
    },
    {
        key: 'scope-of-work',
        label: 'Scope of work',
        permission: 'settings.scope-of-work.view',
        icon: ClipboardDocumentListIcon,
        routes: {
            index: 'settings.scope-of-work.index',
            create: 'settings.scope-of-work.create',
            archive: 'settings.scope-of-work.archive',
            edit: 'settings.scope-of-work.edit',
        },
    },
    {
        key: 'deliverables',
        label: 'Deliverables',
        permission: 'settings.deliverables.view',
        icon: InboxStackIcon,
        routes: {
            index: 'settings.deliverables.index',
            create: 'settings.deliverables.create',
            archive: 'settings.deliverables.archive',
            edit: 'settings.deliverables.edit',
        },
    },
    {
        key: 'workflow-status',
        label: 'Status',
        permission: 'settings.workflow-status.view',
        icon: CheckBadgeIcon,
        routes: {
            index: 'settings.workflow-status.index',
            create: 'settings.workflow-status.create',
            archive: 'settings.workflow-status.archive',
            edit: 'settings.workflow-status.edit',
        },
    },
    {
        key: 'building-type',
        label: 'Building Type',
        permission: 'settings.building-type.view',
        icon: BuildingOffice2Icon,
        routes: {
            index: 'settings.building-type.index',
            create: 'settings.building-type.create',
            archive: 'settings.building-type.archive',
            edit: 'settings.building-type.edit',
        },
    },
    {
        key: 'storey-level',
        label: 'Typical Storeys & Levels',
        permission: 'settings.storey-level.view',
        icon: RectangleStackIcon,
        routes: {
            index: 'settings.storey-level.index',
            create: 'settings.storey-level.create',
            archive: 'settings.storey-level.archive',
            edit: 'settings.storey-level.edit',
        },
    },
    {
        key: 'sda-type',
        label: 'SDA Type',
        permission: 'settings.sda-type.view',
        icon: Squares2X2Icon,
        routes: {
            index: 'settings.sda-type.index',
            create: 'settings.sda-type.create',
            archive: 'settings.sda-type.archive',
            edit: 'settings.sda-type.edit',
        },
    },
    {
        key: 'building-class',
        label: 'Building Classes',
        permission: 'settings.building-class.view',
        icon: BuildingLibraryIcon,
        routes: {
            index: 'settings.building-class.index',
            create: 'settings.building-class.create',
            archive: 'settings.building-class.archive',
            edit: 'settings.building-class.edit',
        },
    },
    {
        key: 'arrival-input-files',
        label: 'Arrival input files',
        permission: 'settings.crm.arrival-input-files.view',
        icon: ArrowDownTrayIcon,
        routes: {
            index: 'settings.crm.arrival-input-files.index',
            create: 'settings.crm.arrival-input-files.create',
            archive: 'settings.crm.arrival-input-files.archive',
            edit: 'settings.crm.arrival-input-files.edit',
        },
    },
    {
        key: 'categories',
        label: 'Category',
        permission: 'settings.crm.categories.view',
        icon: TagIcon,
        routes: {
            index: 'settings.crm.categories.index',
            create: 'settings.crm.categories.create',
            archive: 'settings.crm.categories.archive',
            edit: 'settings.crm.categories.edit',
        },
    },
    {
        key: 'level-of-difficulty',
        label: 'Level of difficulty',
        permission: 'settings.level-of-difficulty.view',
        icon: ChartBarIcon,
        routes: {
            index: 'settings.level-of-difficulty.index',
            create: 'settings.level-of-difficulty.create',
            archive: 'settings.level-of-difficulty.archive',
            edit: 'settings.level-of-difficulty.edit',
        },
    },
];

export function isWorkflowModuleActive(module) {
    const { routes } = module;

    return (
        route().current(routes.index) ||
        route().current(routes.create) ||
        route().current(routes.archive) ||
        route().current(routes.edit)
    );
}

export function isAnyWorkflowRoute() {
    if (route().current('settings.workflow')) {
        return true;
    }

    return WORKFLOW_SETTINGS_MODULES.some((module) =>
        isWorkflowModuleActive(module),
    );
}
