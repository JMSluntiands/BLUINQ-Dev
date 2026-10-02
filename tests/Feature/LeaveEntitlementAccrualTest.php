<?php

namespace Tests\Feature;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class LeaveEntitlementAccrualTest extends TestCase
{
    use RefreshDatabase;

    public function test_first_of_month_grants_one_leave_credit_and_logs_each_regular_employee(): void
    {
        $asOf = Carbon::parse('2026-10-01');

        $ana = $this->employee('Ana Cruz', 'regular', 4, '2026-09');
        $ben = $this->employee('Ben Santos', 'regular', 7, '2026-09');
        $probationary = $this->employee('Cara Lim', 'probationary', 0, null);

        $this->artisan('leave:process-entitlements', [
            '--date' => $asOf->toDateString(),
        ])->assertSuccessful();

        $ana->refresh();
        $ben->refresh();
        $probationary->refresh();

        $this->assertSame(5.0, (float) $ana->al_credits);
        $this->assertSame(5.0, (float) $ana->leave_credits);
        $this->assertSame('2026-10', $ana->al_last_accrual_month);

        $this->assertSame(8.0, (float) $ben->al_credits);
        $this->assertSame('2026-10', $ben->al_last_accrual_month);

        $this->assertSame(0.0, (float) $probationary->al_credits);
        $this->assertNull($probationary->al_last_accrual_month);

        $logs = DB::table('activity_logs')
            ->where('route_name', 'monthly_accrual')
            ->orderBy('user_id')
            ->get();

        $this->assertCount(2, $logs);
        $this->assertSame([$ana->id, $ben->id], $logs->pluck('user_id')->all());
        $this->assertSame('LEAVE', $logs[0]->method);
        $this->assertStringContainsString('added 1 leave credit(s) to Ana Cruz for October 2026', $logs[0]->path);
        $this->assertStringContainsString('AL: 5', $logs[0]->path);
        $this->assertStringContainsString('added 1 leave credit(s) to Ben Santos for October 2026', $logs[1]->path);

        $this->artisan('leave:process-entitlements', [
            '--date' => $asOf->toDateString(),
        ])->assertSuccessful();

        $ana->refresh();
        $this->assertSame(5.0, (float) $ana->al_credits);
        $this->assertSame(2, DB::table('activity_logs')->where('route_name', 'monthly_accrual')->count());
    }

    private function employee(string $name, string $status, float $alCredits, ?string $lastAccrual): User
    {
        return User::factory()->create([
            'name' => $name,
            'employment_status' => $status,
            'date_hired' => '2024-01-15',
            'leave_balance_year' => 2026,
            'al_credits' => $alCredits,
            'leave_credits' => $alCredits,
            'sl_credits' => 15,
            'al_last_accrual_month' => $lastAccrual,
        ]);
    }
}
