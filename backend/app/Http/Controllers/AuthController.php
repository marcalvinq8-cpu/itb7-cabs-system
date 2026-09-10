<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'full_name'      => ['required', 'string', 'max:255'],
            'email'          => ['required', 'email', 'unique:users,email'],
            'password'       => ['required', 'confirmed', Password::min(8)],
            'age'            => ['nullable', 'integer', 'min:1', 'max:150'],
            'gender'         => ['nullable', 'in:male,female,other'],
            'address'        => ['nullable', 'string'],
            'contact_number' => ['nullable', 'string', 'max:20'],
        ]);

        $user = User::create([
            'full_name'      => $validated['full_name'],
            'email'          => $validated['email'],
            'password'       => Hash::make($validated['password']),
            'age'            => $validated['age'] ?? null,
            'gender'         => $validated['gender'] ?? null,
            'address'        => $validated['address'] ?? null,
            'contact_number' => $validated['contact_number'] ?? null,
            'role'           => 'client',
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Registration successful.',
            'user'    => $user,
            'token'   => $token,
        ], 201);
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required'],
        ]);

        // Direct database lookup
        $user = User::where('email', $credentials['email'])->first();

        // Direct Hash checking
        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        // Lumikha ng Sanctum Token
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful.',
            'user'    => $user,
            'token'   => $token,
        ]);
    }

    public function updateProfile(Request $request)
    {
        $validated = $request->validate([
            'full_name'      => ['required', 'string', 'max:255'],
            'age'            => ['nullable', 'integer', 'min:1', 'max:150'],
            'gender'         => ['nullable', 'in:male,female,other'],
            'address'        => ['nullable', 'string'],
            'contact_number' => ['nullable', 'string', 'max:20'],
        ]);

        $user = $request->user();
        $user->update($validated);

        return response()->json($user);
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => ['required'],
            'password'         => ['required', 'min:8', 'confirmed'],
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Current password is incorrect.'], 422);
        }

        $user->update(['password' => Hash::make($request->password)]);

        return response()->json(['message' => 'Password changed successfully.']);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function user(Request $request)
    {
        return response()->json($request->user());
    }
}
