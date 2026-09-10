<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        $notifications = DB::table('notifications')
            ->where('notifiable_type', 'App\Models\User')
            ->where('notifiable_id', $userId)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get()
            ->map(function ($n) {
                // Sinisiguro nating safe ang pag-decode kung sakaling hindi valid JSON
                $data = is_string($n->data) ? json_decode($n->data, true) : ($n->data ?? []);

                return [
                    'id'             => $n->id,
                    'type'           => $n->type,
                    'title'          => $data['title'] ?? '',
                    'message'        => $data['message'] ?? '',
                    'reservation_id' => $data['reservation_id'] ?? null,
                    'read_at'        => $n->read_at,
                    'created_at'     => $n->created_at,
                ];
            });

        $unreadCount = DB::table('notifications')
            ->where('notifiable_type', 'App\Models\User')
            ->where('notifiable_id', $userId)
            ->whereNull('read_at')
            ->count();

        return response()->json([
            'notifications' => $notifications,
            'unread_count'  => $unreadCount,
        ]);
    }

    public function markRead(Request $request, $id)
    {
        // Dinagdagan ng notifiable_type para sa mas mahigpit na seguridad at data integrity
        $updated = DB::table('notifications')
            ->where('id', $id)
            ->where('notifiable_type', 'App\Models\User')
            ->where('notifiable_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        if (!$updated) {
            return response()->json(['message' => 'Notification not found or already read.'], 404);
        }

        return response()->json(['message' => 'Notification marked as read.']);
    }

    public function markAllRead(Request $request)
    {
        DB::table('notifications')
            ->where('notifiable_type', 'App\Models\User')
            ->where('notifiable_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['message' => 'All notifications marked as read.']);
    }
}