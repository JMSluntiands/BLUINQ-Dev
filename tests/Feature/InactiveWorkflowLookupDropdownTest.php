<?php

namespace Tests\Feature;

use App\Models\CrmCategory;
use App\Models\Role;
use App\Models\StoreyLevel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InactiveWorkflowLookupDropdownTest extends TestCase
{
    use RefreshDatabase;

    public function test_inactive_workflow_items_stay_on_the_settings_list_and_leave_form_dropdowns(): void
    {
        $admin = $this->adminUser();

        $active = StoreyLevel::query()->create([
            'code' => '1',
            'name' => 'Single storey',
            'status' => 'active',
        ]);
        $inactive = StoreyLevel::query()->create([
            'code' => '9',
            'name' => 'Disabled storey',
            'status' => 'inactive',
        ]);

        $activeCategory = CrmCategory::query()->create([
            'code' => 'WD',
            'name' => 'Working Drawings',
            'status' => 'active',
        ]);
        $inactiveCategory = CrmCategory::query()->create([
            'code' => 'XX',
            'name' => 'Disabled category',
            'status' => 'inactive',
        ]);

        $this->actingAs($admin)
            ->get(route('settings.storey-level.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Settings/StoreyLevel/Index')
                ->where('storeyLevels.data', function ($rows) use ($active, $inactive) {
                    $ids = collect($rows)->pluck('id');

                    return $ids->contains($active->id) && $ids->contains($inactive->id);
                }));

        $this->actingAs($admin)
            ->get(route('job.masterlist.create'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Job/DraftingRequestForm')
                ->where('storeyLevels', function ($rows) use ($active, $inactive) {
                    $ids = collect($rows)->pluck('id');

                    return $ids->contains($active->id) && $ids->doesntContain($inactive->id);
                })
                ->where('categories', function ($rows) use ($activeCategory, $inactiveCategory) {
                    $ids = collect($rows)->pluck('id');

                    return $ids->contains($activeCategory->id) && $ids->doesntContain($inactiveCategory->id);
                }));

        $this->actingAs($admin)
            ->get(route('crm.quote-form'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Crm/QuoteDetailsForm')
                ->where('categories', function ($rows) use ($activeCategory, $inactiveCategory) {
                    $ids = collect($rows)->pluck('id');

                    return $ids->contains($activeCategory->id) && $ids->doesntContain($inactiveCategory->id);
                }));

        $this->get(route('public.drafting-request-form'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('storeyLevels', function ($rows) use ($inactive) {
                    return collect($rows)->pluck('id')->doesntContain($inactive->id);
                }));
    }

    private function adminUser(): User
    {
        $adminRoleId = Role::query()->where('slug', 'admin')->value('id');

        return User::factory()->create([
            'role_id' => $adminRoleId,
        ]);
    }
}
