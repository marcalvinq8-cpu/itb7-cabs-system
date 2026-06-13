<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Facility extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'location',
        'capacity',
        'image_path',
        'price_per_hour',
        'status',
        'maintenance_note',
        'maintenance_start',
        'maintenance_end',
    ];

    protected function casts(): array
    {
        return [
            'maintenance_start' => 'date',
            'maintenance_end' => 'date',
            'price_per_hour' => 'decimal:2',
        ];
    }

    public function amenities()
    {
        return $this->hasMany(Amenity::class);
    }

    public function reservations()
    {
        return $this->hasMany(Reservation::class);
    }

    public function maintenanceLogs()
    {
        return $this->hasMany(MaintenanceLog::class);
    }

    public function scopeAvailable($query)
    {
        return $query->where('status', 'available');
    }
}
