<?php

namespace Database\Seeders;

use App\Models\Facility;
use Illuminate\Database\Seeder;

class NewFacilitiesSeeder extends Seeder
{
    public function run(): void
    {
        $facilities = [
            [
                'name'           => 'Badminton Court',
                'description'    => 'Indoor badminton court with wooden flooring, proper net setup, and good overhead lighting for competitive play.',
                'location'       => 'Main Campus, Sports Complex - Indoor Hall',
                'capacity'       => 10,
                'price_per_hour' => 300.00,
                'status'         => 'available',
            ],
            [
                'name'           => 'Soccer Field',
                'description'    => 'Full-size natural grass soccer field with goal posts, corner flags, and surrounding spectator area.',
                'location'       => 'Main Campus, Outdoor Fields - West Side',
                'capacity'       => 30,
                'price_per_hour' => 700.00,
                'status'         => 'available',
            ],
            [
                'name'           => 'Baseball Field',
                'description'    => 'Regulation baseball diamond with clay infield, grass outfield, pitcher mound, and dugout benches.',
                'location'       => 'Main Campus, Outdoor Fields - North Side',
                'capacity'       => 25,
                'price_per_hour' => 600.00,
                'status'         => 'available',
            ],
            [
                'name'           => 'Table Tennis Hall',
                'description'    => 'Dedicated table tennis facility with four regulation tables, paddle and ball rentals available, and air-conditioned room.',
                'location'       => 'Main Campus, Building B - 2nd Floor',
                'capacity'       => 16,
                'price_per_hour' => 200.00,
                'status'         => 'available',
            ],
            [
                'name'           => 'Boxing Gym',
                'description'    => 'Fully equipped boxing gym with a regulation ring, heavy bags, speed bags, jump ropes, and protective gear available for rent.',
                'location'       => 'Main Campus, Sports Complex - Ground Floor',
                'capacity'       => 20,
                'price_per_hour' => 500.00,
                'status'         => 'available',
            ],
            [
                'name'           => 'Running Field',
                'description'    => 'Outdoor 400-meter running track with eight lanes, rubberized surface, and adjacent warm-up area.',
                'location'       => 'Main Campus, Athletics Area',
                'capacity'       => 40,
                'price_per_hour' => 250.00,
                'status'         => 'available',
            ],
        ];

        foreach ($facilities as $data) {
            Facility::firstOrCreate(['name' => $data['name']], $data);
        }

        $this->command->info('6 new facilities seeded successfully.');
    }
}
