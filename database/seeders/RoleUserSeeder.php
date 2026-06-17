<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class RoleUserSeeder extends Seeder
{
    /**
     * Seed users for each role (password: admin123 for all).
     */
    public function run(): void
    {
        $password = 'admin123';

        $adminRoleId = Role::query()->where('slug', 'admin')->value('id');
        $memberRoleId = Role::query()->where('slug', 'user')->value('id');
        $managerRoleId = Role::query()->where('slug', 'project-manager')->value('id');

        if ($adminRoleId === null || $memberRoleId === null) {
            return;
        }

        User::query()->updateOrCreate(
            ['email' => 'admin@bluinq.local'],
            [
                'name' => 'Admin',
                'password' => $password,
                'role_id' => $adminRoleId,
                'email_verified_at' => now(),
            ],
        );

        if ($managerRoleId !== null) {
            $memberPermissions = Permission::slugsForRole('user');
            Permission::syncSlugsForRole('project-manager', $memberPermissions);

            User::query()->updateOrCreate(
                ['email' => 'manager@bluinq.local'],
                [
                    'name' => 'Manager',
                    'password' => $password,
                    'role_id' => $managerRoleId,
                    'email_verified_at' => now(),
                ],
            );
        }

        User::query()->updateOrCreate(
            ['email' => 'member@bluinq.local'],
            [
                'name' => 'Member',
                'password' => $password,
                'role_id' => $memberRoleId,
                'email_verified_at' => now(),
            ],
        );
    }
}
