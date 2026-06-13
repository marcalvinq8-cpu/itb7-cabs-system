<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class NotificationService
{
    public static function notifyUser(
        User $user,
        string $type,
        string $title,
        string $message,
        ?int $reservationId = null
    ): void {
        DB::table('notifications')->insert([
            'id'              => Str::uuid(),
            'type'            => $type,
            'notifiable_type' => User::class,
            'notifiable_id'   => $user->id,
            'data'            => json_encode([
                'title'          => $title,
                'message'        => $message,
                'reservation_id' => $reservationId,
            ]),
            'read_at'    => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public static function notifyAdmins(
        string $type,
        string $title,
        string $message,
        ?int $reservationId = null
    ): void {
        $staff = User::whereIn('role', ['administrator', 'staff'])->get();

        foreach ($staff as $member) {
            self::notifyUser($member, $type, $title, $message, $reservationId);
        }
    }
}
