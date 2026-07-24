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
                ->has('jobs.data', 0));
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

        $this->actingAs($user)
            ->get(route('job.list'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Job/Board')
                ->has('masterlistCandidates', 1)
                ->where('masterlistCandidates.0.id', $submitted->id)
                ->where('masterlistCandidates.0.source', 'apm'));
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

        $request = Request::create('/job/board', 'GET');
        $request->setUserResolver(fn () => $user);

        $ids = app(DraftingRequestBoardService::class)
            ->baseQuery($request)
            ->pluck('id');

        $this->assertTrue($ids->contains($apm->id));
        $this->assertFalse($ids->contains($masterlist->id));
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
            'contact_name' => 'Jane Architect',
            'email' => 'jane@acme.test',
            'phone' => '0400000000',
            'status' => 'active',
        ]);

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
        return [
            'requested_at' => now()->format('Y-m-d H:i:s'),
            'your_name' => $client->contact_name,
            'client_id' => $client->id,
            'company_name' => $client->name,
            'email' => $client->email,
            'phone' => $client->phone,
            'crm_category_id' => $categoryId,
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
