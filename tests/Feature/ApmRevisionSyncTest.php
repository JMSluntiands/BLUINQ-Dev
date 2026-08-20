<?php

namespace Tests\Feature;

use App\Models\CrmCategory;
use App\Models\DraftingRequest;
use App\Models\DraftingRequestAssignment;
use App\Models\DraftingRequestRevision;
use App\Models\Role;
use App\Models\ServiceEngaging;
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

    public function test_changing_user_initials_updates_revision_snapshots_and_board_badges(): void
    {
        $admin = $this->adminUser();
        $drafter = User::factory()->create([
            'role_id' => Role::query()->where('slug', 'admin')->value('id'),
            'name' => 'Alex Drafter',
            'initials' => 'AD',
        ]);
        [$storeyLevel, $category] = $this->seedLookups();
        $job = $this->createApmJob($admin, $storeyLevel, $category);

        DraftingRequestRevision::query()->create([
            'drafting_request_id' => $job->id,
            'user_id' => $admin->id,
            'code' => $job->jobNumber().'-01',
            'log_date' => now()->toDateString(),
            'category' => $category->code,
            'status' => DraftingRequest::STATUS_NEW,
            'drafter_user_id' => $drafter->id,
            'drafter_initials' => 'AD',
            'drafting_hours' => 2,
        ]);

        DraftingRequestAssignment::query()->create([
            'drafting_request_id' => $job->id,
            'role' => DraftingRequestAssignment::ROLE_DRAFTING,
            'slot' => 0,
            'user_id' => $drafter->id,
            'hours' => 2,
        ]);

        $drafter->forceFill(['initials' => 'AC'])->save();

        $revision = DraftingRequestRevision::query()
            ->where('drafting_request_id', $job->id)
            ->first();

        $this->assertSame('AC', $revision?->drafter_initials);
        $this->assertSame('AC', $revision?->resolvedDrafterInitials());

        $job->load([
            'assignments.user:id,name,initials',
            'revisions.drafter:id,name,initials',
            'revisions.checker:id,name,initials',
        ]);

        $row = app(\App\Services\DraftingRequestBoardService::class)->formatBoardRow($job);

        $this->assertSame('AC', $row['drafting'][0]['initials'] ?? null);
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
        $job = $this->createApmJob($user, $storeyLevel, $category);

        DraftingRequestRevision::query()->create([
            'drafting_request_id' => $job->id,
            'user_id' => $user->id,
            'code' => $job->jobNumber().'-01',
            'log_date' => now()->toDateString(),
            'category' => $category->code,
            'status' => DraftingRequest::STATUS_NEW,
        ]);

        $this->actingAs($user)
            ->get(route('job.list'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Job/Board')
                ->has('jobs.data', 1)
                ->where('jobs.data.0.can_add_revision', true)
                ->has('categoryOptions'));
    }

    public function test_job_list_status_options_fold_assigned_on_hold_query_into_design_wip(): void
    {
        $user = $this->adminUser();
        [$storeyLevel, $category] = $this->seedLookups();
        $job = $this->createApmJob($user, $storeyLevel, $category);
        $job->update(['status' => DraftingRequest::STATUS_ASSIGNED]);

        DraftingRequestRevision::query()->create([
            'drafting_request_id' => $job->id,
            'user_id' => $user->id,
            'code' => $job->jobNumber().'-01',
            'log_date' => now()->toDateString(),
            'category' => $category->code,
            'status' => DraftingRequest::STATUS_ASSIGNED,
        ]);

        $this->actingAs($user)
            ->get(route('job.list'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Job/Board')
                ->where('statusOptions', [
                    ['value' => 'new', 'label' => 'New'],
                    ['value' => 'assigned', 'label' => 'Assigned'],
                    ['value' => 'drafting_wip', 'label' => 'Work In Progress'],
                    ['value' => 'for_checking', 'label' => 'For Checking'],
                    ['value' => 'query', 'label' => 'Query'],
                    ['value' => 'submitted', 'label' => 'Submitted'],
                    ['value' => 'on_hold', 'label' => 'On Hold'],
                    ['value' => 'cancelled', 'label' => 'Cancelled'],
                ])
                ->where('statusGroupOptions', [
                    ['value' => 'new', 'label' => 'New'],
                    ['value' => 'drafting_wip', 'label' => 'Work In Progress'],
                    ['value' => 'for_checking', 'label' => 'For Checking'],
                    ['value' => 'submitted', 'label' => 'Submitted'],
                    ['value' => 'cancelled', 'label' => 'Cancelled'],
                ])
                ->where('jobs.data.0.id', $job->id)
                ->where('jobs.data.0.status', DraftingRequest::STATUS_ASSIGNED));
    }

    public function test_member_sees_all_apm_jobs_on_board_and_can_open_them(): void
    {
        $owner = $this->adminUser();
        $member = $this->memberUser();
        [$storeyLevel, $category] = $this->seedLookups();
        $job = $this->createApmJob($owner, $storeyLevel, $category);

        DraftingRequestRevision::query()->create([
            'drafting_request_id' => $job->id,
            'user_id' => $owner->id,
            'code' => $job->jobNumber().'-01',
            'log_date' => now()->toDateString(),
            'category' => $category->code,
            'status' => DraftingRequest::STATUS_NEW,
        ]);

        $this->actingAs($member)
            ->get(route('job.list'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Job/Board')
                ->has('jobs.data', 1)
                ->where('jobs.data.0.id', $job->id)
                ->where('canViewAllRequests', true));

        $this->actingAs($member)
            ->get(route('job.drafting.show', $job))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Job/Drafting/Show')
                ->where('draftingRequest.id', $job->id));
    }

    public function test_member_sees_all_masterlist_entries(): void
    {
        $owner = $this->adminUser();
        $member = $this->memberUser();
        [$storeyLevel, $category] = $this->seedLookups();

        $row = DraftingRequest::query()->create([
            'user_id' => $owner->id,
            'status' => DraftingRequest::STATUS_NEW,
            'review_status' => DraftingRequest::REVIEW_ACCEPTED,
            'workflow_stage' => DraftingRequest::STAGE_MASTERLIST,
            'requested_at' => now(),
            'your_name' => 'Owner Client',
            'company_name' => 'Owner Co',
            'email' => 'owner@example.com',
            'site_address' => '9 Masterlist St',
            'site_owner_name' => 'Owner',
            'storey_level_id' => $storeyLevel->id,
            'crm_category_id' => $category->id,
            'ceiling_heights' => '2700',
            'ndis_sda' => false,
        ]);

        $this->actingAs($member)
            ->get(route('job.masterlist'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Job/Masterlist/Index')
                ->has('draftingRequests.data', 1)
                ->where('draftingRequests.data.0.id', $row->id));

        $this->actingAs($member)
            ->get(route('job.masterlist.show', $row))
            ->assertOk();
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

    public function test_changing_lead_number_rebases_revision_codes(): void
    {
        $user = $this->adminUser();
        [$storeyLevel, $category] = $this->seedLookups();
        $job = $this->createApmJob($user, $storeyLevel, $category);
        $job->forceFill([
            'lead_number' => '26011',
            'status' => DraftingRequest::STATUS_ASSIGNED,
        ])->save();
        $job->crmCategories()->sync([$category->id]);

        DraftingRequestRevision::query()->create([
            'drafting_request_id' => $job->id,
            'user_id' => $user->id,
            'code' => '26011-01',
            'log_date' => now()->toDateString(),
            'category' => $category->code,
            'status' => DraftingRequest::STATUS_ASSIGNED,
        ]);
        DraftingRequestRevision::query()->create([
            'drafting_request_id' => $job->id,
            'user_id' => $user->id,
            'code' => '26011-02',
            'log_date' => now()->toDateString(),
            'category' => $category->code,
            'status' => DraftingRequest::STATUS_ASSIGNED,
        ]);

        $response = $this->actingAs($user)->from(route('job.drafting.show', $job))->patch(
            route('job.drafting.update', $job),
            [
                'section' => 'job',
                'lead_number' => '27000',
                'status' => DraftingRequest::STATUS_ASSIGNED,
                'storey_level_id' => $storeyLevel->id,
                'crm_category_ids' => [$category->id],
                'crm_category_id' => $category->id,
                'site_address' => $job->site_address,
                'site_owner_name' => $job->site_owner_name,
                'ndis_sda' => false,
                'ceiling_heights' => $job->ceiling_heights,
                'unit_development_count' => 0,
            ],
        );

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        $job->refresh();
        $this->assertSame('27000', $job->lead_number);

        $codes = DraftingRequestRevision::query()
            ->where('drafting_request_id', $job->id)
            ->orderBy('code')
            ->pluck('code')
            ->all();

        $this->assertSame(['27000-01', '27000-02'], $codes);
    }

    public function test_design_project_management_shows_only_design_wip_jobs(): void
    {
        $user = $this->adminUser();
        [$storeyLevel, $category] = $this->seedLookups();

        $designService = ServiceEngaging::query()->create([
            'name' => 'Design Review',
            'status' => 'active',
        ]);
        $draftingService = ServiceEngaging::query()->create([
            'name' => 'Construction Drafting',
            'status' => 'active',
        ]);

        $newJob = $this->createApmJob($user, $storeyLevel, $category);
        $newJob->serviceEngagings()->sync([$designService->id]);
        $this->addBoardRevision($newJob, $user, $category, DraftingRequest::STATUS_NEW);

        $assigned = $this->createApmJob($user, $storeyLevel, $category);
        $assigned->serviceEngagings()->sync([$designService->id]);
        $assigned->update([
            'status' => DraftingRequest::STATUS_ASSIGNED,
            'site_address' => '2 Sync St',
        ]);
        $this->addBoardRevision($assigned, $user, $category, DraftingRequest::STATUS_ASSIGNED);

        $forChecking = $this->createApmJob($user, $storeyLevel, $category);
        $forChecking->serviceEngagings()->sync([$designService->id]);
        $forChecking->update([
            'status' => DraftingRequest::STATUS_FOR_CHECKING,
            'site_address' => '3 Sync St',
        ]);
        $this->addBoardRevision($forChecking, $user, $category, DraftingRequest::STATUS_FOR_CHECKING);

        $submitted = $this->createApmJob($user, $storeyLevel, $category);
        $submitted->serviceEngagings()->sync([$designService->id]);
        $submitted->update([
            'status' => DraftingRequest::STATUS_SUBMITTED,
            'site_address' => '4 Sync St',
        ]);
        $this->addBoardRevision($submitted, $user, $category, DraftingRequest::STATUS_SUBMITTED);

        $nonDesign = $this->createApmJob($user, $storeyLevel, $category);
        $nonDesign->serviceEngagings()->sync([$draftingService->id]);
        $nonDesign->update([
            'status' => DraftingRequest::STATUS_DRAFTING_WIP,
            'site_address' => '5 Sync St',
        ]);
        $this->addBoardRevision($nonDesign, $user, $category, DraftingRequest::STATUS_DRAFTING_WIP);

        $this->actingAs($user)
            ->get(route('design.list'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Job/Board')
                ->where('pageTitle', 'Design Project Management')
                ->where('searchRoute', 'design.list')
                ->where('board', 'design')
                ->where('showAddFromMasterlist', true)
                ->where('statusGroupOptions', [
                    ['value' => 'new', 'label' => 'New'],
                    ['value' => 'drafting_wip', 'label' => 'Work In Progress'],
                    ['value' => 'for_checking', 'label' => 'For Checking'],
                    ['value' => 'submitted', 'label' => 'Submitted'],
                    ['value' => 'cancelled', 'label' => 'Cancelled'],
                ])
                ->has('statusOptions', 8)
                ->has('jobs.data', 4)
                ->where(
                    'jobs.data',
                    fn ($jobs) => collect($jobs)->pluck('id')->sort()->values()->all()
                        === collect([
                            $newJob->id,
                            $assigned->id,
                            $forChecking->id,
                            $submitted->id,
                        ])->sort()->values()->all()
                ));

        $this->actingAs($user)
            ->get(route('job.list'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Job/Board')
                ->where('board', 'apm')
                ->has('jobs.data', 1)
                ->where('jobs.data.0.id', $nonDesign->id));
    }

    public function test_design_board_add_stays_on_design_list(): void
    {
        $user = $this->adminUser();
        [$storeyLevel, $category] = $this->seedLookups();

        $job = DraftingRequest::query()->create([
            'user_id' => $user->id,
            'status' => DraftingRequest::STATUS_NEW,
            'review_status' => DraftingRequest::REVIEW_ACCEPTED,
            'workflow_stage' => DraftingRequest::STAGE_MASTERLIST,
            'requested_at' => now(),
            'your_name' => 'Chen Property Group',
            'company_name' => 'Chen Property Group',
            'email' => 'chen@example.com',
            'site_address' => '19 Creek Lane, Ipswich',
            'site_owner_name' => 'Owner',
            'storey_level_id' => $storeyLevel->id,
            'crm_category_id' => $category->id,
            'ceiling_heights' => '2700',
            'ndis_sda' => false,
        ]);

        $response = $this->actingAs($user)
            ->from(route('design.list'))
            ->post(route('job.board.add.quick', $job), [
                'board' => 'design',
                'code' => $job->jobNumber().'-01',
                'log_date' => now()->toDateString(),
                'category' => $category->code,
                'status' => DraftingRequest::STATUS_NEW,
            ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect(route('design.list'));
        $response->assertSessionHas('status', 'design-masterlist-forwarded');

        $job->refresh();
        $this->assertSame(DraftingRequest::STAGE_DESIGN, $job->workflow_stage);

        $this->actingAs($user)
            ->get(route('design.list'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('jobs.data', 1)
                ->where('jobs.data.0.id', $job->id));

        $this->actingAs($user)
            ->get(route('job.list'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('jobs.data', 0));
    }

    private function adminUser(): User
    {
        $adminRoleId = Role::query()->where('slug', 'admin')->value('id');

        return User::factory()->create([
            'role_id' => $adminRoleId,
        ]);
    }

    private function memberUser(): User
    {
        $memberRoleId = Role::query()->where('slug', 'user')->value('id');

        return User::factory()->create([
            'role_id' => $memberRoleId,
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

    private function addBoardRevision(
        DraftingRequest $job,
        User $user,
        CrmCategory $category,
        string $status,
    ): void {
        DraftingRequestRevision::query()->create([
            'drafting_request_id' => $job->id,
            'user_id' => $user->id,
            'code' => $job->jobNumber().'-01',
            'log_date' => now()->toDateString(),
            'category' => $category->code,
            'status' => $status,
        ]);
    }
}
