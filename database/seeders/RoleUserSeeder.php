<?php

namespace Database\Seeders;

use App\Enums\UserRole;
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

        User::query()->updateOrCreate(
            ['email' => 'admin@bluinq.local'],
            [
                'name' => 'Admin',
                'password' => $password,
                'role' => UserRole::Admin->value,
                'email_verified_at' => now(),
            ],
        );

        User::query()->updateOrCreate(
            ['email' => 'user@bluinq.local'],
            [
                'name' => 'User',
                'password' => $password,
                'role' => UserRole::User->value,
                'email_verified_at' => now(),
            ],
        );
    }
}
