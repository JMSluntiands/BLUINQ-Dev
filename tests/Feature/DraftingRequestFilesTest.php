<?php

namespace Tests\Feature;

use App\Models\CrmCategory;
use App\Models\DraftingRequest;
use App\Models\DraftingRequestFile;
use App\Models\DraftingRequestRevision;
use App\Models\Role;
use App\Models\StoreyLevel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DraftingRequestFilesTest extends TestCase
{
    use RefreshDatabase;

    public function test_uploading_documents_persists_and_shows_on_job_page(): void
    {
        Storage::fake('local');

        $user = $this->adminUser();
        [$storeyLevel, $category] = $this->seedLookups();
        $job = $this->createApmJob($user, $storeyLevel, $category);

        $pdf = UploadedFile::fake()->create('feature-survey.pdf', 120, 'application/pdf');

        $this->actingAs($user)
            ->post(route('job.drafting.files.store', $job), [
                'documents' => [$pdf],
            ])
            ->assertRedirect(route('job.drafting.show', $job))
            ->assertSessionHas('status', 'drf-files-updated');

        $file = DraftingRequestFile::query()
            ->where('drafting_request_id', $job->id)
            ->where('kind', DraftingRequestFile::KIND_DOCUMENT)
            ->first();

        $this->assertNotNull($file);
        $this->assertSame('feature-survey.pdf', $file->original_name);
        Storage::disk('local')->assertExists($file->path);

        $this->actingAs($user)
            ->get(route('job.drafting.show', $job))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Job/Drafting/Show')
                ->has('draftingRequest.files', 1)
                ->where('draftingRequest.files.0.original_name', 'feature-survey.pdf')
                ->where('draftingRequest.files.0.kind', 'document'));
    }

    public function test_empty_document_upload_is_rejected(): void
    {
        $user = $this->adminUser();
        [$storeyLevel, $category] = $this->seedLookups();
        $job = $this->createApmJob($user, $storeyLevel, $category);

        $this->actingAs($user)
            ->from(route('job.drafting.show', $job))
            ->post(route('job.drafting.files.store', $job), [])
            ->assertRedirect(route('job.drafting.show', $job))
            ->assertSessionHasErrors('documents');

        $this->assertSame(0, DraftingRequestFile::query()->where('drafting_request_id', $job->id)->count());
    }

    public function test_facade_files_are_included_in_job_show_files_payload(): void
    {
        Storage::fake('local');

        $user = $this->adminUser();
        [$storeyLevel, $category] = $this->seedLookups();
        $job = $this->createApmJob($user, $storeyLevel, $category);

        DraftingRequestFile::query()->create([
            'drafting_request_id' => $job->id,
            'kind' => DraftingRequestFile::KIND_FACADE,
            'disk' => 'local',
            'path' => 'drafting-requests/'.$job->id.'/facade/plan.pdf',
            'original_name' => 'plan.pdf',
            'mime_type' => 'application/pdf',
            'size' => 2048,
        ]);

        $this->actingAs($user)
            ->get(route('job.drafting.show', $job))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Job/Drafting/Show')
                ->has('draftingRequest.files', 1)
                ->where('draftingRequest.files.0.kind', 'facade')
                ->where('draftingRequest.files.0.original_name', 'plan.pdf'));
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
        ]);

        DraftingRequestRevision::query()->create([
            'drafting_request_id' => $job->id,
            'user_id' => $user->id,
            'code' => $job->jobNumber().'-01',
            'log_date' => now()->toDateString(),
            'category' => $category->code,
            'status' => DraftingRequest::STATUS_NEW,
        ]);

        return $job;
    }
}
