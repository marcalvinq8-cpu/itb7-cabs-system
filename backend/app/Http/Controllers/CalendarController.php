<?php

namespace App\Http\Controllers;

use App\Models\Reservation;
use Illuminate\Http\Request;

class CalendarController extends Controller
{
    public function events(Request $request)
    {
        $user  = $request->user();
        $start = $request->query('start');
        $end   = $request->query('end');

        $statusColors = [
            'pending'   => '#F39C12',
            'approved'  => '#2980B9',
            'confirmed' => '#27AE60',
            'completed' => '#8E44AD',
            'rejected'  => '#C0392B',
            'cancelled' => '#717D7E',
        ];

        $query = Reservation::with(['facility', 'user', 'payment'])
            ->when($start, fn($q) => $q->where('reservation_date', '>=', $start))
            ->when($end,   fn($q) => $q->where('reservation_date', '<=', $end));

        if ($user->isClient()) {
            $query->where('user_id', $user->id);
        }

        $reservations = $query->orderBy('reservation_date')->orderBy('start_time')->get();

        $events = $reservations->map(function ($r) use ($user, $statusColors) {
            $startDt = $r->reservation_date->format('Y-m-d')
                . ($r->start_time ? 'T' . substr($r->start_time, 0, 5) : '');
            $endDt   = $r->reservation_date->format('Y-m-d')
                . ($r->end_time   ? 'T' . substr($r->end_time,   0, 5) : '');

            $title = $r->facility->name ?? 'Reservation';
            if (!$user->isClient()) {
                $title = ($r->user->full_name ?? '?') . ' — ' . $title;
            }

            return [
                'id'              => 'res-' . $r->id,
                'title'           => $title,
                'start'           => $startDt,
                'end'             => $endDt,
                'backgroundColor' => $statusColors[$r->status] ?? '#6b7280',
                'borderColor'     => 'transparent',
                'textColor'       => '#ffffff',
                'extendedProps'   => [
                    'reservationId'        => $r->id,
                    'status'               => $r->status,
                    'facilityName'         => $r->facility->name ?? null,
                    'purpose'              => $r->purpose,
                    'userName'             => $r->user->full_name ?? null,
                    'userEmail'            => $r->user->email ?? null,
                    'numberOfParticipants' => $r->number_of_participants,
                    'adminNote'            => $r->admin_note ?? null,
                    'paymentAmount'        => $r->payment?->amount,
                    'paymentStatus'        => $r->payment?->status,
                    'reservationDate'      => $r->reservation_date->format('Y-m-d'),
                    'startTime'            => $r->start_time ? substr($r->start_time, 0, 5) : null,
                    'endTime'              => $r->end_time   ? substr($r->end_time,   0, 5) : null,
                ],
            ];
        });

        return response()->json($events->values());
    }
}
