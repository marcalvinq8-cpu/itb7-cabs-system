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
        'requires_authorization_letter',
    ];

    /**
     * Isama ang dynamic field na 'image_url' tuwing ginagawang JSON ang Model
     */
    protected $appends = ['image_url'];

    protected function casts(): array
    {
        return [
            'maintenance_start' => 'date',
            'maintenance_end'   => 'date',
            'price_per_hour'    => 'decimal:2',
        ];
    }

    /**
     * Accessor para awtomatikong buuin ang buong HTTP URL ng image
     */
    public function getImageUrlAttribute()
    {
        if (!$this->image_path) {
            return null;
        }

        // Kung buong URL na ang naka-save (e.g. http://...)
        if (str_starts_with($this->image_path, 'http')) {
            return $this->image_path;
        }

        // Bubuo ng: http://localhost:8000/storage/facilities/filename.jpg
        return asset('storage/' . ltrim($this->image_path, '/'));
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