<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            AdminSeeder::class,
            ClientSeeder::class,
            MassClientSeeder::class,
            FacilitySeeder::class,
            AmenitySeeder::class,
            HistoricalDataSeeder::class,
        ]);
    }
}
