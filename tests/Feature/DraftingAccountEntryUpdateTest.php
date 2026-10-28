<?php

namespace Tests\Feature;

use App\Models\CrmCategory;
use App\Models\DraftingRequest;
use App\Models\DraftingRequestAccountEntry;
use App\Models\Role;
use App\Models\StoreyLevel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DraftingAccountEntryUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_manager_with_accounts_add_can_edit_quote_on_job_they_do_not_own(): void
    {
        $owner = $this->adminUser();
        $manager = $this->managerWithAccountsPermission();
        [$storeyLevel, $category] = $this->seedLookups();

        $job = DraftingRequest::query()->create([
            'user_id' => $owner->id,
            'status' => DraftingRequest::STATUS_NEW,
            'review_status' => DraftingRequest::REVIEW_ACCEPTED,
            'workflow_stage' => DraftingRequest::STAGE_MASTERLIST,
            'requested_at' => now(),
            'your_name' => 'Client',
            'company_name' => 'Client Co',
            'email' => 'client@example.com',
            'site_address' => 'Lot 34 Torwood Ave, Treeby',
            'site_owner_name' => 'Owner',
            'storey_level_id' => $storeyLevel->id,
            'crm_category_id' => $category->id,
            'ceiling_heights' => '2700',
            'ndis_sda' => false,
        ]);

        $quote = DraftingRequestAccountEntry::query()->create([
            'drafting_request_id' => $job->id,
            'user_id' => $owner->id,
            'kind' => DraftingRequestAccountEntry::KIND_QUOTE,
            'number' => 'Q20260029-00',
            'category' => $category->code,
            'rate' => null,
            'status' => DraftingRequestAccountEntry::QUOTE_STATUS_FOR_QUOTE,
        ]);

        $this->actingAs($manager)
            ->patch(route('job.drafting.accounts.update', [$job, $quote]), [
                'number' => 'Q20260029-01',
                'category' => $category->code,
                'rate' => '',
                'status' => DraftingRequestAccountEntry::QUOTE_STATUS_FOR_QUOTE,
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $quote->refresh();
        $this->assertSame('Q20260029-01', $quote->number);
    }

    public function test_user_with_accounts_add_can_delete_quote_and_invoice(): void
    {
        $owner = $this->adminUser();
        $manager = $this->managerWithAccountsPermission();
        [$storeyLevel, $category] = $this->seedLookups();

        $job = DraftingRequest::query()->create([
            'user_id' => $owner->id,
            'status' => DraftingRequest::STATUS_NEW,
            'review_status' => DraftingRequest::REVIEW_ACCEPTED,
            'workflow_stage' => DraftingRequest::STAGE_MASTERLIST,
            'requested_at' => now(),
            'your_name' => 'Client',
            'company_name' => 'Client Co',
            'email' => 'client@example.com',
            'site_address' => 'Lot 34 Torwood Ave, Treeby',
            'site_owner_name' => 'Owner',
            'storey_level_id' => $storeyLevel->id,
            'crm_category_id' => $category->id,
            'ceiling_heights' => '2700',
            'ndis_sda' => false,
        ]);

        $entries = collect([DraftingRequestAccountEntry::KIND_QUOTE, DraftingRequestAccountEntry::KIND_INVOICE])
            ->map(fn (string $kind) => DraftingRequestAccountEntry::query()->create([
                'drafting_request_id' => $job->id,
                'user_id' => $owner->id,
                'kind' => $kind,
                'number' => strtoupper($kind).'-1',
                'category' => $category->code,
                'status' => DraftingRequestAccountEntry::QUOTE_STATUS_FOR_QUOTE,
            ]));

        foreach ($entries as $entry) {
            $this->actingAs($manager)
                ->delete(route('job.drafting.accounts.destroy', [$job, $entry]))
                ->assertRedirect();

            $this->assertDatabaseMissing('drafting_request_account_entries', ['id' => $entry->id]);
        }

        $this->assertDatabaseHas('drafting_request_activities', [
            'drafting_request_id' => $job->id,
            'action' => \App\Models\DraftingRequestActivity::ACTION_INVOICE_DELETED,
        ]);
    }

    public function test_entry_from_another_job_cannot_be_deleted(): void
    {
        $owner = $this->adminUser();
        [$storeyLevel, $category] = $this->seedLookups();

        $make = fn () => DraftingRequest::query()->create([
            'user_id' => $owner->id,
            'status' => DraftingRequest::STATUS_NEW,
            'review_status' => DraftingRequest::REVIEW_ACCEPTED,
            'workflow_stage' => DraftingRequest::STAGE_MASTERLIST,
            'requested_at' => now(),
            'your_name' => 'Client',
            'company_name' => 'Client Co',
            'email' => 'client@example.com',
            'site_address' => '1 Test St',
            'site_owner_name' => 'Owner',
            'storey_level_id' => $storeyLevel->id,
            'crm_category_id' => $category->id,
            'ceiling_heights' => '2700',
            'ndis_sda' => false,
        ]);
        $jobA = $make();
        $jobB = $make();

        $quote = DraftingRequestAccountEntry::query()->create([
            'drafting_request_id' => $jobB->id,
            'user_id' => $owner->id,
            'kind' => DraftingRequestAccountEntry::KIND_QUOTE,
            'number' => 'Q-1',
            'category' => $category->code,
            'status' => DraftingRequestAccountEntry::QUOTE_STATUS_FOR_QUOTE,
        ]);

        $this->actingAs($owner)
            ->delete(route('job.drafting.accounts.destroy', [$jobA, $quote]))
            ->assertNotFound();

        $this->assertDatabaseHas('drafting_request_account_entries', ['id' => $quote->id]);
    }

    private function adminUser(): User
    {
        $adminRoleId = Role::query()->where('slug', 'admin')->value('id');

        return User::factory()->create([
            'role_id' => $adminRoleId,
        ]);
    }

    private function managerWithAccountsPermission(): User
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
            'job.drafting-request.view',
            'job.drafting.view',
            'job.drafting.accounts.view',
            'job.drafting.accounts.add',
        ]);

        return User::factory()->create([
            'role_id' => $manager->id,
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
}
