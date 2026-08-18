<?php

namespace Tests\Feature;

use App\Models\LeaveRequest;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class LeaveRequestTest extends TestCase
{
    use RefreshDatabase;

    public function test_sick_leave_up_to_two_days_does_not_require_a_medical_certificate(): void
    {
        $user = $this->regularUser();
        $start = now()->addDay()->toDateString();
        $end = now()->addDays(2)->toDateString();

        $this->actingAs($user)
            ->from(route('dashboard'))
            ->post(route('leave.store'), [
                'start_date' => $start,
                'end_date' => $end,
                'type' => LeaveRequest::TYPE_SL,
                'reason' => 'Flu',
            ])
            ->assertRedirect(route('dashboard'));

        $leaveRequest = LeaveRequest::query()->first();
        $this->assertNotNull($leaveRequest);
        $this->assertSame($user->id, $leaveRequest->user_id);
        $this->assertSame(LeaveRequest::TYPE_SL, $leaveRequest->type);
        $this->assertSame($start, $leaveRequest->start_date->toDateString());
        $this->assertSame($end, $leaveRequest->end_date->toDateString());
        $this->assertFalse($leaveRequest->hasAttachment());
        $this->assertSame(2.0, $leaveRequest->dayCount());
    }

    public function test_sick_leave_over_two_days_requires_a_medical_certificate(): void
    {
        $user = $this->regularUser();

        $this->actingAs($user)
            ->from(route('dashboard'))
            ->post(route('leave.store'), [
                'start_date' => now()->addDay()->toDateString(),
                'end_date' => now()->addDays(3)->toDateString(),
                'type' => LeaveRequest::TYPE_SL,
                'reason' => 'Extended illness',
            ])
            ->assertRedirect(route('dashboard'))
            ->assertSessionHasErrors('medical_certificate');

        $this->assertSame(0, LeaveRequest::query()->count());
    }

    public function test_sick_leave_over_two_days_stores_the_medical_certificate_privately(): void
    {
        Storage::fake('local');

        $user = $this->regularUser();
        $file = UploadedFile::fake()->image('medical-cert.jpg', 200, 200);

        $this->actingAs($user)
            ->from(route('dashboard'))
            ->post(route('leave.store'), [
                'start_date' => now()->addDay()->toDateString(),
                'end_date' => now()->addDays(3)->toDateString(),
                'type' => LeaveRequest::TYPE_SL,
                'reason' => 'Extended illness',
                'medical_certificate' => $file,
            ])
            ->assertRedirect(route('dashboard'))
            ->assertSessionHasNoErrors();

        $leaveRequest = LeaveRequest::query()->first();
        $this->assertNotNull($leaveRequest);
        $this->assertTrue($leaveRequest->hasAttachment());
        $this->assertSame('local', $leaveRequest->attachment_disk);
        $this->assertSame('medical-cert.jpg', $leaveRequest->attachment_name);
        $this->assertTrue(Storage::disk('local')->exists($leaveRequest->attachment_path));
        $this->assertStringStartsWith('leave-requests/'.$leaveRequest->id.'/', $leaveRequest->attachment_path);
    }

    public function test_annual_leave_does_not_require_a_medical_certificate(): void
    {
        $user = $this->regularUser();

        $this->actingAs($user)
            ->from(route('dashboard'))
            ->post(route('leave.store'), [
                'start_date' => now()->addDay()->toDateString(),
                'end_date' => now()->addDays(5)->toDateString(),
                'type' => LeaveRequest::TYPE_AL,
                'reason' => 'Family trip',
            ])
            ->assertRedirect(route('dashboard'))
            ->assertSessionHasNoErrors();

        $leaveRequest = LeaveRequest::query()->first();
        $this->assertNotNull($leaveRequest);
        $this->assertSame(LeaveRequest::TYPE_AL, $leaveRequest->type);
        $this->assertFalse($leaveRequest->hasAttachment());
    }

    public function test_leave_request_requires_a_reason(): void
    {
        $user = $this->regularUser();

        $this->actingAs($user)
            ->from(route('dashboard'))
            ->post(route('leave.store'), [
                'start_date' => now()->addDay()->toDateString(),
                'end_date' => now()->addDay()->toDateString(),
                'type' => LeaveRequest::TYPE_AL,
            ])
            ->assertRedirect(route('dashboard'))
            ->assertSessionHasErrors('reason');

        $this->assertSame(0, LeaveRequest::query()->count());
    }

    public function test_same_day_half_day_leave_uses_half_a_day(): void
    {
        $user = $this->regularUser();
        $date = now()->addDay()->toDateString();

        $this->actingAs($user)
            ->from(route('dashboard'))
            ->post(route('leave.store'), [
                'start_date' => $date,
                'end_date' => $date,
                'start_portion' => LeaveRequest::PORTION_MORNING,
                'end_portion' => LeaveRequest::PORTION_MORNING,
                'type' => LeaveRequest::TYPE_AL,
                'reason' => 'Personal errand',
            ])
            ->assertRedirect(route('dashboard'))
            ->assertSessionHasNoErrors();

        $leaveRequest = LeaveRequest::query()->first();
        $this->assertNotNull($leaveRequest);
        $this->assertSame(0.5, $leaveRequest->dayCount());
    }

    public function test_same_day_leave_rejects_an_end_portion_before_the_start_portion(): void
    {
        $user = $this->regularUser();
        $date = now()->addDay()->toDateString();

        $this->actingAs($user)
            ->from(route('dashboard'))
            ->post(route('leave.store'), [
                'start_date' => $date,
                'end_date' => $date,
                'start_portion' => LeaveRequest::PORTION_AFTERNOON,
                'end_portion' => LeaveRequest::PORTION_MORNING,
                'type' => LeaveRequest::TYPE_AL,
                'reason' => 'Personal errand',
            ])
            ->assertRedirect(route('dashboard'))
            ->assertSessionHasErrors('end_portion');

        $this->assertSame(0, LeaveRequest::query()->count());
    }

    public function test_approving_a_half_day_leave_deducts_half_a_credit(): void
    {
        $user = $this->regularUser();
        $admin = $this->adminUser();
        $date = now()->addDay()->toDateString();

        $leaveRequest = LeaveRequest::query()->create([
            'user_id' => $user->id,
            'start_date' => $date,
            'end_date' => $date,
            'start_portion' => LeaveRequest::PORTION_AFTERNOON,
            'end_portion' => LeaveRequest::PORTION_AFTERNOON,
            'type' => LeaveRequest::TYPE_AL,
            'reason' => 'Clinic visit',
            'status' => LeaveRequest::STATUS_PENDING,
        ]);

        $startingAl = (float) $user->fresh()->al_credits;

        $this->actingAs($admin)
            ->post(route('leave.approve', $leaveRequest))
            ->assertRedirect();

        $user->refresh();
        $leaveRequest->refresh();

        $this->assertSame(LeaveRequest::STATUS_APPROVED, $leaveRequest->status);
        $this->assertSame($startingAl - 0.5, (float) $user->al_credits);
    }

    public function test_owner_and_admin_can_download_the_medical_certificate(): void
    {
        Storage::fake('local');

        $owner = $this->regularUser();
        $admin = $this->adminUser();
        $other = $this->regularUser();

        $path = 'leave-requests/1/cert.jpg';
        Storage::disk('local')->put($path, 'certificate');

        $leaveRequest = LeaveRequest::query()->create([
            'user_id' => $owner->id,
            'start_date' => now()->addDay()->toDateString(),
            'end_date' => now()->addDays(3)->toDateString(),
            'type' => LeaveRequest::TYPE_SL,
            'status' => LeaveRequest::STATUS_PENDING,
            'attachment_disk' => 'local',
            'attachment_path' => $path,
            'attachment_name' => 'cert.jpg',
        ]);

        $this->actingAs($owner)
            ->get(route('leave.certificate', $leaveRequest))
            ->assertOk();

        $this->actingAs($admin)
            ->get(route('leave.certificate', $leaveRequest))
            ->assertOk();

        $this->actingAs($other)
            ->get(route('leave.certificate', $leaveRequest))
            ->assertForbidden();
    }

    private function regularUser(): User
    {
        return User::factory()->create([
            'employment_status' => 'regular',
            'leave_balance_year' => (int) now()->year,
            'al_credits' => 5,
            'leave_credits' => 5,
            'sl_credits' => 15,
        ]);
    }

    private function adminUser(): User
    {
        $adminRoleId = Role::query()->where('slug', 'admin')->value('id');

        return User::factory()->create([
            'role_id' => $adminRoleId,
            'employment_status' => 'regular',
        ]);
    }
}
