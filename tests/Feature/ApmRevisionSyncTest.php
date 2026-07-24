<?php

namespace Tests\Feature;

use App\Models\CrmCategory;
use App\Models\DraftingRequest;
use App\Models\DraftingRequestAssignment;
use App\Models\DraftingRequestRevision;
use App\Models\Role;
use App\Models\StoreyLevel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApmRevisionSyncTest extends TestCase
{
    use RefreshDatabase;

    public function test_slim_revision_can_be_created_without_drafter(): void
    {
        $user = $this->adminUser();
        [$storeyLevel, $category] = $this->seedLookups();
        $job = $this->createApmJob($user, $storeyLevel, $category);

        $code = $job->jobNumber().'-01';

        $response = $this->actingAs($user)->post(
            route('job.drafting.revisions.store', $job),
            [
                'code' => $code,
                'log_date' => now()->toDateString(),
                'category' => $category->code,
                'status' => DraftingRequest::STATUS_NEW,
            ],
        );

        $response->assertRedirect();
        $response->assertSessionHas('status', 'drf-revision-added');

        $revision = DraftingRequestRevision::query()
            ->where('drafting_request_id', $job->id)
            ->where('code', $code)
            ->first();

        $this->assertNotNull($revision);
        $this->assertNull($revision->drafter_user_id);
        $this->assertNull($revision->drafting_hours);
        $this->assertSame($category->code, $revision->category);
        $this->assertSame(DraftingRequest::STATUS_NEW, $revision->status);
    }

    public function test_board_assign_slot_zero_syncs_drafter_and_hours_to_latest_revision(): void
    {
        $user = $this->adminUser();
        $drafter = User::factory()->create([
            'role_id' => Role::query()->where('slug', 'admin')->value('id'),
        ]);
        [$storeyLevel, $category] = $this->seedLookups();
        $job = $this->createApmJob($user, $storeyLevel, $category);

        DraftingRequestRevision::query()->create([
            'drafting_request_id' => $job->id,
            'user_id' => $user->id,
            'code' => $job->jobNumber().'-01',
            'log_date' => now()->toDateString(),
            'category' => $category->code,
            'status' => DraftingRequest::STATUS_NEW,
        ]);

        $this->actingAs($user)->patch(
            route('job.drafting.assignments.update', $job),
            [
                'role' => DraftingRequestAssignment::ROLE_DRAFTING,
                'slot' => 0,
                'user_id' => $drafter->id,
                'hours' => 12.5,
            ],
        )->assertRedirect();

        $revision = DraftingRequestRevision::query()
            ->where('drafting_request_id', $job->id)
            ->orderByDesc('id')
            ->first();

        $this->assertNotNull($revision);
        $this->assertSame($drafter->id, $revision->drafter_user_id);
        $this->assertSame('12.50', (string) $revision->drafting_hours);
        $this->assertNotNull($revision->drafter_initials);
    }

    public function test_board_assign_creates_primary_revision_when_missing(): void
    {
        $user = $this->adminUser();
        $drafter = User::factory()->create([
            'role_id' => Role::query()->where('slug', 'admin')->value('id'),
        ]);
        [$storeyLevel, $category] = $this->seedLookups();
        $job = $this->createApmJob($user, $storeyLevel, $category);

        $this->assertSame(0, $job->revisions()->count());

        $this->actingAs($user)->patch(
            route('job.drafting.assignments.update', $job),
            [
                'role' => DraftingRequestAssignment::ROLE_DRAFTING,
                'slot' => 0,
                'user_id' => $drafter->id,
                'hours' => 4,
            ],
        )->assertRedirect();

        $revision = DraftingRequestRevision::query()
            ->where('drafting_request_id', $job->id)
            ->first();

        $this->assertNotNull($revision);
        $this->assertSame($job->jobNumber().'-01', $revision->code);
        $this->assertSame($drafter->id, $revision->drafter_user_id);
    }

    public function test_board_clear_slot_zero_clears_revision_staff_fields(): void
    {
        $user = $this->adminUser();
        [$storeyLevel, $category] = $this->seedLookups();
        $job = $this->createApmJob($user, $storeyLevel, $category);

        $revision = DraftingRequestRevision::query()->create([
            'drafting_request_id' => $job->id,
            'user_id' => $user->id,
            'code' => $job->jobNumber().'-01',
            'log_date' => now()->toDateString(),
            'category' => $category->code,
            'drafter_user_id' => $user->id,
            'drafter_initials' => 'AD',
            'drafting_hours' => 8,
            'status' => DraftingRequest::STATUS_ASSIGNED,
        ]);

        DraftingRequestAssignment::query()->create([
            'drafting_request_id' => $job->id,
            'role' => DraftingRequestAssignment::ROLE_DRAFTING,
            'slot' => 0,
            'user_id' => $user->id,
            'hours' => 8,
        ]);

        $this->actingAs($user)->patch(
            route('job.drafting.assignments.update', $job),
            [
                'role' => DraftingRequestAssignment::ROLE_DRAFTING,
                'slot' => 0,
                'user_id' => null,
                'hours' => null,
            ],
        )->assertRedirect();

        $revision->refresh();
        $this->assertNull($revision->drafter_user_id);
        $this->assertNull($revision->drafter_initials);
        $this->assertNull($revision->drafting_hours);
    }

    public function test_board_status_change_syncs_to_latest_revision(): void
    {
        $user = $this->adminUser();
        [$storeyLevel, $category] = $this->seedLookups();
        $job = $this->createApmJob($user, $storeyLevel, $category);

        $revision = DraftingRequestRevision::query()->create([
            'drafting_request_id' => $job->id,
            'user_id' => $user->id,
            'code' => $job->jobNumber().'-01',
            'log_date' => now()->toDateString(),
            'category' => $category->code,
            'status' => DraftingRequest::STATUS_NEW,
        ]);

        $this->actingAs($user)->patch(
            route('job.drafting.board.update', $job),
            ['status' => DraftingRequest::STATUS_DRAFTING_WIP],
        )->assertRedirect();

        $job->refresh();
        $revision->refresh();

        $this->assertSame(DraftingRequest::STATUS_DRAFTING_WIP, $job->status);
        $this->assertSame(DraftingRequest::STATUS_DRAFTING_WIP, $revision->status);
    }

    public function test_board_exposes_add_revision_control_for_eligible_jobs(): void
    {
        $user = $this->adminUser();
        [$storeyLevel, $category] = $this->seedLookups();
        $this->createApmJob($user, $storeyLevel, $category);

        $this->actingAs($user)
            ->get(route('job.board'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Job/Board')
                ->has('jobs.data', 1)
                ->where('jobs.data.0.can_add_revision', true)
                ->has('categoryOptions'));
    }

    public function test_board_checking_slot_zero_syncs_checker_and_hours(): void
    {
        $user = $this->adminUser();
        $checker = User::factory()->create([
            'role_id' => Role::query()->where('slug', 'admin')->value('id'),
        ]);
        [$storeyLevel, $category] = $this->seedLookups();
        $job = $this->createApmJob($user, $storeyLevel, $category);

        DraftingRequestRevision::query()->create([
            'drafting_request_id' => $job->id,
            'user_id' => $user->id,
            'code' => $job->jobNumber().'-01',
            'log_date' => now()->toDateString(),
            'category' => $category->code,
            'status' => DraftingRequest::STATUS_NEW,
        ]);

        $this->actingAs($user)->patch(
            route('job.drafting.assignments.update', $job),
            [
                'role' => DraftingRequestAssignment::ROLE_CHECKING,
                'slot' => 0,
                'user_id' => $checker->id,
                'hours' => 3,
            ],
        )->assertRedirect();

        $revision = DraftingRequestRevision::query()
            ->where('drafting_request_id', $job->id)
            ->first();

        $this->assertSame($checker->id, $revision->checker_user_id);
        $this->assertSame('3.00', (string) $revision->checking_hours);
        $this->assertNotNull($revision->checker_initials);
    }

    private function adminUser(): User
    {
        $adminRoleId = Role::query()->where('slug', 'admin')->value('id');

        return User::factory()->create([
            'role_id' => $adminRoleId,
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
        return DraftingRequest::query()->create([
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
        ]);
    }
}
