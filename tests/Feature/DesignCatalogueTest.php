<?php

namespace Tests\Feature;

use App\Models\DesignCatalogueItem;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DesignCatalogueTest extends TestCase
{
    use RefreshDatabase;

    public function test_catalogue_index_renders(): void
    {
        $user = $this->adminUser();

        $this->actingAs($user)
            ->get(route('design.catalogue'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Design/Catalogue')
                ->where('canManageItems', true)
                ->has('items.data', 0));
    }

    public function test_catalogue_item_can_be_stored_with_pdf(): void
    {
        Storage::fake('local');
        $user = $this->adminUser();
        $pdf = UploadedFile::fake()->create('plan.pdf', 120, 'application/pdf');

        $this->actingAs($user)
            ->post(route('design.catalogue.store'), [
                'model_name' => 'Oakwood 245',
                'rcode' => 'part_b',
                'area' => '245 sqm',
                'catalogue_date' => now()->toDateString(),
                'attachment' => $pdf,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('design_catalogue_items', [
            'model_name' => 'Oakwood 245',
            'rcode' => 'part_b',
            'user_id' => $user->id,
        ]);
        $this->assertSame(1, DesignCatalogueItem::query()->count());
        $this->assertTrue(DesignCatalogueItem::query()->first()->hasAttachment());
    }

    public function test_catalogue_store_requires_pdf(): void
    {
        $user = $this->adminUser();

        $this->actingAs($user)
            ->post(route('design.catalogue.store'), [
                'model_name' => 'Oakwood 245',
                'rcode' => 'part_c',
                'catalogue_date' => now()->toDateString(),
            ])
            ->assertSessionHasErrors('attachment');

        $this->assertSame(0, DesignCatalogueItem::query()->count());
    }

    private function adminUser(): User
    {
        $adminRoleId = Role::query()->where('slug', 'admin')->value('id');

        return User::factory()->create([
            'role_id' => $adminRoleId,
        ]);
    }
}
