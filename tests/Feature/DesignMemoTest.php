<?php

namespace Tests\Feature;

use App\Models\DesignMemo;
use App\Models\DraftingMemo;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DesignMemoTest extends TestCase
{
    use RefreshDatabase;

    public function test_design_memos_index_uses_design_board(): void
    {
        $user = $this->adminUser();

        $this->actingAs($user)
            ->get(route('design-memos.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Design/Memos')
                ->where('canManageMemos', true)
                ->has('memos.data', 0));
    }

    public function test_design_memo_store_does_not_create_drafting_memo(): void
    {
        $user = $this->adminUser();

        $this->actingAs($user)
            ->post(route('design-memos.store'), [
                'client_name' => 'Acme Builders',
                'description' => '<p>Design note</p>',
                'memo_date' => now()->toDateString(),
            ])
            ->assertRedirect(route('design-memos.index'));

        $this->assertDatabaseHas('design_memos', [
            'client_name' => 'Acme Builders',
            'user_id' => $user->id,
        ]);
        $this->assertSame(0, DraftingMemo::query()->count());
        $this->assertSame(1, DesignMemo::query()->count());
    }

    private function adminUser(): User
    {
        $adminRoleId = Role::query()->where('slug', 'admin')->value('id');

        return User::factory()->create([
            'role_id' => $adminRoleId,
        ]);
    }
}
