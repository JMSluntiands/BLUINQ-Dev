<?php

use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\BrandLogoController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\LeaveRequestController;
use App\Http\Controllers\LeaveCreditsController;
use App\Http\Controllers\Job\DraftingMemoController;
use App\Http\Controllers\Job\DraftingController;
use App\Http\Controllers\Job\DraftingRequestFormController;
use App\Http\Controllers\Job\JobBoardController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProfileImageController;
use App\Http\Controllers\Settings\ActivityLogController;
use App\Http\Controllers\Settings\BuildingTypeController;
use App\Http\Controllers\Crm\CrmQuoteController;
use App\Http\Controllers\Crm\CrmQuoteFormController;
use App\Http\Controllers\Settings\Crm\ArrivalInputFileController;
use App\Http\Controllers\Settings\Crm\CrmCategoryController;
use App\Http\Controllers\Settings\DeliverableController;
use App\Http\Controllers\Settings\ExternalWallConstructionController;
use App\Http\Controllers\Settings\LevelOfDifficultyController;
use App\Http\Controllers\Settings\RoleController;
use App\Http\Controllers\Settings\RolePermissionController;
use App\Http\Controllers\Settings\RoofTypeController;
use App\Http\Controllers\Settings\ScopeOfWorkController;
use App\Http\Controllers\Settings\ServiceEngagingController;
use App\Http\Controllers\Settings\UserAccountController;
use App\Http\Controllers\Settings\WorkflowSettingsController;
use App\Http\Controllers\TimesheetController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/brand-logo', [BrandLogoController::class, 'show'])
    ->name('app.brand-logo');

Route::middleware(['auth', 'permission.route'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])
        ->name('dashboard');
    Route::post('/dashboard/clock-in', [DashboardController::class, 'clockIn'])
        ->name('dashboard.clock-in');
    Route::post('/dashboard/clock-out', [DashboardController::class, 'clockOut'])
        ->name('dashboard.clock-out');

    Route::get('/announcements', [AnnouncementController::class, 'index'])
        ->name('announcements.index');
    Route::get('/announcements/create', [AnnouncementController::class, 'create'])
        ->name('announcements.create');
    Route::post('/announcements', [AnnouncementController::class, 'store'])
        ->name('announcements.store');
    Route::get('/announcements/archive', [AnnouncementController::class, 'archive'])
        ->name('announcements.archive');
    Route::get('/announcements/{announcement}/edit', [AnnouncementController::class, 'edit'])
        ->name('announcements.edit');
    Route::patch('/announcements/{announcement}', [AnnouncementController::class, 'update'])
        ->name('announcements.update');
    Route::delete('/announcements/{announcement}', [AnnouncementController::class, 'destroy'])
        ->name('announcements.destroy');
    Route::post('/announcements/{announcement}/restore', [AnnouncementController::class, 'restore'])
        ->name('announcements.restore');
    Route::get('/timesheet', [TimesheetController::class, 'index'])
        ->name('timesheet.index');

    Route::post('/leave', [LeaveRequestController::class, 'store'])
        ->name('leave.store');
    Route::get('/leave/approvals', [LeaveRequestController::class, 'approvals'])
        ->name('leave.approvals');
    Route::post('/leave/{leaveRequest}/approve', [LeaveRequestController::class, 'approve'])
        ->name('leave.approve');
    Route::post('/leave/{leaveRequest}/reject', [LeaveRequestController::class, 'reject'])
        ->name('leave.reject');
    Route::get('/leave/credits', [LeaveCreditsController::class, 'index'])
        ->name('leave.credits.index');
    Route::post('/leave/credits', [LeaveCreditsController::class, 'store'])
        ->name('leave.credits.store');

    Route::get('/job/board', [JobBoardController::class, 'index'])
        ->name('job.board');
    Route::get('/job/drafting', [JobBoardController::class, 'redirectFromLegacyList'])
        ->name('job.drafting');
    Route::get('/job/drafting/archive', [DraftingController::class, 'archive'])
        ->name('job.drafting.archive');
    Route::delete('/job/drafting/{draftingRequest}', [DraftingController::class, 'destroy'])
        ->name('job.drafting.destroy');
    Route::post('/job/drafting/{draftingRequest}/restore', [DraftingController::class, 'restore'])
        ->name('job.drafting.restore');
    Route::get('/job/drafting/{draftingRequest}/board-comments', [DraftingController::class, 'boardComments'])
        ->name('job.drafting.board-comments');
    Route::get('/job/drafting/{draftingRequest}', [DraftingController::class, 'show'])
        ->name('job.drafting.show');
    Route::get('/job/drafting/{draftingRequest}/files/{file}/view', [DraftingController::class, 'viewFile'])
        ->name('job.drafting.files.view');
    Route::get('/job/drafting/{draftingRequest}/files/{file}', [DraftingController::class, 'downloadFile'])
        ->name('job.drafting.files.download');
    Route::post('/job/drafting/{draftingRequest}/files', [DraftingController::class, 'storeFiles'])
        ->name('job.drafting.files.store');
    Route::delete('/job/drafting/{draftingRequest}/files/{file}', [DraftingController::class, 'destroyFile'])
        ->name('job.drafting.files.destroy');
    Route::post('/job/drafting/{draftingRequest}/comments', [DraftingController::class, 'storeComment'])
        ->name('job.drafting.comments.store');
    Route::patch('/job/drafting/{draftingRequest}/status', [DraftingController::class, 'updateStatus'])
        ->name('job.drafting.status.update');
    Route::patch('/job/drafting/{draftingRequest}/priority', [JobBoardController::class, 'togglePriority'])
        ->name('job.drafting.priority.update');
    Route::patch('/job/drafting/{draftingRequest}/assignments', [JobBoardController::class, 'updateAssignment'])
        ->name('job.drafting.assignments.update');

    Route::get('/drafting-memos', [DraftingMemoController::class, 'index'])
        ->name('drafting-memos.index');
    Route::post('/drafting-memos', [DraftingMemoController::class, 'store'])
        ->name('drafting-memos.store');
    Route::patch('/drafting-memos/{draftingMemo}', [DraftingMemoController::class, 'update'])
        ->name('drafting-memos.update');
    Route::delete('/drafting-memos/{draftingMemo}', [DraftingMemoController::class, 'destroy'])
        ->name('drafting-memos.destroy');
    Route::get('/drafting-memos/{draftingMemo}/attachment', [DraftingMemoController::class, 'downloadAttachment'])
        ->name('drafting-memos.attachment');
    Route::post('/drafting-memos/tags', [DraftingMemoController::class, 'storeTag'])
        ->name('drafting-memos.tags.store');
    Route::patch('/job/drafting/{draftingRequest}', [DraftingController::class, 'update'])
        ->name('job.drafting.update');
    Route::post('/job/drafting/{draftingRequest}/revisions', [DraftingController::class, 'storeRevision'])
        ->name('job.drafting.revisions.store');
    Route::post('/job/drafting/{draftingRequest}/accounts', [DraftingController::class, 'storeAccountEntry'])
        ->name('job.drafting.accounts.store');

    Route::get('/job/drafting-request-form', [DraftingRequestFormController::class, 'create'])
        ->name('job.drafting-request-form');
    Route::post('/job/drafting-request-form', [DraftingRequestFormController::class, 'store'])
        ->name('job.drafting-request-form.store');

    Route::get('/crm/quote-details-form', [CrmQuoteFormController::class, 'create'])
        ->name('crm.quote-form');
    Route::post('/crm/quote-details-form', [CrmQuoteFormController::class, 'store'])
        ->name('crm.quote-form.store');
    Route::get('/crm/quotes', [CrmQuoteController::class, 'index'])
        ->name('crm.quotes');
    Route::get('/crm/quotes/archive', [CrmQuoteController::class, 'archive'])
        ->name('crm.quotes.archive');
    Route::get('/crm/quotes/{crmQuote}', [CrmQuoteController::class, 'show'])
        ->name('crm.quotes.show');
    Route::post('/crm/quotes/{crmQuote}/comments', [CrmQuoteController::class, 'storeComment'])
        ->name('crm.quotes.comments.store');
    Route::delete('/crm/quotes/{crmQuote}', [CrmQuoteController::class, 'destroy'])
        ->name('crm.quotes.destroy');
    Route::post('/crm/quotes/{crmQuote}/restore', [CrmQuoteController::class, 'restore'])
        ->name('crm.quotes.restore');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::get('/profile-images/{user}', [ProfileImageController::class, 'show'])
        ->name('profile.image');

    Route::get('/settings/workflow', [WorkflowSettingsController::class, 'index'])
        ->name('settings.workflow');

    Route::prefix('settings/building-type')->name('settings.building-type.')->group(function () {
        Route::get('/', [BuildingTypeController::class, 'index'])->name('index');
        Route::get('/create', [BuildingTypeController::class, 'create'])->name('create');
        Route::post('/', [BuildingTypeController::class, 'store'])->name('store');
        Route::get('/archive', [BuildingTypeController::class, 'archive'])->name('archive');
        Route::get('/{buildingType}/edit', [BuildingTypeController::class, 'edit'])
            ->name('edit');
        Route::patch('/{buildingType}', [BuildingTypeController::class, 'update'])
            ->name('update');
        Route::delete('/{buildingType}', [BuildingTypeController::class, 'destroy'])
            ->name('destroy');
        Route::post('/{buildingType}/restore', [BuildingTypeController::class, 'restore'])
            ->name('restore');
    });

    Route::prefix('settings/service-engaging')->name('settings.service-engaging.')->group(function () {
        Route::get('/', [ServiceEngagingController::class, 'index'])->name('index');
        Route::get('/create', [ServiceEngagingController::class, 'create'])->name('create');
        Route::post('/', [ServiceEngagingController::class, 'store'])->name('store');
        Route::get('/archive', [ServiceEngagingController::class, 'archive'])->name('archive');
        Route::get('/{serviceEngaging}/edit', [ServiceEngagingController::class, 'edit'])
            ->name('edit');
        Route::patch('/{serviceEngaging}', [ServiceEngagingController::class, 'update'])
            ->name('update');
        Route::delete('/{serviceEngaging}', [ServiceEngagingController::class, 'destroy'])
            ->name('destroy');
        Route::post('/{serviceEngaging}/restore', [ServiceEngagingController::class, 'restore'])
            ->name('restore');
    });

    Route::prefix('settings/external-wall-construction')->name('settings.external-wall-construction.')->group(function () {
        Route::get('/', [ExternalWallConstructionController::class, 'index'])->name('index');
        Route::get('/create', [ExternalWallConstructionController::class, 'create'])->name('create');
        Route::post('/', [ExternalWallConstructionController::class, 'store'])->name('store');
        Route::get('/archive', [ExternalWallConstructionController::class, 'archive'])->name('archive');
        Route::get('/{externalWallConstruction}/edit', [ExternalWallConstructionController::class, 'edit'])
            ->name('edit');
        Route::patch('/{externalWallConstruction}', [ExternalWallConstructionController::class, 'update'])
            ->name('update');
        Route::delete('/{externalWallConstruction}', [ExternalWallConstructionController::class, 'destroy'])
            ->name('destroy');
        Route::post('/{externalWallConstruction}/restore', [ExternalWallConstructionController::class, 'restore'])
            ->name('restore');
    });

    Route::prefix('settings/roof-type')->name('settings.roof-type.')->group(function () {
        Route::get('/', [RoofTypeController::class, 'index'])->name('index');
        Route::get('/create', [RoofTypeController::class, 'create'])->name('create');
        Route::post('/', [RoofTypeController::class, 'store'])->name('store');
        Route::get('/archive', [RoofTypeController::class, 'archive'])->name('archive');
        Route::get('/{roofType}/edit', [RoofTypeController::class, 'edit'])
            ->name('edit');
        Route::patch('/{roofType}', [RoofTypeController::class, 'update'])
            ->name('update');
        Route::delete('/{roofType}', [RoofTypeController::class, 'destroy'])
            ->name('destroy');
        Route::post('/{roofType}/restore', [RoofTypeController::class, 'restore'])
            ->name('restore');
    });

    Route::prefix('settings/scope-of-work')->name('settings.scope-of-work.')->group(function () {
        Route::get('/', [ScopeOfWorkController::class, 'index'])->name('index');
        Route::get('/create', [ScopeOfWorkController::class, 'create'])->name('create');
        Route::post('/', [ScopeOfWorkController::class, 'store'])->name('store');
        Route::get('/archive', [ScopeOfWorkController::class, 'archive'])->name('archive');
        Route::get('/{scopeOfWork}/edit', [ScopeOfWorkController::class, 'edit'])
            ->name('edit');
        Route::patch('/{scopeOfWork}', [ScopeOfWorkController::class, 'update'])
            ->name('update');
        Route::delete('/{scopeOfWork}', [ScopeOfWorkController::class, 'destroy'])
            ->name('destroy');
        Route::post('/{scopeOfWork}/restore', [ScopeOfWorkController::class, 'restore'])
            ->name('restore');
    });

    Route::prefix('settings/deliverables')->name('settings.deliverables.')->group(function () {
        Route::get('/', [DeliverableController::class, 'index'])->name('index');
        Route::get('/create', [DeliverableController::class, 'create'])->name('create');
        Route::post('/', [DeliverableController::class, 'store'])->name('store');
        Route::get('/archive', [DeliverableController::class, 'archive'])->name('archive');
        Route::get('/{deliverable}/edit', [DeliverableController::class, 'edit'])
            ->name('edit');
        Route::patch('/{deliverable}', [DeliverableController::class, 'update'])
            ->name('update');
        Route::delete('/{deliverable}', [DeliverableController::class, 'destroy'])
            ->name('destroy');
        Route::post('/{deliverable}/restore', [DeliverableController::class, 'restore'])
            ->name('restore');
    });

    Route::prefix('settings/level-of-difficulty')->name('settings.level-of-difficulty.')->group(function () {
        Route::get('/', [LevelOfDifficultyController::class, 'index'])->name('index');
        Route::get('/create', [LevelOfDifficultyController::class, 'create'])->name('create');
        Route::post('/', [LevelOfDifficultyController::class, 'store'])->name('store');
        Route::get('/archive', [LevelOfDifficultyController::class, 'archive'])->name('archive');
        Route::get('/{levelOfDifficulty}/edit', [LevelOfDifficultyController::class, 'edit'])
            ->name('edit');
        Route::patch('/{levelOfDifficulty}', [LevelOfDifficultyController::class, 'update'])
            ->name('update');
        Route::delete('/{levelOfDifficulty}', [LevelOfDifficultyController::class, 'destroy'])
            ->name('destroy');
        Route::post('/{levelOfDifficulty}/restore', [LevelOfDifficultyController::class, 'restore'])
            ->name('restore');
    });

    Route::prefix('settings/crm/arrival-input-files')
        ->name('settings.crm.arrival-input-files.')
        ->group(function () {
            Route::get('/', [ArrivalInputFileController::class, 'index'])->name('index');
            Route::get('/create', [ArrivalInputFileController::class, 'create'])->name('create');
            Route::post('/', [ArrivalInputFileController::class, 'store'])->name('store');
            Route::get('/archive', [ArrivalInputFileController::class, 'archive'])->name('archive');
            Route::get('/{arrivalInputFile}/edit', [ArrivalInputFileController::class, 'edit'])
                ->name('edit');
            Route::patch('/{arrivalInputFile}', [ArrivalInputFileController::class, 'update'])
                ->name('update');
            Route::delete('/{arrivalInputFile}', [ArrivalInputFileController::class, 'destroy'])
                ->name('destroy');
            Route::post('/{arrivalInputFile}/restore', [ArrivalInputFileController::class, 'restore'])
                ->name('restore');
        });

    Route::prefix('settings/crm/categories')
        ->name('settings.crm.categories.')
        ->group(function () {
            Route::get('/', [CrmCategoryController::class, 'index'])->name('index');
            Route::get('/create', [CrmCategoryController::class, 'create'])->name('create');
            Route::post('/', [CrmCategoryController::class, 'store'])->name('store');
            Route::get('/archive', [CrmCategoryController::class, 'archive'])->name('archive');
            Route::get('/{crmCategory}/edit', [CrmCategoryController::class, 'edit'])
                ->name('edit');
            Route::patch('/{crmCategory}', [CrmCategoryController::class, 'update'])
                ->name('update');
            Route::delete('/{crmCategory}', [CrmCategoryController::class, 'destroy'])
                ->name('destroy');
            Route::post('/{crmCategory}/restore', [CrmCategoryController::class, 'restore'])
                ->name('restore');
        });
});

Route::middleware(['auth', 'admin', 'permission.route'])->group(function () {
    Route::get('/settings/activity-logs', [ActivityLogController::class, 'index'])
        ->name('settings.activity-logs.index');

    Route::prefix('settings/users')->name('settings.users.')->group(function () {
        Route::get('/', [UserAccountController::class, 'index'])->name('index');
        Route::get('/create', [UserAccountController::class, 'create'])->name('create');
        Route::post('/', [UserAccountController::class, 'store'])->name('store');
        Route::get('/archive', [UserAccountController::class, 'archive'])->name('archive');
        Route::get('/{user}/edit', [UserAccountController::class, 'edit'])->name('edit');
        Route::patch('/{user}', [UserAccountController::class, 'update'])->name('update');
        Route::delete('/{user}', [UserAccountController::class, 'destroy'])->name('destroy');
        Route::post('/{user}/restore', [UserAccountController::class, 'restore'])->name('restore');
    });

    Route::prefix('settings/roles')->name('settings.roles.')->group(function () {
        Route::get('/', [RoleController::class, 'index'])->name('index');
        Route::get('/create', [RoleController::class, 'create'])->name('create');
        Route::post('/', [RoleController::class, 'store'])->name('store');
        Route::get('/{role}/edit', [RoleController::class, 'edit'])->name('edit');
        Route::patch('/{role}', [RoleController::class, 'update'])->name('update');
        Route::delete('/{role}', [RoleController::class, 'destroy'])->name('destroy');
    });

    Route::get('/settings/permissions', [RolePermissionController::class, 'edit'])
        ->name('settings.permissions.edit');
    Route::patch('/settings/permissions', [RolePermissionController::class, 'update'])
        ->name('settings.permissions.update');
});

require __DIR__.'/auth.php';
