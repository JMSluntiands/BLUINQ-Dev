<?php

use App\Http\Controllers\Api\V1\ArrivalInputFileController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BuildingTypeController;
use App\Http\Controllers\Api\V1\CrmCategoryController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\DeliverableController;
use App\Http\Controllers\Api\V1\ExternalWallConstructionController;
use App\Http\Controllers\Api\V1\LevelOfDifficultyController;
use App\Http\Controllers\Api\V1\ProfileApiController;
use App\Http\Controllers\Api\V1\RolePermissionController;
use App\Http\Controllers\Api\V1\RoofTypeController;
use App\Http\Controllers\Api\V1\ScopeOfWorkController;
use App\Http\Controllers\Api\V1\ServiceEngagingController;
use App\Http\Controllers\Api\V1\UserAccountController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::post('/auth/login', [AuthController::class, 'login']);

    Route::middleware(['auth:sanctum'])->group(function (): void {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);

        Route::middleware(['api.permission:profile.view'])->prefix('profile')->group(function (): void {
            Route::get('/', [ProfileApiController::class, 'show']);
            Route::match(['put', 'patch'], '/', [ProfileApiController::class, 'update']);
            Route::match(['put', 'patch'], '/password', [ProfileApiController::class, 'updatePassword']);
            Route::delete('/', [ProfileApiController::class, 'destroy']);
        });

        Route::middleware(['api.permission:dashboard.view'])
            ->get('/dashboard/stats', [DashboardController::class, 'stats']);

        Route::middleware(['api.permission:settings.building-type.view'])
            ->prefix('settings/building-type')
            ->group(function (): void {
                Route::get('/', [BuildingTypeController::class, 'index']);
                Route::post('/', [BuildingTypeController::class, 'store']);
                Route::get('/archive', [BuildingTypeController::class, 'archived']);
                Route::get('/{buildingType}', [BuildingTypeController::class, 'show']);
                Route::match(['put', 'patch'], '/{buildingType}', [BuildingTypeController::class, 'update']);
                Route::delete('/{buildingType}', [BuildingTypeController::class, 'destroy']);
                Route::post('/{buildingType}/restore', [BuildingTypeController::class, 'restore']);
            });

        Route::middleware(['api.permission:settings.service-engaging.view'])
            ->prefix('settings/service-engaging')
            ->group(function (): void {
                Route::get('/', [ServiceEngagingController::class, 'index']);
                Route::post('/', [ServiceEngagingController::class, 'store']);
                Route::get('/archive', [ServiceEngagingController::class, 'archived']);
                Route::get('/{serviceEngaging}', [ServiceEngagingController::class, 'show']);
                Route::match(['put', 'patch'], '/{serviceEngaging}', [ServiceEngagingController::class, 'update']);
                Route::delete('/{serviceEngaging}', [ServiceEngagingController::class, 'destroy']);
                Route::post('/{serviceEngaging}/restore', [ServiceEngagingController::class, 'restore']);
            });

        Route::middleware(['api.permission:settings.external-wall-construction.view'])
            ->prefix('settings/external-wall-construction')
            ->group(function (): void {
                Route::get('/', [ExternalWallConstructionController::class, 'index']);
                Route::post('/', [ExternalWallConstructionController::class, 'store']);
                Route::get('/archive', [ExternalWallConstructionController::class, 'archived']);
                Route::get('/{externalWallConstruction}', [ExternalWallConstructionController::class, 'show']);
                Route::match(['put', 'patch'], '/{externalWallConstruction}', [ExternalWallConstructionController::class, 'update']);
                Route::delete('/{externalWallConstruction}', [ExternalWallConstructionController::class, 'destroy']);
                Route::post('/{externalWallConstruction}/restore', [ExternalWallConstructionController::class, 'restore']);
            });

        Route::middleware(['api.permission:settings.roof-type.view'])
            ->prefix('settings/roof-type')
            ->group(function (): void {
                Route::get('/', [RoofTypeController::class, 'index']);
                Route::post('/', [RoofTypeController::class, 'store']);
                Route::get('/archive', [RoofTypeController::class, 'archived']);
                Route::get('/{roofType}', [RoofTypeController::class, 'show']);
                Route::match(['put', 'patch'], '/{roofType}', [RoofTypeController::class, 'update']);
                Route::delete('/{roofType}', [RoofTypeController::class, 'destroy']);
                Route::post('/{roofType}/restore', [RoofTypeController::class, 'restore']);
            });

        Route::middleware(['api.permission:settings.scope-of-work.view'])
            ->prefix('settings/scope-of-work')
            ->group(function (): void {
                Route::get('/', [ScopeOfWorkController::class, 'index']);
                Route::post('/', [ScopeOfWorkController::class, 'store']);
                Route::get('/archive', [ScopeOfWorkController::class, 'archived']);
                Route::get('/{scopeOfWork}', [ScopeOfWorkController::class, 'show']);
                Route::match(['put', 'patch'], '/{scopeOfWork}', [ScopeOfWorkController::class, 'update']);
                Route::delete('/{scopeOfWork}', [ScopeOfWorkController::class, 'destroy']);
                Route::post('/{scopeOfWork}/restore', [ScopeOfWorkController::class, 'restore']);
            });

        Route::middleware(['api.permission:settings.deliverables.view'])
            ->prefix('settings/deliverables')
            ->group(function (): void {
                Route::get('/', [DeliverableController::class, 'index']);
                Route::post('/', [DeliverableController::class, 'store']);
                Route::get('/archive', [DeliverableController::class, 'archived']);
                Route::get('/{deliverable}', [DeliverableController::class, 'show']);
                Route::match(['put', 'patch'], '/{deliverable}', [DeliverableController::class, 'update']);
                Route::delete('/{deliverable}', [DeliverableController::class, 'destroy']);
                Route::post('/{deliverable}/restore', [DeliverableController::class, 'restore']);
            });

        Route::middleware(['api.permission:settings.level-of-difficulty.view'])
            ->prefix('settings/level-of-difficulty')
            ->group(function (): void {
                Route::get('/', [LevelOfDifficultyController::class, 'index']);
                Route::post('/', [LevelOfDifficultyController::class, 'store']);
                Route::get('/archive', [LevelOfDifficultyController::class, 'archived']);
                Route::get('/{levelOfDifficulty}', [LevelOfDifficultyController::class, 'show']);
                Route::match(['put', 'patch'], '/{levelOfDifficulty}', [LevelOfDifficultyController::class, 'update']);
                Route::delete('/{levelOfDifficulty}', [LevelOfDifficultyController::class, 'destroy']);
                Route::post('/{levelOfDifficulty}/restore', [LevelOfDifficultyController::class, 'restore']);
            });

        Route::middleware(['api.permission:settings.crm.arrival-input-files.view'])
            ->prefix('settings/crm/arrival-input-files')
            ->group(function (): void {
                Route::get('/', [ArrivalInputFileController::class, 'index']);
                Route::post('/', [ArrivalInputFileController::class, 'store']);
                Route::get('/archive', [ArrivalInputFileController::class, 'archived']);
                Route::get('/{arrivalInputFile}', [ArrivalInputFileController::class, 'show']);
                Route::match(['put', 'patch'], '/{arrivalInputFile}', [ArrivalInputFileController::class, 'update']);
                Route::delete('/{arrivalInputFile}', [ArrivalInputFileController::class, 'destroy']);
                Route::post('/{arrivalInputFile}/restore', [ArrivalInputFileController::class, 'restore']);
            });

        Route::middleware(['api.permission:settings.crm.categories.view'])
            ->prefix('settings/crm/categories')
            ->group(function (): void {
                Route::get('/', [CrmCategoryController::class, 'index']);
                Route::post('/', [CrmCategoryController::class, 'store']);
                Route::get('/archive', [CrmCategoryController::class, 'archived']);
                Route::get('/{crmCategory}', [CrmCategoryController::class, 'show']);
                Route::match(['put', 'patch'], '/{crmCategory}', [CrmCategoryController::class, 'update']);
                Route::delete('/{crmCategory}', [CrmCategoryController::class, 'destroy']);
                Route::post('/{crmCategory}/restore', [CrmCategoryController::class, 'restore']);
            });

        Route::middleware(['admin', 'api.permission:settings.user-accounts.manage'])
            ->prefix('settings/users')
            ->group(function (): void {
                Route::get('/role-options', [UserAccountController::class, 'roleOptions']);
                Route::get('/', [UserAccountController::class, 'index']);
                Route::post('/', [UserAccountController::class, 'store']);
                Route::get('/archive', [UserAccountController::class, 'archived']);
                Route::get('/{user}', [UserAccountController::class, 'show']);
                Route::match(['put', 'patch'], '/{user}', [UserAccountController::class, 'update']);
                Route::delete('/{user}', [UserAccountController::class, 'destroy']);
                Route::post('/{user}/restore', [UserAccountController::class, 'restore']);
            });

        Route::middleware(['admin', 'api.permission:settings.permissions.manage'])
            ->group(function (): void {
                Route::get('/settings/permissions', [RolePermissionController::class, 'show']);
                Route::match(['put', 'patch'], '/settings/permissions', [RolePermissionController::class, 'update']);
            });
    });
});
