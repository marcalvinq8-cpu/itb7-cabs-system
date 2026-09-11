<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;

class DebugSeedController extends Controller
{
    public function seedFacilities(Request $request)
    {
        $expectedToken = (string) env('DEBUG_SEED_TOKEN');
        $providedToken = (string) $request->query('token');

        abort_unless(
            $expectedToken !== '' && hash_equals($expectedToken, $providedToken),
            404
        );

        Artisan::call('migrate:fresh', [
            '--seed' => true,
            '--force' => true,
        ]);

        return response()->json([
            'message' => 'Database successfully reset and seeded.',
            'output' => Artisan::output(),
        ]);
    }
}