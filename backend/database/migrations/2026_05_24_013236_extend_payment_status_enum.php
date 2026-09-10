<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Safe Column Modification for Postgres & MySQL
        Schema::table('payments', function (Blueprint $table) {
            $table->string('status')->default('pending')->change();
        });

        // 2. Cross-Database Compatible Backfill (Postgres & MySQL compliant)
        DB::table('payments')
            ->where('status', 'pending')
            ->whereIn('reservation_id', function ($query) {
                $query->select('id')
                    ->from('reservations')
                    ->where('status', 'rejected');
            })
            ->update(['status' => 'rejected']);

        DB::table('payments')
            ->where('status', 'pending')
            ->whereIn('reservation_id', function ($query) {
                $query->select('id')
                    ->from('reservations')
                    ->where('status', 'cancelled');
            })
            ->update(['status' => 'cancelled']);
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->string('status')->default('pending')->change();
        });
    }
};