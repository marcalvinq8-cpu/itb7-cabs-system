<?php

namespace Database\Seeders;

use App\Models\Amenity;
use App\Models\Facility;
use Illuminate\Database\Seeder;

class AmenitySeeder extends Seeder
{
    public function run(): void
    {
        $amenityMap = [
            'Basketball Court A' => [
                ['name' => 'Basketball',    'description' => 'Standard size basketball', 'quantity' => 5],
                ['name' => 'Ball Pump',     'description' => 'Manual ball pump',          'quantity' => 2],
                ['name' => 'Scoreboard',    'description' => 'Electronic scoreboard',     'quantity' => 1],
                ['name' => 'Chairs',        'description' => 'Plastic chairs for players','quantity' => 20],
            ],
            'Swimming Pool' => [
                ['name' => 'Lane Rope',     'description' => 'Standard lane divider rope', 'quantity' => 8],
                ['name' => 'Kickboard',     'description' => 'Swimming training kickboard','quantity' => 10],
                ['name' => 'Life Buoy',     'description' => 'Emergency life buoy',        'quantity' => 4],
                ['name' => 'Shower Room',   'description' => 'Access to shower facilities','quantity' => 4, 'is_available' => true],
            ],
            'Gymnasium' => [
                ['name' => 'Volleyball',    'description' => 'Standard volleyball',       'quantity' => 4],
                ['name' => 'Volleyball Net','description' => 'Official volleyball net',   'quantity' => 2],
                ['name' => 'Badminton Set', 'description' => 'Net, rackets, shuttlecocks','quantity' => 3],
                ['name' => 'Folding Tables','description' => 'Folding tables for events', 'quantity' => 10],
                ['name' => 'Folding Chairs','description' => 'Folding chairs for events', 'quantity' => 50],
                ['name' => 'Sound System',  'description' => 'PA system with microphone', 'quantity' => 1],
            ],
            'Tennis Court' => [
                ['name' => 'Tennis Racket', 'description' => 'Standard tennis racket',   'quantity' => 4, 'is_available' => false],
                ['name' => 'Tennis Ball',   'description' => 'Pack of 3 tennis balls',   'quantity' => 10,'is_available' => false],
                ['name' => 'Net',           'description' => 'Official tennis net',       'quantity' => 1, 'is_available' => false],
            ],
        ];

        foreach ($amenityMap as $facilityName => $amenities) {
            $facility = Facility::where('name', $facilityName)->first();
            if (!$facility) continue;

            foreach ($amenities as $amenity) {
                Amenity::create(array_merge(['facility_id' => $facility->id], $amenity));
            }
        }
    }
}
