<?php

namespace Tests\Feature;

use App\Models\Announcement;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class StoredUploadTest extends TestCase
{
    use RefreshDatabase;

    public function test_announcement_cover_is_saved_to_storage_not_public(): void
    {
        Storage::fake('public');

        $admin = $this->adminUser();
        $file = UploadedFile::fake()->image('cover.jpg', 200, 200);

        $this->actingAs($admin)->post(route('announcements.store'), [
            'title' => 'Storage only',
            'description' => '<p>Hello</p>',
            'image' => $file,
        ])->assertRedirect(route('announcements.index'));

        $announcement = Announcement::query()->first();
        $this->assertNotNull($announcement?->image);
        $this->assertTrue(Storage::disk('public')->exists($announcement->image));
        $this->assertFileDoesNotExist(public_path('storage/'.$announcement->image));
        $this->assertStringContainsString('/announcements/', (string) $announcement->image_url);
        $this->assertStringNotContainsString('/storage/', (string) $announcement->image_url);
    }

    public function test_profile_photo_is_saved_to_storage_not_public(): void
    {
        Storage::fake('public');

        $admin = $this->adminUser();
        $member = User::factory()->create();
        $file = UploadedFile::fake()->image('photo.png', 120, 120);

        $this->actingAs($admin)->patch(route('settings.users.update', $member), [
            'name' => $member->name,
            'email' => $member->email,
            'role_id' => $member->role_id,
            'employment_status' => 'regular',
            'profile_image' => $file,
        ])->assertRedirect();

        $member->refresh();
        $this->assertNotNull($member->profile_image);
        $this->assertTrue(Storage::disk('public')->exists($member->profile_image));
        $this->assertFileDoesNotExist(public_path('storage/'.$member->profile_image));
        $this->assertStringContainsString('/profile-images/', (string) $member->profile_image_url);
        $this->assertStringNotContainsString('/storage/', (string) $member->profile_image_url);
    }

    private function adminUser(): User
    {
        $adminRoleId = Role::query()->where('slug', 'admin')->value('id');

        return User::factory()->create([
            'role_id' => $adminRoleId,
        ]);
    }
}
