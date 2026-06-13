<?php

namespace Database\Seeders;

use App\Models\Facility;
use Illuminate\Database\Seeder;

class FacilitySeeder extends Seeder
{
    public function run(): void
    {
        $facilities = [
            [
                'name'          => 'Basketball Court A',
                'description'   => 'Full-size outdoor basketball court with concrete flooring, hoops, and lighting for evening games.',
                'location'      => 'Main Campus, Building A - Ground Floor',
                'capacity'      => 20,
                'price_per_hour'=> 500.00,
                'status'        => 'available',
            ],
            [
                'name'          => 'Swimming Pool',
                'description'   => 'Olympic-size swimming pool with lane dividers, starting blocks, and shower facilities.',
                'location'      => 'Main Campus, Sports Complex',
                'capacity'      => 30,
                'price_per_hour'=> 1000.00,
                'status'        => 'available',
            ],
            [
                'name'          => 'Gymnasium',
                'description'   => 'Multi-purpose indoor gymnasium suitable for basketball, volleyball, badminton, and other sports.',
                'location'      => 'Main Campus, Gymnasium Building',
                'capacity'      => 50,
                'price_per_hour'=> 800.00,
                'status'        => 'available',
            ],
            [
                'name'          => 'Tennis Court',
                'description'   => 'Professional tennis court with clay surface, net, and seating area for spectators.',
                'location'      => 'Main Campus, East Wing',
                'capacity'      => 10,
                'price_per_hour'=> 600.00,
                'status'        => 'under_maintenance',
                'maintenance_note' => 'Resurfacing and net replacement in progress.',
                'maintenance_start' => now()->format('Y-m-d'),
                'maintenance_end'   => now()->addDays(7)->format('Y-m-d'),
            ],
        ];

        foreach ($facilities as $facility) {
            Facility::create($facility);
        }
    }
}
