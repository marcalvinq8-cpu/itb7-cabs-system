<?php

use App\Http\Controllers\DebugSeedController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/debug-seed-facilities', [DebugSeedController::class, 'seedFacilities']);
