<?php

namespace Tests\Feature;

use App\Models\BuildingClass;
use App\Models\BuildingType;
use App\Models\Client;
use App\Models\DraftingRequest;
use App\Models\DraftingRequestRevision;
use App\Models\Role;
use App\Models\ServiceEngaging;
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
        [$buildingType, $service, $client, $buildingClass] = $this->seedLookups();

        $response = $this->actingAs($user)->post(route('job.masterlist.store'), $this->validPayload(
            $buildingType->id,
            $service->id,
            $client,
            $buildingClass,
        ));

        $response->assertRedirect(route('job.masterlist'));

        $row = DraftingRequest::query()->first();
        $this->assertNotNull($row);
        $this->assertSame(DraftingRequest::STAGE_MASTERLIST, $row->workflow_stage);
        $this->assertSame(DraftingRequest::REVIEW_ACCEPTED, $row->review_status);

        $this->actingAs($user)
            ->get(route('job.masterlist'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Job/Masterlist/Index')
                ->has('draftingRequests.data', 1));

        $this->actingAs($user)
            ->get(route('job.board'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Job/Board')
                ->has('jobs.data', 0));
    }

    public function test_forward_moves_to_apm_and_seeds_revision_code(): void
    {
        $user = $this->adminUser();
        [$buildingType, $service, $client, $buildingClass] = $this->seedLookups();

        $this->actingAs($user)->post(route('job.masterlist.store'), $this->validPayload(
            $buildingType->id,
            $service->id,
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
            ->get(route('job.board'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Job/Board')
                ->has('jobs.data', 1));

        $second = $this->actingAs($user)->post(route('job.masterlist.forward', $row));
        $second->assertNotFound();
    }

    public function test_public_accept_lands_on_masterlist_only(): void
    {
        $admin = $this->adminUser();
        [$buildingType, $service] = $this->seedLookups();

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
            'building_type_id' => $buildingType->id,
            'ceiling_heights' => '2700',
            'ndis_sda' => false,
        ]);
        $row->serviceEngagings()->sync([$service->id]);

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
        [$buildingType] = $this->seedLookups();

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
            'building_type_id' => $buildingType->id,
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
            'building_type_id' => $buildingType->id,
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
     * @return array{0: BuildingType, 1: ServiceEngaging, 2: Client, 3: BuildingClass}
     */
    private function seedLookups(): array
    {
        $buildingType = BuildingType::query()->create([
            'name' => 'Residential',
            'status' => 'active',
        ]);

        $service = ServiceEngaging::query()->create([
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

        return [$buildingType, $service, $client, $buildingClass];
    }

    /**
     * @return array<string, mixed>
     */
    private function validPayload(
        int $buildingTypeId,
        int $serviceId,
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
            'service_engaging_ids' => [$serviceId],
            'site_address' => '10 Example Road',
            'council_shire' => 'Example Shire',
            'site_owner_name' => 'Site Owner',
            'building_type_id' => $buildingTypeId,
            'building_class_id' => $buildingClass?->id ?? BuildingClass::query()->value('id'),
            'ndis_sda' => false,
            'sda_type_ids' => [],
        ];
    }
}
