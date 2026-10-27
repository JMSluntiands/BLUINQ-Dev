<?php

namespace Tests\Feature;

use App\Models\AttendanceClock;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class AttendanceMidnightShiftTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_shift_started_before_midnight_stays_clocked_in_after_midnight(): void
    {
        $user = User::factory()->create();

        Carbon::setTestNow(Carbon::parse('2026-10-23 22:00', 'Asia/Manila'));
        $this->actingAs($user)->post(route('dashboard.clock-in'));

        Carbon::setTestNow(Carbon::parse('2026-10-24 00:30', 'Asia/Manila'));

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('clock.clocked_in', true)
                ->where('clock.clocked_out', false));

        $this->actingAs($user)
            ->post(route('dashboard.clock-out'))
            ->assertSessionHas('status', 'clocked-out');

        $this->assertSame(1, AttendanceClock::query()->count());
        $record = AttendanceClock::query()->firstOrFail();
        $this->assertSame('2026-10-23', $record->work_date->toDateString());
        $this->assertNotNull($record->clock_out_at);
    }

    public function test_user_can_clock_in_again_after_clocking_out_the_same_day(): void
    {
        $user = User::factory()->create();

        Carbon::setTestNow(Carbon::parse('2026-10-27 07:56', 'Asia/Manila'));
        $this->actingAs($user)->post(route('dashboard.clock-in'));

        Carbon::setTestNow(Carbon::parse('2026-10-27 15:11', 'Asia/Manila'));
        $this->actingAs($user)->post(route('dashboard.clock-out'));

        $firstShift = AttendanceClock::query()->sole();

        Carbon::setTestNow(Carbon::parse('2026-10-27 15:20', 'Asia/Manila'));
        $this->actingAs($user)
            ->post(route('dashboard.clock-in'))
            ->assertSessionHas('status', 'clocked-in');

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertInertia(fn ($page) => $page
                ->where('clock.clocked_in', true)
                ->where('clock.clocked_out', false));

        Carbon::setTestNow(Carbon::parse('2026-10-27 17:05', 'Asia/Manila'));
        $this->actingAs($user)->post(route('dashboard.clock-out'));

        $record = AttendanceClock::query()->sole();
        $this->assertTrue($record->clock_in_at->equalTo($firstShift->clock_in_at));
        $this->assertTrue($record->clock_out_at->greaterThan($firstShift->clock_out_at));
    }

    public function test_forgotten_clock_out_from_yesterday_does_not_block_todays_clock_in(): void
    {
        $user = User::factory()->create();

        Carbon::setTestNow(Carbon::parse('2026-10-23 08:00', 'Asia/Manila'));
        $this->actingAs($user)->post(route('dashboard.clock-in'));

        Carbon::setTestNow(Carbon::parse('2026-10-24 08:05', 'Asia/Manila'));

        $this->actingAs($user)
            ->post(route('dashboard.clock-in'))
            ->assertSessionHas('status', 'clocked-in');

        $today = AttendanceClock::query()
            ->whereDate('work_date', '2026-10-24')
            ->firstOrFail();
        $this->assertNotNull($today->clock_in_at);
    }
}
