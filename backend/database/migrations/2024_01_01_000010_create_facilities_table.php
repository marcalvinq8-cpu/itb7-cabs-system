<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('facilities', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description');
            $table->string('location');
            $table->integer('capacity');
            $table->string('image_path')->nullable();
            $table->decimal('price_per_hour', 10, 2)->default(0);
            $table->enum('status', ['available', 'under_maintenance', 'unavailable', 'closed'])->default('available');
            $table->text('maintenance_note')->nullable();
            $table->date('maintenance_start')->nullable();
            $table->date('maintenance_end')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('facilities');
    }
};
