<?php

namespace Tests\Feature;

use App\Models\CrmCategory;
use App\Models\DraftingRequest;
use App\Models\DraftingRequestActivity;
use App\Models\DraftingRequestComment;
use App\Models\DraftingRequestRevision;
use App\Models\Role;
use App\Models\StoreyLevel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DraftingAccountCommentTest extends TestCase
{
    use RefreshDatabase;

    public function test_account_comment_stays_with_quotes_and_invoices(): void
    {
        $admin = $this->adminUser();
        $job = $this->createApmJob($admin);

        $this->actingAs($admin)
            ->post(route('job.drafting.comments.store', $job), [
                'kind' => DraftingRequestComment::KIND_ACCOUNT,
                'body' => '<p>Follow up the quote.</p>',
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $comment = DraftingRequestComment::query()
            ->where('drafting_request_id', $job->id)
            ->first();

        $this->assertNotNull($comment);
        $this->assertSame(DraftingRequestComment::KIND_ACCOUNT, $comment->kind);
        $this->assertNull($comment->drafting_request_revision_id);

        $this->assertTrue(
            DraftingRequestActivity::query()
                ->where('drafting_request_id', $job->id)
                ->where('action', DraftingRequestActivity::ACTION_ACCOUNT_COMMENT_POSTED)
                ->exists(),
        );

        $this->actingAs($admin)
            ->get(route('job.drafting.show', $job))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('draftingRequest.account_comments', 1)
                ->has('draftingRequest.comments', 0)
                ->has('draftingRequest.account_activities', 1)
                ->where('draftingRequest.activities', fn ($activities) => collect($activities)
                    ->where('action', DraftingRequestActivity::ACTION_ACCOUNT_COMMENT_POSTED)
                    ->isEmpty()));
    }

    private function adminUser(): User
    {
        $adminRoleId = Role::query()->where('slug', 'admin')->value('id');

        return User::factory()->create([
            'role_id' => $adminRoleId,
        ]);
    }

    private function createApmJob(User $user): DraftingRequest
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
            'lead_number' => '26011',
        ]);

        DraftingRequestRevision::query()->create([
            'drafting_request_id' => $job->id,
            'user_id' => $user->id,
            'code' => '26011-01',
            'log_date' => now()->toDateString(),
            'category' => $category->code,
            'status' => DraftingRequest::STATUS_NEW,
        ]);

        return $job;
    }
}
