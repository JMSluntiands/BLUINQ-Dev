<?php

namespace Tests\Feature;

use App\Models\CrmCategory;
use App\Models\CrmQuote;
use App\Models\CrmQuoteComment;
use App\Models\DraftingRequest;
use App\Models\DraftingRequestActivity;
use App\Models\DraftingRequestComment;
use App\Models\DraftingRequestRevision;
use App\Models\Role;
use App\Models\StoreyLevel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommentEditDeleteTest extends TestCase
{
    use RefreshDatabase;

    public function test_author_can_edit_and_delete_own_job_comment(): void
    {
        $admin = $this->userWithRole('admin');
        $job = $this->createApmJob($admin);
        $comment = $this->jobComment($job, $admin, '<p>Original</p>');

        $this->actingAs($admin)
            ->patchJson(route('job.drafting.comments.update', [$job, $comment->id]), [
                'body' => '<p>Updated</p>',
            ])
            ->assertOk()
            ->assertJsonPath('comment.body', '<p>Updated</p>')
            ->assertJsonPath('comment.can_manage', true);

        $this->assertSame('<p>Updated</p>', $comment->fresh()->body);

        $this->actingAs($admin)
            ->deleteJson(route('job.drafting.comments.destroy', [$job, $comment->id]))
            ->assertOk();

        $this->assertNull($comment->fresh());
        $this->assertTrue(DraftingRequestActivity::query()
            ->where('drafting_request_id', $job->id)
            ->where('action', DraftingRequestActivity::ACTION_COMMENT_DELETED)
            ->exists());
    }

    public function test_admin_can_manage_any_comment_but_other_users_cannot(): void
    {
        $admin = $this->userWithRole('admin');
        $author = $this->userWithRole('admin');
        $other = $this->userWithRole('user');
        $job = $this->createApmJob($admin);
        $comment = $this->jobComment($job, $author, '<p>By author</p>');

        $this->assertFalse($comment->canBeManagedBy($other));

        $this->actingAs($admin)
            ->patchJson(route('job.drafting.comments.update', [$job, $comment->id]), [
                'body' => '<p>Fixed by admin</p>',
            ])
            ->assertOk();

        $this->actingAs($admin)
            ->get(route('job.drafting.show', $job))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('draftingRequest.comments.0.can_manage', true));
    }

    public function test_comment_from_another_job_cannot_be_edited_through_this_job(): void
    {
        $admin = $this->userWithRole('admin');
        $job = $this->createApmJob($admin);
        $otherJob = $this->createApmJob($admin, '26012');
        $comment = $this->jobComment($otherJob, $admin, '<p>Other job</p>');

        $this->actingAs($admin)
            ->patchJson(route('job.drafting.comments.update', [$job, $comment->id]), [
                'body' => '<p>Hijack</p>',
            ])
            ->assertNotFound();

        $this->assertSame('<p>Other job</p>', $comment->fresh()->body);
    }

    public function test_crm_quote_comment_can_be_edited_and_deleted_by_author(): void
    {
        $admin = $this->userWithRole('admin');
        $quote = CrmQuote::query()->create([
            'user_id' => $admin->id,
            'client_company_name' => 'Quote Co',
            'site_address' => '1 Quote St',
        ]);
        $comment = CrmQuoteComment::query()->create([
            'crm_quote_id' => $quote->id,
            'user_id' => $admin->id,
            'kind' => CrmQuoteComment::KIND_COMMENT,
            'body' => '<p>Quote note</p>',
        ]);

        $this->actingAs($admin)
            ->patchJson(route('crm.quotes.comments.update', [$quote, $comment->id]), [
                'body' => '<p>Quote note edited</p>',
            ])
            ->assertOk()
            ->assertJsonPath('comment.body', '<p>Quote note edited</p>');

        $this->actingAs($admin)
            ->deleteJson(route('crm.quotes.comments.destroy', [$quote, $comment->id]))
            ->assertOk();

        $this->assertNull($comment->fresh());
    }

    private function userWithRole(string $slug): User
    {
        return User::factory()->create([
            'role_id' => Role::query()->where('slug', $slug)->value('id'),
        ]);
    }

    private function jobComment(DraftingRequest $job, User $user, string $body): DraftingRequestComment
    {
        return DraftingRequestComment::query()->create([
            'drafting_request_id' => $job->id,
            'user_id' => $user->id,
            'kind' => DraftingRequestComment::KIND_COMMENT,
            'body' => $body,
        ]);
    }

    private function createApmJob(User $user, string $leadNumber = '26011'): DraftingRequest
    {
        $storeyLevel = StoreyLevel::query()->firstOrCreate(
            ['code' => '2s'],
            ['name' => '2 storeys', 'status' => 'active'],
        );
        $category = CrmCategory::query()->firstOrCreate(
            ['code' => 'WD'],
            ['name' => 'Working Drawings', 'status' => 'active'],
        );

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
            'lead_number' => $leadNumber,
        ]);

        DraftingRequestRevision::query()->create([
            'drafting_request_id' => $job->id,
            'user_id' => $user->id,
            'code' => $leadNumber.'-01',
            'log_date' => now()->toDateString(),
            'category' => $category->code,
            'status' => DraftingRequest::STATUS_NEW,
        ]);

        return $job;
    }
}
