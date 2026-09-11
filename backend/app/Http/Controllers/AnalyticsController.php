<?php

namespace App\Http\Controllers;

use App\Models\Facility;
use App\Models\Payment;
use App\Models\Reservation;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    public function summary()
    {
        $now   = now();
        $today = $now->toDateString();

        $totalReservationsThisMonth = Reservation::whereMonth('created_at', $now->month)
            ->whereYear('created_at', $now->year)
            ->count();

        $totalRevenueThisMonth = Payment::where('status', 'paid')
            ->whereMonth('paid_at', $now->month)
            ->whereYear('paid_at', $now->year)
            ->sum('amount');

        $mostReservedFacility = Reservation::select('facility_id', DB::raw('COUNT(*) as total'))
            ->groupBy('facility_id')
            ->orderByDesc('total')
            ->with('facility:id,name')
            ->first();

        $pendingReservations = Reservation::where('status', 'pending')->count();

        $confirmedToday = Reservation::where('status', 'confirmed')
            ->where('reservation_date', $today)
            ->count();

        $totalUsers     = User::where('role', 'client')->count();
        $totalFacilities = Facility::count();

        return response()->json([
            'total_reservations_this_month' => $totalReservationsThisMonth,
            'total_revenue_this_month'      => (float) $totalRevenueThisMonth,
            'most_reserved_facility'        => $mostReservedFacility ? [
                'id'    => $mostReservedFacility->facility_id,
                'name'  => $mostReservedFacility->facility->name ?? 'N/A',
                'count' => $mostReservedFacility->total,
            ] : null,
            'pending_reservations'          => $pendingReservations,
            'confirmed_today'               => $confirmedToday,
            'total_clients'                 => $totalUsers,
            'total_facilities'              => $totalFacilities,
        ]);
    }

    public function monthlyRevenue()
    {
        $rows = Payment::where('status', 'paid')
            ->where('paid_at', '>=', now()->subMonths(11)->startOfMonth())
            ->select(
                DB::raw("DATE_FORMAT(paid_at, '%Y-%m') as month_key"),
                DB::raw("DATE_FORMAT(paid_at, '%b %Y') as month_label"),
                DB::raw('SUM(amount) as revenue')
            )
            ->groupBy('month_key', 'month_label')
            ->orderBy('month_key')
            ->get();

        return response()->json($rows);
    }

    public function facilityUtilization()
    {
        $rows = Reservation::where('reservation_date', '>=', now()->subDays(30)->toDateString())
            ->whereIn('status', ['approved', 'confirmed', 'completed'])
            ->select('facility_id', DB::raw('COUNT(*) as count'))
            ->groupBy('facility_id')
            ->with('facility:id,name')
            ->orderByDesc('count')
            ->get()
            ->map(fn($r) => [
                'facility_id' => $r->facility_id,
                'facility'    => $r->facility->name ?? 'Unknown',
                'count'       => $r->count,
            ]);

        return response()->json($rows);
    }

    public function bookingTrends()
    {
        $dayMap = [0 => 'Sun', 1 => 'Mon', 2 => 'Tue', 3 => 'Wed', 4 => 'Thu', 5 => 'Fri', 6 => 'Sat'];

        $rows = Reservation::select(
            DB::raw('(DAYOFWEEK(reservation_date) - 1) as day_num'),
                DB::raw('COUNT(*) as count')
            )
            ->where('reservation_date', '>=', now()->subDays(90)->toDateString())
            ->groupBy('day_num')
            ->orderBy('day_num')
            ->get()
            ->map(fn($r) => [
                'day'   => $dayMap[(int) $r->day_num] ?? 'Unknown',
                'count' => $r->count,
            ]);

        return response()->json($rows);
    }

    public function reports(Request $request)
    {
        $query = Reservation::with(['user', 'facility', 'payment'])
            ->when($request->filled('date_from'),      fn($q) => $q->where('reservation_date', '>=', $request->date_from))
            ->when($request->filled('date_to'),        fn($q) => $q->where('reservation_date', '<=', $request->date_to))
            ->when($request->filled('facility_id'),    fn($q) => $q->where('facility_id', $request->facility_id))
            ->when($request->filled('status'),         fn($q) => $q->where('status', $request->status))
            ->when($request->filled('payment_status'), fn($q) => $q->whereHas('payment', fn($p) => $p->where('status', $request->payment_status)))
            ->orderByDesc('reservation_date');

        if ($request->query('format') === 'pdf') {
            $maxRows = 1000;

            $totalMatching = (clone $query)->count();
            $reservations  = $query->limit($maxRows)->get();
            $truncated     = $totalMatching > $reservations->count();

            ini_set('memory_limit', '768M');
            set_time_limit(120);

            $totalRevenue = $reservations->reduce(
                fn($carry, $r) => $carry + ($r->payment && $r->payment->status === 'paid' ? $r->payment->amount : 0),
                0
            );

            $statusCounts = $reservations->countBy('status');

            $facilityName = $request->filled('facility_id')
                ? Facility::find($request->facility_id)?->name
                : null;

            $logoPath = resource_path('images/logoCabs.png');
            $logoBase64 = is_file($logoPath)
                ? 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath))
                : null;

            $pdf = Pdf::loadView('pdf.report', [
                'reservations'  => $reservations,
                'totalMatching' => $totalMatching,
                'truncated'     => $truncated,
                'generatedAt'   => now(),
                'totalRevenue'  => $totalRevenue,
                'statusCounts'  => $statusCounts,
                'logoBase64'    => $logoBase64,
                'filters'       => [
                    'date_from'      => $request->query('date_from'),
                    'date_to'        => $request->query('date_to'),
                    'facility'       => $facilityName,
                    'status'         => $request->query('status'),
                    'payment_status' => $request->query('payment_status'),
                ],
            ])->setPaper('a4', 'landscape');

            return $pdf->download('cabs-report-' . now()->format('Ymd') . '.pdf');
        }

        return response()->json($query->paginate(25));
    }
}