<?php

namespace Database\Seeders;

use App\Models\User;
use Faker\Factory as Faker;
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
        $faker = Faker::create();

        $barangays = [
            'Sala', 'Mamatid', 'Baclaran', 'Pittland', 'Diezmo', 'Banay-Banay',
            'Butong', 'Marinig', 'Niugan', 'Bigaa', 'Casile', 'Gulod', 'Pulo',
            'San Isidro', 'Barangay Uno',
        ];

        $count = 20;

        // Hashing is deliberately slow (bcrypt) — every seeded account shares the same
        // demo password, so hash it once instead of re-hashing per row.
        $password = Hash::make('Client@1234');

        for ($i = 1; $i <= $count; $i++) {
            $name  = $faker->unique()->name();
            $email = 'client' . $i . '@example.com';

            User::firstOrCreate(['email' => $email], [
                'full_name'      => $name,
                'password'       => $password,
                'age'            => $faker->numberBetween(18, 55),
                'gender'         => $faker->randomElement(['male', 'female']),
                'address'        => 'Brgy. ' . $faker->randomElement($barangays) . ', Cabuyao, Laguna',
                'contact_number' => '09' . $faker->numerify('#########'),
                'role'           => 'client',
                'is_verified'    => true,
            ]);
        }
    }
}
