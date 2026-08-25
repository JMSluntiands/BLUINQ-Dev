<?php

namespace Tests\Feature;

use App\Models\BuildingClass;
use App\Models\Client;
use App\Models\CrmCategory;
use App\Models\DraftingRequest;
use App\Models\DraftingRequestRevision;
use App\Models\Role;
use App\Models\StoreyLevel;
use App\Models\User;
use App\Services\DraftingRequestBoardService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

class MasterlistToApmWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_store_appears_in_masterlist_not_board(): void
    {
        $user = $this->adminUser();
        [$storeyLevel, $category, $client, $buildingClass] = $this->seedLookups();

        $response = $this->actingAs($user)->post(route('job.masterlist.store'), $this->validPayload(
            $storeyLevel->id,
            $category->id,
            $client,
            $buildingClass,
        ));

        $response->assertRedirect(route('job.masterlist'));

        $row = DraftingRequest::query()->first();
        $this->assertNotNull($row);
        $this->assertSame('26001', $row->lead_number);
        $this->assertSame('26001', $row->jobNumber());
        $this->assertSame(DraftingRequest::STAGE_MASTERLIST, $row->workflow_stage);
        $this->assertSame(DraftingRequest::REVIEW_ACCEPTED, $row->review_status);
        $this->assertSame($storeyLevel->id, $row->storey_level_id);
        $this->assertSame($category->id, $row->crm_category_id);

        $this->actingAs($user)
            ->get(route('job.masterlist'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Job/Masterlist/Index')
                ->has('draftingRequests.data', 1));

        $this->actingAs($user)
            ->get(route('job.list'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Job/Board')
                ->has('jobs.data', 0)
                ->has('masterlistCandidates', 1)
                ->where('masterlistCandidates.0.id', $row->id)
                ->where('masterlistCandidates.0.source', 'masterlist'));
    }

    public function test_forward_moves_to_apm_and_seeds_revision_code(): void
    {
        $user = $this->adminUser();
        [$storeyLevel, $category, $client, $buildingClass] = $this->seedLookups();

        $this->actingAs($user)->post(route('job.masterlist.store'), $this->validPayload(
            $storeyLevel->id,
            $category->id,
            $client,
            $buildingClass,
        ));

        $row = DraftingRequest::query()->firstOrFail();

        $response = $this->actingAs($user)->post(route('job.masterlist.forward', $row));

        $response->assertRedirect(route('job.masterlist'));

        $row->refresh();
        $this->assertSame(DraftingRequest::STAGE_APM, $row->workflow_stage);

        $revision = DraftingRequestRevision::query()
            ->where('drafting_request_id', $row->id)
            ->first();

        $this->assertNotNull($revision);
        $this->assertSame($row->jobNumber().'-01', $revision->code);

        $this->actingAs($user)
            ->get(route('job.masterlist'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Job/Masterlist/Index')
                ->has('draftingRequests.data', 1)
                ->where('draftingRequests.data.0.workflow_stage', DraftingRequest::STAGE_APM)
                ->where('draftingRequests.data.0.can_edit_masterlist', false));

        $this->actingAs($user)
            ->get(route('job.list'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Job/Board')
                ->has('jobs.data', 1));

        $second = $this->actingAs($user)->post(route('job.masterlist.forward', $row));
        $second->assertNotFound();
    }

    public function test_board_add_reopens_submitted_apm_with_next_revision(): void
    {
        $user = $this->adminUser();
        [$storeyLevel, $category] = $this->seedLookups();

        $row = DraftingRequest::query()->create([
            'user_id' => $user->id,
            'status' => DraftingRequest::STATUS_SUBMITTED,
            'review_status' => DraftingRequest::REVIEW_ACCEPTED,
            'workflow_stage' => DraftingRequest::STAGE_APM,
            'requested_at' => now(),
            'your_name' => 'Nikaia',
            'company_name' => 'Nikaia Co',
            'email' => 'nikaia@example.com',
            'site_address' => '8 Submitted St',
            'site_owner_name' => 'Owner',
            'storey_level_id' => $storeyLevel->id,
            'crm_category_id' => $category->id,
            'ceiling_heights' => '2700',
            'ndis_sda' => false,
        ]);

        DraftingRequestRevision::query()->create([
            'drafting_request_id' => $row->id,
            'user_id' => $user->id,
            'code' => $row->jobNumber().'-01',
            'log_date' => now()->toDateString(),
            'category' => 'WD',
            'drafter_user_id' => $user->id,
            'drafter_initials' => 'AD',
            'status' => DraftingRequest::STATUS_SUBMITTED,
        ]);

        $response = $this->actingAs($user)->post(route('job.board.add', $row));

        $response->assertRedirect(route('job.drafting.show', $row));
        $response->assertSessionHas('status', 'board-reopened');
        $response->assertSessionHas('revision_code', $row->jobNumber().'-02');

        $row->refresh();
        $this->assertSame(DraftingRequest::STATUS_NEW, $row->status);
        $this->assertSame(DraftingRequest::STAGE_APM, $row->workflow_stage);

        $this->assertTrue(
            DraftingRequestRevision::query()
                ->where('drafting_request_id', $row->id)
                ->where('code', $row->jobNumber().'-02')
                ->where('status', DraftingRequest::STATUS_NEW)
                ->exists(),
        );

        $this->actingAs($user)
            ->get(route('job.list'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Job/Board')
                ->has('jobs.data', 1)
                ->where('jobs.data.0.status', DraftingRequest::STATUS_NEW));
    }

    public function test_board_add_forwards_masterlist_entry(): void
    {
        $user = $this->adminUser();
        [$storeyLevel, $category, $client, $buildingClass] = $this->seedLookups();

        $this->actingAs($user)->post(route('job.masterlist.store'), $this->validPayload(
            $storeyLevel->id,
            $category->id,
            $client,
            $buildingClass,
        ));

        $row = DraftingRequest::query()->firstOrFail();

        $response = $this->actingAs($user)->post(route('job.board.add', $row));

        $response->assertRedirect(route('job.drafting.show', $row));
        $response->assertSessionHas('status', 'masterlist-forwarded');

        $row->refresh();
        $this->assertSame(DraftingRequest::STAGE_APM, $row->workflow_stage);
    }

    public function test_board_candidates_include_submitted_apm_jobs(): void
    {
        $user = $this->adminUser();
        [$storeyLevel, $category] = $this->seedLookups();

        $submitted = DraftingRequest::query()->create([
            'user_id' => $user->id,
            'status' => DraftingRequest::STATUS_SUBMITTED,
            'review_status' => DraftingRequest::REVIEW_ACCEPTED,
            'workflow_stage' => DraftingRequest::STAGE_APM,
            'requested_at' => now(),
            'your_name' => 'Submitted Client',
            'company_name' => 'Submitted Co',
            'email' => 'submitted@example.com',
            'site_address' => '9 Done St',
            'site_owner_name' => 'Owner',
            'storey_level_id' => $storeyLevel->id,
            'crm_category_id' => $category->id,
            'ceiling_heights' => '2700',
            'ndis_sda' => false,
        ]);

        DraftingRequestRevision::query()->create([
            'drafting_request_id' => $submitted->id,
            'user_id' => $user->id,
            'code' => $submitted->jobNumber().'-01',
            'log_date' => now()->toDateString(),
            'category' => 'WD',
            'status' => DraftingRequest::STATUS_SUBMITTED,
        ]);

        $this->actingAs($user)
            ->get(route('job.list'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Job/Board')
                ->has('masterlistCandidates', 1)
                ->where('masterlistCandidates.0.id', $submitted->id)
                ->where('masterlistCandidates.0.source', 'apm'));
    }

    public function test_board_candidates_include_all_active_apm_drafts(): void
    {
        $user = $this->adminUser();
        [$storeyLevel, $category] = $this->seedLookups();

        $newJob = DraftingRequest::query()->create([
            'user_id' => $user->id,
            'status' => DraftingRequest::STATUS_NEW,
            'review_status' => DraftingRequest::REVIEW_ACCEPTED,
            'workflow_stage' => DraftingRequest::STAGE_APM,
            'requested_at' => now()->subMinute(),
            'your_name' => 'New Client',
            'company_name' => 'New Co',
            'email' => 'new@example.com',
            'site_address' => '1 New St',
            'site_owner_name' => 'Owner',
            'storey_level_id' => $storeyLevel->id,
            'crm_category_id' => $category->id,
            'ceiling_heights' => '2700',
            'ndis_sda' => false,
        ]);

        $wipJob = DraftingRequest::query()->create([
            'user_id' => $user->id,
            'status' => DraftingRequest::STATUS_DRAFTING_WIP,
            'review_status' => DraftingRequest::REVIEW_ACCEPTED,
            'workflow_stage' => DraftingRequest::STAGE_APM,
            'requested_at' => now(),
            'your_name' => 'Wip Client',
            'company_name' => 'Wip Co',
            'email' => 'wip@example.com',
            'site_address' => '2 Wip St',
            'site_owner_name' => 'Owner',
            'storey_level_id' => $storeyLevel->id,
            'crm_category_id' => $category->id,
            'ceiling_heights' => '2700',
            'ndis_sda' => false,
        ]);

        foreach ([$newJob, $wipJob] as $job) {
            DraftingRequestRevision::query()->create([
                'drafting_request_id' => $job->id,
                'user_id' => $user->id,
                'code' => $job->jobNumber().'-01',
                'log_date' => now()->toDateString(),
                'category' => 'WD',
                'status' => $job->status,
            ]);
        }

        $this->actingAs($user)
            ->get(route('job.list'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Job/Board')
                ->has('masterlistCandidates', 2)
                ->where('masterlistCandidates.0.source', 'apm')
                ->where('masterlistCandidates.1.source', 'apm'));
    }

    public function test_public_accept_lands_on_masterlist_only(): void
    {
        $admin = $this->adminUser();
        [$storeyLevel, $category] = $this->seedLookups();

        $row = DraftingRequest::query()->create([
            'user_id' => null,
            'status' => DraftingRequest::STATUS_NEW,
            'review_status' => DraftingRequest::REVIEW_PENDING,
            'workflow_stage' => DraftingRequest::STAGE_MASTERLIST,
            'requested_at' => now(),
            'your_name' => 'Public Client',
            'company_name' => 'Public Co',
            'email' => 'public@example.com',
            'site_address' => '1 Test St',
            'site_owner_name' => 'Owner',
            'storey_level_id' => $storeyLevel->id,
            'crm_category_id' => $category->id,
            'ceiling_heights' => '2700',
            'ndis_sda' => false,
        ]);

        $this->actingAs($admin)
            ->post(route('job.drafting-requests.accept', $row))
            ->assertRedirect();

        $row->refresh();
        $this->assertSame(DraftingRequest::REVIEW_ACCEPTED, $row->review_status);
        $this->assertSame(DraftingRequest::STAGE_MASTERLIST, $row->workflow_stage);

        $board = app(DraftingRequestBoardService::class);
        $ids = $board->baseQuery(Request::create('/job/board', 'GET'))->pluck('id');
        $this->assertFalse($ids->contains($row->id));
    }

    public function test_board_query_never_returns_masterlist_rows(): void
    {
        $user = $this->adminUser();
        [$storeyLevel, $category] = $this->seedLookups();

        $masterlist = DraftingRequest::query()->create([
            'user_id' => $user->id,
            'status' => DraftingRequest::STATUS_NEW,
            'review_status' => DraftingRequest::REVIEW_ACCEPTED,
            'workflow_stage' => DraftingRequest::STAGE_MASTERLIST,
            'requested_at' => now(),
            'your_name' => 'Masterlist Only',
            'company_name' => 'ML Co',
            'email' => 'ml@example.com',
            'site_address' => '2 Test St',
            'site_owner_name' => 'Owner',
            'storey_level_id' => $storeyLevel->id,
            'crm_category_id' => $category->id,
            'ceiling_heights' => '2700',
            'ndis_sda' => false,
        ]);

        $apm = DraftingRequest::query()->create([
            'user_id' => $user->id,
            'status' => DraftingRequest::STATUS_NEW,
            'review_status' => DraftingRequest::REVIEW_ACCEPTED,
            'workflow_stage' => DraftingRequest::STAGE_APM,
            'requested_at' => now(),
            'your_name' => 'On Board',
            'company_name' => 'APM Co',
            'email' => 'apm@example.com',
            'site_address' => '3 Test St',
            'site_owner_name' => 'Owner',
            'storey_level_id' => $storeyLevel->id,
            'crm_category_id' => $category->id,
            'ceiling_heights' => '2700',
            'ndis_sda' => false,
        ]);

        DraftingRequestRevision::query()->create([
            'drafting_request_id' => $apm->id,
            'user_id' => $user->id,
            'code' => $apm->jobNumber().'-01',
            'log_date' => now()->toDateString(),
            'category' => 'WD',
            'status' => DraftingRequest::STATUS_NEW,
        ]);

        $request = Request::create('/job/board', 'GET');
        $request->setUserResolver(fn () => $user);

        $ids = app(DraftingRequestBoardService::class)
            ->baseQuery($request)
            ->pluck('id');

        $this->assertTrue($ids->contains($apm->id));
        $this->assertFalse($ids->contains($masterlist->id));
    }

    public function test_archived_jobs_from_masterlist_and_apm_appear_in_archive(): void
    {
        $user = $this->adminUser();
        [$storeyLevel, $category] = $this->seedLookups();

        $masterlist = DraftingRequest::query()->create([
            'user_id' => $user->id,
            'status' => DraftingRequest::STATUS_NEW,
            'review_status' => DraftingRequest::REVIEW_ACCEPTED,
            'workflow_stage' => DraftingRequest::STAGE_MASTERLIST,
            'requested_at' => now(),
            'your_name' => 'Archived Masterlist',
            'company_name' => 'ML Co',
            'email' => 'archived-ml@example.com',
            'site_address' => '2 Archive St',
            'site_owner_name' => 'Owner',
            'storey_level_id' => $storeyLevel->id,
            'crm_category_id' => $category->id,
            'ceiling_heights' => '2700',
            'ndis_sda' => false,
            'archived_at' => now()->subMinute(),
        ]);

        $apm = DraftingRequest::query()->create([
            'user_id' => $user->id,
            'status' => DraftingRequest::STATUS_NEW,
            'review_status' => DraftingRequest::REVIEW_ACCEPTED,
            'workflow_stage' => DraftingRequest::STAGE_APM,
            'requested_at' => now(),
            'your_name' => 'Archived APM',
            'company_name' => 'APM Co',
            'email' => 'archived-apm@example.com',
            'site_address' => '3 Archive St',
            'site_owner_name' => 'Owner',
            'storey_level_id' => $storeyLevel->id,
            'crm_category_id' => $category->id,
            'ceiling_heights' => '2700',
            'ndis_sda' => false,
            'archived_at' => now(),
        ]);

        $this->actingAs($user)
            ->get(route('job.drafting.archive'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Job/Drafting/Archive')
                ->has('draftingRequests.data', 2)
                ->where('draftingRequests.data.0.id', $apm->id)
                ->where('draftingRequests.data.1.id', $masterlist->id));

        $this->actingAs($user)
            ->get(route('job.drafting.show', $masterlist).'?from=archive')
            ->assertOk();
    }

    public function test_deleting_last_revision_returns_job_to_masterlist_dropdown(): void
    {
        $user = $this->adminUser();
        [$storeyLevel, $category, $client, $buildingClass] = $this->seedLookups();

        $this->actingAs($user)->post(route('job.masterlist.store'), $this->validPayload(
            $storeyLevel->id,
            $category->id,
            $client,
            $buildingClass,
        ));

        $row = DraftingRequest::query()->firstOrFail();
        $this->actingAs($user)->post(route('job.board.add', $row));

        $row->refresh();
        $this->assertSame(DraftingRequest::STAGE_APM, $row->workflow_stage);

        $revision = DraftingRequestRevision::query()
            ->where('drafting_request_id', $row->id)
            ->firstOrFail();

        $response = $this->actingAs($user)->delete(
            route('job.drafting.revisions.destroy', [$row, $revision]),
        );

        $response->assertRedirect(route('job.list'));
        $response->assertSessionHas('status', 'drf-revision-deleted-returned-to-masterlist');

        $row->refresh();
        $this->assertSame(DraftingRequest::STAGE_MASTERLIST, $row->workflow_stage);
        $this->assertSame(0, $row->revisions()->count());

        $this->actingAs($user)
            ->get(route('job.list'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Job/Board')
                ->has('jobs.data', 0)
                ->has('masterlistCandidates', 1)
                ->where('masterlistCandidates.0.id', $row->id)
                ->where('masterlistCandidates.0.source', 'masterlist'));
    }

    public function test_deleting_one_of_many_revisions_keeps_job_on_apm(): void
    {
        $user = $this->adminUser();
        [$storeyLevel, $category] = $this->seedLookups();

        $row = DraftingRequest::query()->create([
            'user_id' => $user->id,
            'status' => DraftingRequest::STATUS_NEW,
            'review_status' => DraftingRequest::REVIEW_ACCEPTED,
            'workflow_stage' => DraftingRequest::STAGE_APM,
            'requested_at' => now(),
            'your_name' => 'Multi Rev',
            'company_name' => 'Multi Co',
            'email' => 'multi@example.com',
            'site_address' => '9 Multi St',
            'site_owner_name' => 'Owner',
            'storey_level_id' => $storeyLevel->id,
            'crm_category_id' => $category->id,
            'ceiling_heights' => '2700',
            'ndis_sda' => false,
        ]);

        $first = DraftingRequestRevision::query()->create([
            'drafting_request_id' => $row->id,
            'user_id' => $user->id,
            'code' => $row->jobNumber().'-01',
            'log_date' => now()->toDateString(),
            'category' => 'WD',
            'status' => DraftingRequest::STATUS_SUBMITTED,
        ]);

        DraftingRequestRevision::query()->create([
            'drafting_request_id' => $row->id,
            'user_id' => $user->id,
            'code' => $row->jobNumber().'-02',
            'log_date' => now()->toDateString(),
            'category' => 'WD',
            'status' => DraftingRequest::STATUS_NEW,
        ]);

        $response = $this->actingAs($user)->delete(
            route('job.drafting.revisions.destroy', [$row, $first]),
        );

        $response->assertRedirect(route('job.list'));
        $response->assertSessionHas('status', 'drf-revision-deleted');

        $row->refresh();
        $this->assertSame(DraftingRequest::STAGE_APM, $row->workflow_stage);
        $this->assertSame(1, $row->revisions()->count());

        $this->actingAs($user)
            ->get(route('job.list'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Job/Board')
                ->has('jobs.data', 1)
                ->where('jobs.data.0.id', $row->id)
                ->where('jobs.data.0.latest_revision', $row->jobNumber().'-02'));
    }

    public function test_board_heals_apm_jobs_with_no_revisions_back_to_masterlist(): void
    {
        $user = $this->adminUser();
        [$storeyLevel, $category] = $this->seedLookups();

        $orphan = DraftingRequest::query()->create([
            'user_id' => $user->id,
            'status' => DraftingRequest::STATUS_NEW,
            'review_status' => DraftingRequest::REVIEW_ACCEPTED,
            'workflow_stage' => DraftingRequest::STAGE_APM,
            'requested_at' => now(),
            'your_name' => 'Orphan Job',
            'company_name' => 'Orphan Co',
            'email' => 'orphan@example.com',
            'site_address' => '10 Orphan St',
            'site_owner_name' => 'Owner',
            'storey_level_id' => $storeyLevel->id,
            'crm_category_id' => $category->id,
            'ceiling_heights' => '2700',
            'ndis_sda' => false,
            'lead_number' => '26016',
        ]);

        $this->assertSame(0, $orphan->revisions()->count());

        $this->actingAs($user)
            ->get(route('job.list'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Job/Board')
                ->has('jobs.data', 0)
                ->has('masterlistCandidates', 1)
                ->where('masterlistCandidates.0.id', $orphan->id)
                ->where('masterlistCandidates.0.source', 'masterlist'));

        $orphan->refresh();
        $this->assertSame(DraftingRequest::STAGE_MASTERLIST, $orphan->workflow_stage);
    }

    public function test_board_revision_no_never_invents_suffix_without_revision_row(): void
    {
        $user = $this->adminUser();
        [$storeyLevel, $category] = $this->seedLookups();

        $job = DraftingRequest::query()->create([
            'user_id' => $user->id,
            'status' => DraftingRequest::STATUS_NEW,
            'review_status' => DraftingRequest::REVIEW_ACCEPTED,
            'workflow_stage' => DraftingRequest::STAGE_APM,
            'requested_at' => now(),
            'your_name' => 'Bare Lead',
            'company_name' => 'Superior Homes (Aust) Pty Ltd',
            'email' => 'superior@example.com',
            'site_address' => 'Lot 396A Knutsford Avenue, Kewdale',
            'site_owner_name' => 'Owner',
            'storey_level_id' => $storeyLevel->id,
            'crm_category_id' => $category->id,
            'ceiling_heights' => '2700',
            'ndis_sda' => false,
            'lead_number' => '26016',
        ]);

        // Legacy bare lead stored as revision code (no "-01" row).
        DraftingRequestRevision::query()->create([
            'drafting_request_id' => $job->id,
            'user_id' => $user->id,
            'code' => '26016',
            'log_date' => now()->toDateString(),
            'category' => 'WD',
            'status' => DraftingRequest::STATUS_NEW,
        ]);

        $formatted = app(DraftingRequestBoardService::class)->formatBoardRow($job->fresh()->load('revisions'));

        $this->assertSame('26016', $formatted['latest_revision']);
        $this->assertNotSame('26016-01', $formatted['latest_revision']);

        // After deleting the only revision, board must not keep a fake "-01".
        $job->revisions()->delete();
        app(\App\Services\DraftingRequestSubmissionService::class)
            ->returnToMasterlistIfNoRevisions($job->fresh(), $user);

        $request = Request::create('/job/list', 'GET');
        $ids = app(DraftingRequestBoardService::class)->baseQuery($request)->pluck('id');
        $this->assertFalse($ids->contains($job->id));
    }

    private function adminUser(): User
    {
        $adminRoleId = Role::query()->where('slug', 'admin')->value('id');

        return User::factory()->create([
            'role_id' => $adminRoleId,
        ]);
    }

    /**
     * @return array{0: StoreyLevel, 1: CrmCategory, 2: Client, 3: BuildingClass}
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

        $client = Client::query()->create([
            'name' => 'Acme Design',
            'status' => 'active',
        ]);
        $client->ensureCoreContacts();
        $client->mainContact()->update([
            'name' => 'Jane Architect',
            'email' => 'jane@acme.test',
            'mobile' => '0400000000',
        ]);
        $client->load('mainContact');

        $buildingClass = BuildingClass::query()->create([
            'code' => '1a',
            'name' => 'Class 1a',
            'status' => 'active',
        ]);

        return [$storeyLevel, $category, $client, $buildingClass];
    }

    /**
     * @return array<string, mixed>
     */
    private function validPayload(
        int $storeyLevelId,
        int $categoryId,
        Client $client,
        ?BuildingClass $buildingClass = null,
    ): array {
        $main = $client->mainContact;
        return [
            'lead_number' => '26001',
            'requested_at' => now()->format('Y-m-d H:i:s'),
            'your_name' => $main?->name ?? 'Jane Architect',
            'client_id' => $client->id,
            'client_contact_id' => $main?->id,
            'company_name' => $client->name,
            'email' => $main?->email,
            'phone' => $main?->mobile,
            'crm_category_id' => $categoryId,
            'crm_category_ids' => [$categoryId],
            'site_address' => '10 Example Road',
            'council_shire' => 'Example Shire',
            'site_owner_name' => 'Site Owner',
            'storey_level_id' => $storeyLevelId,
            'building_class_id' => $buildingClass?->id ?? BuildingClass::query()->value('id'),
            'ndis_sda' => false,
            'sda_type_ids' => [],
        ];
    }
}
