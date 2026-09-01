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

        // Narrow "till roll" page instead of A4 — 80mm is the standard thermal
        // receipt width. Height is estimated from content (base layout + one line
        // per amenity) rather than a fixed A4 height, so there's no leftover blank
        // page below a short receipt and no overflow onto a second page for a long
        // one.
        $widthPt  = 227; // 80mm
        $heightPt = 560 + (count($amenities) * 16);

        $pdf = Pdf::loadView('pdf.receipt', [
            'reservation' => $reservation,
            'payment'     => $payment,
            'amenities'   => $amenities,
        ])->setPaper([0, 0, $widthPt, $heightPt]);

        $filename = "CABS-Receipt-{$payment->receipt_number}.pdf";

        return $pdf->download($filename);
    }
}
