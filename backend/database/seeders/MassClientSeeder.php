<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class MassClientSeeder extends Seeder
{
    /**
     * Generates a large batch of randomized client accounts (on top of the
     * hand-picked ones in ClientSeeder) so admin/staff views and analytics
     * have realistic volume to work with. All share the standard demo
     * password so any of them can be used to log in if needed.
     */
    public function run(): void
    {
        $barangays = [
            'Sala', 'Mamatid', 'Baclaran', 'Pittland', 'Diezmo', 'Banay-Banay',
            'Butong', 'Marinig', 'Niugan', 'Bigaa', 'Casile', 'Gulod', 'Pulo',
            'San Isidro', 'Barangay Uno',
        ];

        $count = 100;

        for ($i = 1; $i <= $count; $i++) {
            $name  = fake()->unique()->name();
            $email = 'client' . $i . '@example.com';

            User::firstOrCreate(['email' => $email], [
                'full_name'      => $name,
                'password'       => Hash::make('Client@1234'),
                'age'            => fake()->numberBetween(18, 55),
                'gender'         => fake()->randomElement(['male', 'female']),
                'address'        => 'Brgy. ' . fake()->randomElement($barangays) . ', Cabuyao, Laguna',
                'contact_number' => '09' . fake()->numerify('#########'),
                'role'           => 'client',
                'is_verified'    => true,
            ]);
        }
    }
}
