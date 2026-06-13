<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE payments MODIFY COLUMN status ENUM('pending','paid','failed','expired','cancelled','rejected') NOT NULL DEFAULT 'pending'");

        // Backfill existing records that are still 'pending' but belong to rejected/cancelled reservations
        DB::statement("
            UPDATE payments p
            JOIN reservations r ON p.reservation_id = r.id
            SET p.status = 'rejected'
            WHERE p.status = 'pending' AND r.status = 'rejected'
        ");

        DB::statement("
            UPDATE payments p
            JOIN reservations r ON p.reservation_id = r.id
            SET p.status = 'cancelled'
            WHERE p.status = 'pending' AND r.status = 'cancelled'
        ");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE payments MODIFY COLUMN status ENUM('pending','paid','failed','expired') NOT NULL DEFAULT 'pending'");
    }
};
