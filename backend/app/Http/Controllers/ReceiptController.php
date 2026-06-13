<?php

namespace App\Http\Controllers;

use App\Models\Reservation;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class ReceiptController extends Controller
{
    public function download(Request $request, $reservationId)
    {
        $user        = $request->user();
        $reservation = Reservation::with(['user', 'facility', 'payment'])->findOrFail($reservationId);

        if ($user->isClient() && $reservation->user_id !== $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $payment = $reservation->payment;

        if (!$payment || $payment->status !== 'paid') {
            return response()->json(['message' => 'Receipt is only available for paid reservations.'], 422);
        }

        // Build selected amenities list
        $amenities = [];
        if ($reservation->selected_amenities) {
            $amenities = \App\Models\Amenity::whereIn('id', $reservation->selected_amenities)
                ->get(['id', 'name', 'quantity'])
                ->toArray();
        }

        $pdf = Pdf::loadView('pdf.receipt', [
            'reservation' => $reservation,
            'payment'     => $payment,
            'amenities'   => $amenities,
        ])->setPaper('a4');

        $filename = "CABS-Receipt-{$payment->receipt_number}.pdf";

        return $pdf->download($filename);
    }
}
