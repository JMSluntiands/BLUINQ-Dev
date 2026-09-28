<?php

namespace Tests\Feature;

use App\Models\CrmCategory;
use App\Models\DraftingRequest;
use App\Models\DraftingRequestRevision;
use App\Models\Role;
use App\Models\StoreyLevel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DraftingProjectInfoEditTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_update_project_info_on_apm_board(): void
    {
        $admin = $this->adminUser();
        [$storeyLevel, $category] = $this->seedLookups();
        $job = $this->createApmJob($admin, $storeyLevel, $category);

        $this->actingAs($admin)
            ->patch(route('job.drafting.update', $job), [
                'section' => 'job',
                'lead_number' => $job->lead_number ?: $job->jobNumber(),
                'status' => DraftingRequest::STATUS_NEW,
                'storey_level_id' => $storeyLevel->id,
                'crm_category_ids' => [$category->id],
                'site_address' => 'Updated Site Address',
                'ceiling_heights' => '2700',
                'site_owner_name' => 'Owner',
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $job->refresh();
        $this->assertSame('Updated Site Address', $job->site_address);
    }

    public function test_manager_with_job_details_edit_can_update_project_info(): void
    {
        $owner = $this->adminUser();
        $manager = $this->managerWithJobDetailsEdit();
        [$storeyLevel, $category] = $this->seedLookups();
        $job = $this->createApmJob($owner, $storeyLevel, $category);

        $this->actingAs($manager)
            ->patch(route('job.drafting.update', $job), [
                'section' => 'job',
                'lead_number' => $job->lead_number ?: $job->jobNumber(),
                'status' => DraftingRequest::STATUS_NEW,
                'storey_level_id' => $storeyLevel->id,
                'crm_category_ids' => [$category->id],
                'site_address' => 'Manager Updated Address',
                'ceiling_heights' => '2700',
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $job->refresh();
        $this->assertSame('Manager Updated Address', $job->site_address);
    }

    public function test_manager_without_job_details_edit_gets_403(): void
    {
        $owner = $this->adminUser();
        $manager = $this->managerViewOnly();
        [$storeyLevel, $category] = $this->seedLookups();
        $job = $this->createApmJob($owner, $storeyLevel, $category);

        $this->actingAs($manager)
            ->patch(route('job.drafting.update', $job), [
                'section' => 'job',
                'lead_number' => $job->lead_number ?: $job->jobNumber(),
                'status' => DraftingRequest::STATUS_NEW,
                'storey_level_id' => $storeyLevel->id,
                'crm_category_ids' => [$category->id],
                'site_address' => 'Blocked',
                'ceiling_heights' => '2700',
            ])
            ->assertForbidden();
    }

    public function test_admin_can_update_project_info_when_storey_and_category_were_null(): void
    {
        $admin = $this->adminUser();
        [$storeyLevel, $category] = $this->seedLookups();

        $job = DraftingRequest::query()->create([
            'user_id' => $admin->id,
            'status' => DraftingRequest::STATUS_NEW,
            'review_status' => DraftingRequest::REVIEW_ACCEPTED,
            'workflow_stage' => DraftingRequest::STAGE_APM,
            'requested_at' => now(),
            'your_name' => 'Test Client',
            'company_name' => 'Test Co',
            'email' => 'test@example.com',
            'site_address' => '1 Incomplete St',
            'site_owner_name' => 'Owner',
            'storey_level_id' => null,
            'crm_category_id' => null,
            'ceiling_heights' => '2700',
            'ndis_sda' => false,
            'lead_number' => '26999',
        ]);

        DraftingRequestRevision::query()->create([
            'drafting_request_id' => $job->id,
            'user_id' => $admin->id,
            'code' => '26999-01',
            'log_date' => now()->toDateString(),
            'category' => $category->code,
            'status' => DraftingRequest::STATUS_NEW,
        ]);

        // Incomplete board jobs can still save other project-info fields.
        $this->actingAs($admin)
            ->patch(route('job.drafting.update', $job), [
                'section' => 'job',
                'lead_number' => '26999',
                'status' => DraftingRequest::STATUS_NEW,
                'storey_level_id' => '',
                'crm_category_ids' => [],
                'site_address' => '1 Incomplete St Fixed',
                'ceiling_heights' => '2700',
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $job->refresh();
        $this->assertSame('1 Incomplete St Fixed', $job->site_address);
        $this->assertNull($job->storey_level_id);

        $this->actingAs($admin)
            ->patch(route('job.drafting.update', $job), [
                'section' => 'job',
                'lead_number' => '26999',
                'status' => DraftingRequest::STATUS_NEW,
                'storey_level_id' => $storeyLevel->id,
                'crm_category_ids' => [$category->id],
                'site_address' => '1 Incomplete St Fixed',
                'ceiling_heights' => '2700',
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $job->refresh();
        $this->assertSame($storeyLevel->id, $job->storey_level_id);
    }

    public function test_masterlist_viewer_can_update_project_info_without_drafting_view(): void
    {
        $owner = $this->adminUser();
        $encoder = $this->masterlistEncoder();
        [$storeyLevel, $category] = $this->seedLookups();

        $job = DraftingRequest::query()->create([
            'user_id' => $owner->id,
            'status' => DraftingRequest::STATUS_NEW,
            'review_status' => DraftingRequest::REVIEW_ACCEPTED,
            'workflow_stage' => DraftingRequest::STAGE_MASTERLIST,
            'requested_at' => now(),
            'your_name' => 'Masterlist Client',
            'company_name' => 'Masterlist Co',
            'email' => 'ml@example.com',
            'site_address' => '9 Masterlist Rd',
            'site_owner_name' => 'Owner',
            'storey_level_id' => $storeyLevel->id,
            'crm_category_id' => $category->id,
            'ceiling_heights' => '2700',
            'ndis_sda' => false,
            'lead_number' => '26040',
        ]);

        $this->actingAs($encoder)
            ->patch(route('job.drafting.update', $job), [
                'section' => 'job',
                'lead_number' => '26040',
                'status' => DraftingRequest::STATUS_NEW,
                'storey_level_id' => $storeyLevel->id,
                'crm_category_ids' => [$category->id],
                'site_address' => '9 Masterlist Rd Updated',
                'ceiling_heights' => '2700',
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $job->refresh();
        $this->assertSame('9 Masterlist Rd Updated', $job->site_address);
    }

    private function adminUser(): User
    {
        $adminRoleId = Role::query()->where('slug', 'admin')->value('id');

        return User::factory()->create([
            'role_id' => $adminRoleId,
        ]);
    }

    private function managerWithJobDetailsEdit(): User
    {
        $manager = Role::query()->firstOrCreate(
            ['slug' => 'project-manager'],
            [
                'name' => 'Project Manager',
                'is_system' => true,
                'sort_order' => 2,
            ],
        );

        \App\Models\Permission::syncSlugsForRole('project-manager', [
            'job.drafting.view',
            'job.drafting.job-details.edit',
            'job.list.view',
        ]);

        return User::factory()->create([
            'role_id' => $manager->id,
        ]);
    }

    private function managerViewOnly(): User
    {
        $manager = Role::query()->firstOrCreate(
            ['slug' => 'project-manager'],
            [
                'name' => 'Project Manager',
                'is_system' => true,
                'sort_order' => 2,
            ],
        );

        \App\Models\Permission::syncSlugsForRole('project-manager', [
            'job.drafting.view',
            'job.list.view',
        ]);

        return User::factory()->create([
            'role_id' => $manager->id,
        ]);
    }

    private function masterlistEncoder(): User
    {
        $role = Role::query()->firstOrCreate(
            ['slug' => 'user'],
            [
                'name' => 'User',
                'is_system' => true,
                'sort_order' => 3,
            ],
        );

        \App\Models\Permission::syncSlugsForRole('user', [
            'job.drafting-request.view',
        ]);

        return User::factory()->create([
            'role_id' => $role->id,
        ]);
    }

    /**
     * @return array{0: StoreyLevel, 1: CrmCategory}
     */
    private function seedLookups(): array
    {
        $storeyLevel = StoreyLevel::query()->create([
            'code' => '2s',
            'name' => '2 storeys',
            'status' => 'active',
        ]);

        $category = CrmCategory::query()->create([
            'code' => 'WD',
            'name' => 'Working Drawings',
            'status' => 'active',
        ]);

        return [$storeyLevel, $category];
    }

    private function createApmJob(
        User $user,
        StoreyLevel $storeyLevel,
        CrmCategory $category,
    ): DraftingRequest {
        $job = DraftingRequest::query()->create([
            'user_id' => $user->id,
            'status' => DraftingRequest::STATUS_NEW,
            'review_status' => DraftingRequest::REVIEW_ACCEPTED,
            'workflow_stage' => DraftingRequest::STAGE_APM,
            'requested_at' => now(),
            'your_name' => 'Test Client',
            'company_name' => 'Test Co',
            'email' => 'test@example.com',
            'site_address' => '1 Sync St',
            'site_owner_name' => 'Owner',
            'storey_level_id' => $storeyLevel->id,
            'crm_category_id' => $category->id,
            'ceiling_heights' => '2700',
            'ndis_sda' => false,
            'lead_number' => '26003',
        ]);

        DraftingRequestRevision::query()->create([
            'drafting_request_id' => $job->id,
            'user_id' => $user->id,
            'code' => '26003-02',
            'log_date' => now()->toDateString(),
            'category' => $category->code,
            'status' => DraftingRequest::STATUS_NEW,
        ]);

        return $job;
    }
}
