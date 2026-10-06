<?php

namespace Tests\Feature;

use App\Models\BuildingClass;
use App\Models\Client;
use App\Models\CrmCategory;
use App\Models\DraftingRequest;
use App\Models\Role;
use App\Models\StoreyLevel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MasterlistClientDetailsUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_masterlist_form_update_changes_client_snapshot(): void
    {
        $admin = $this->adminUser();
        [$storey, $category, $buildingClass, $original, $replacement] = $this->seedLookups();
        $job = $this->masterlistJob($admin, $storey, $category, $buildingClass, $original);

        $payload = $this->payload($job, $storey, $category, $buildingClass, $replacement);
        $payload['email'] = 'Jane.New@Example.TEST';

        $this->actingAs($admin)
            ->post(route('job.masterlist.update', $job), $payload)
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('job.masterlist'));

        $job->refresh();
        $contact = $replacement->mainContact;

        $this->assertSame($replacement->id, $job->client_id);
        $this->assertSame($contact->id, $job->client_contact_id);
        $this->assertSame('Replacement Homes', $job->company_name);
        $this->assertSame('Logged In Encoder', $job->your_name);
        $this->assertSame('jane.new@example.test', $job->email);
        $this->assertSame('0499999999', $job->phone);

        $this->actingAs($admin)
            ->get(route('job.masterlist.show', $job))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('draftingRequest.company_name', 'Replacement Homes')
                ->where('draftingRequest.client_contact_name', 'New Contact')
                ->where('draftingRequest.client_contact_email', 'jane.new@example.test')
                ->where('draftingRequest.client_contact_phone', '0499999999'));
    }

    public function test_masterlist_show_client_edit_persists_when_ceiling_height_is_empty(): void
    {
        $admin = $this->adminUser();
        [$storey, $category, $buildingClass, $original, $replacement] = $this->seedLookups();
        $job = $this->masterlistJob($admin, $storey, $category, $buildingClass, $original);
        $job->update(['ceiling_heights' => null]);

        $contact = $replacement->mainContact;

        $this->actingAs($admin)
            ->patch(route('job.drafting.update', $job).'?from=masterlist', [
                'section' => 'job',
                'lead_number' => '26077',
                'status' => DraftingRequest::STATUS_NEW,
                'client_id' => $replacement->id,
                'client_contact_id' => $contact->id,
                'storey_level_id' => $storey->id,
                'crm_category_ids' => [$category->id],
                'site_address' => '9 Masterlist Rd',
                'site_owner_name' => 'Owner',
                'ceiling_heights' => '',
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $job->refresh();
        $this->assertSame($replacement->id, $job->client_id);
        $this->assertSame('Replacement Homes', $job->company_name);
        $this->assertSame('New Contact', $job->your_name);
    }

    public function test_client_section_save_is_what_the_masterlist_page_shows(): void
    {
        $admin = $this->adminUser();
        [$storey, $category, $buildingClass, $original] = array_slice($this->seedLookups(), 0, 4);
        $job = $this->masterlistJob($admin, $storey, $category, $buildingClass, $original);

        $this->actingAs($admin)
            ->patch(route('job.drafting.update', $job).'?from=masterlist', [
                'section' => 'client',
                'company_name' => 'Typed Client Pty Ltd',
                'your_name' => 'Typed Contact',
                'email' => 'typed@example.test',
            ])
            ->assertSessionHasNoErrors();

        $job->refresh();
        $this->assertSame('Typed Client Pty Ltd', $job->company_name);
        $this->assertSame('Typed Contact', $job->your_name);
        $this->assertSame('typed@example.test', $job->email);

        $this->actingAs($admin)
            ->get(route('job.masterlist.show', $job))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('draftingRequest.company_name', 'Typed Client Pty Ltd')
                ->where('draftingRequest.client_contact_name', 'Typed Contact')
                ->where('draftingRequest.client_contact_email', 'typed@example.test'));
    }

    private function adminUser(): User
    {
        $adminRoleId = Role::query()->where('slug', 'admin')->value('id');

        return User::factory()->create([
            'role_id' => $adminRoleId,
            'name' => 'Logged In Encoder',
        ]);
    }

    /**
     * @return array{0: StoreyLevel, 1: CrmCategory, 2: BuildingClass, 3: Client, 4: Client}
     */
    private function seedLookups(): array
    {
        $storey = StoreyLevel::query()->create([
            'code' => '1s',
            'name' => '1 storey',
            'status' => 'active',
        ]);
        $category = CrmCategory::query()->create([
            'code' => 'WD',
            'name' => 'Working Drawings',
            'status' => 'active',
        ]);
        $buildingClass = BuildingClass::query()->create([
            'code' => '1a',
            'name' => 'Class 1a',
            'status' => 'active',
        ]);

        $original = Client::query()->create([
            'name' => 'Original Homes',
            'status' => 'active',
        ]);
        $original->ensureCoreContacts();
        $original->mainContact()->update([
            'name' => 'Old Contact',
            'email' => 'old@example.test',
            'mobile' => '0400000001',
        ]);

        $replacement = Client::query()->create([
            'name' => 'Replacement Homes',
            'status' => 'active',
        ]);
        $replacement->ensureCoreContacts();
        $replacement->mainContact()->update([
            'name' => 'New Contact',
            'email' => 'jane.new@example.test',
            'mobile' => '0499999999',
        ]);
        $replacement->load('mainContact');

        return [$storey, $category, $buildingClass, $original, $replacement];
    }

    private function masterlistJob(
        User $user,
        StoreyLevel $storey,
        CrmCategory $category,
        BuildingClass $buildingClass,
        Client $client,
    ): DraftingRequest {
        $client->load('mainContact');

        return DraftingRequest::query()->create([
            'user_id' => $user->id,
            'status' => DraftingRequest::STATUS_NEW,
            'review_status' => DraftingRequest::REVIEW_ACCEPTED,
            'workflow_stage' => DraftingRequest::STAGE_MASTERLIST,
            'requested_at' => now(),
            'lead_number' => '26077',
            'your_name' => 'Old Contact',
            'company_name' => 'Original Homes',
            'client_id' => $client->id,
            'client_contact_id' => $client->mainContact->id,
            'email' => 'old@example.test',
            'phone' => '0400000001',
            'site_address' => '9 Masterlist Rd',
            'site_owner_name' => 'Owner',
            'storey_level_id' => $storey->id,
            'building_class_id' => $buildingClass->id,
            'crm_category_id' => $category->id,
            'ceiling_heights' => '2700',
            'ndis_sda' => false,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(
        DraftingRequest $job,
        StoreyLevel $storey,
        CrmCategory $category,
        BuildingClass $buildingClass,
        Client $client,
    ): array {
        $client->load('mainContact');
        $contact = $client->mainContact;

        return [
            'lead_number' => $job->lead_number,
            'requested_at' => now()->format('Y-m-d H:i:s'),
            'your_name' => 'Logged In Encoder',
            'client_id' => $client->id,
            'client_contact_id' => $contact->id,
            'company_name' => 'Original Homes',
            'email' => $contact->email,
            'phone' => $contact->mobile,
            'crm_category_id' => $category->id,
            'crm_category_ids' => [$category->id],
            'site_address' => '9 Masterlist Rd',
            'site_owner_name' => 'Owner',
            'storey_level_id' => $storey->id,
            'building_class_id' => $buildingClass->id,
            'ndis_sda' => false,
            'sda_type_ids' => [],
        ];
    }
}
