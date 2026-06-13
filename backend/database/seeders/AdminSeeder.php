<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'full_name'      => 'CABS Administrator',
            'email'          => 'admin@cabs.edu.ph',
            'password'       => Hash::make('Admin@1234'),
            'age'            => 35,
            'gender'         => 'male',
            'address'        => 'Cabuyao, Laguna',
            'contact_number' => '09171234567',
            'role'           => 'administrator',
            'is_verified'    => true,
        ]);

        User::create([
            'full_name'      => 'CABS Staff',
            'email'          => 'staff@cabs.edu.ph',
            'password'       => Hash::make('Staff@1234'),
            'age'            => 28,
            'gender'         => 'female',
            'address'        => 'Cabuyao, Laguna',
            'contact_number' => '09179876543',
            'role'           => 'staff',
            'is_verified'    => true,
        ]);
    }
}
