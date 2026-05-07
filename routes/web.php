<?php

use App\Enums\UserRole;
use App\Http\Controllers\Job\DraftingRequestFormController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Settings\BuildingTypeController;
use App\Http\Controllers\Settings\DeliverableController;
use App\Http\Controllers\Settings\Crm\ArrivalInputFileController;
use App\Http\Controllers\Settings\Crm\CrmCategoryController;
use App\Http\Controllers\Settings\ExternalWallConstructionController;
use App\Http\Controllers\Settings\LevelOfDifficultyController;
use App\Http\Controllers\Settings\RolePermissionController;
use App\Http\Controllers\Settings\RoofTypeController;
use App\Http\Controllers\Settings\ScopeOfWorkController;
use App\Http\Controllers\Settings\ServiceEngagingController;
use App\Http\Controllers\Settings\ActivityLogController;
use App\Http\Controllers\Settings\UserAccountController;
use App\Models\User;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth', 'permission.route'])->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard', [
            'stats' => [
                [
                    'label' => 'Total users',
                    'value' => User::query()->active()->count(),
                ],
                [
                    'label' => 'Administrators',
                    'value' => User::query()->active()->where('role', UserRole::Admin)->count(),
                ],
                [
                    'label' => 'Members',
                    'value' => User::query()->active()->where('role', UserRole::User)->count(),
                ],
                [
                    'label' => 'New (7 days)',
                    'value' => User::query()->active()->where('created_at', '>=', now()->subDays(7))->count(),
                ],
            ],
        ]);
    })->name('dashboard');

    Route::get('/job/drafting', function () {
        return Inertia::render('Job/Drafting');
    })->name('job.drafting');

    Route::get('/job/drafting-request-form', [DraftingRequestFormController::class, 'create'])
        ->name('job.drafting-request-form');
    Route::post('/job/drafting-request-form', [DraftingRequestFormController::class, 'store'])
        ->name('job.drafting-request-form.store');

    Route::get('/crm', function () {
        return Inertia::render('Crm/Index');
    })->name('crm.index');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

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

    Route::get('/settings/permissions', [RolePermissionController::class, 'edit'])
        ->name('settings.permissions.edit');
    Route::patch('/settings/permissions', [RolePermissionController::class, 'update'])
        ->name('settings.permissions.update');
});

require __DIR__.'/auth.php';
