<?php

namespace App\Http\Controllers;

use App\Models\Facility;
use App\Models\Payment;
use App\Models\Reservation;
use App\Models\User;
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
                DB::raw("DATE_FORMAT(paid_at, '%b %Y')  as month_label"),
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
        $dayMap = [1 => 'Sun', 2 => 'Mon', 3 => 'Tue', 4 => 'Wed', 5 => 'Thu', 6 => 'Fri', 7 => 'Sat'];

        $rows = Reservation::select(
                DB::raw('DAYOFWEEK(reservation_date) as day_num'),
                DB::raw('COUNT(*) as count')
            )
            ->where('reservation_date', '>=', now()->subDays(90)->toDateString())
            ->groupBy('day_num')
            ->orderBy('day_num')
            ->get()
            ->map(fn($r) => [
                'day'   => $dayMap[$r->day_num] ?? 'Unknown',
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

        if ($request->query('format') === 'csv') {
            $reservations = $query->get();

            $escapeFormula = fn($value) => preg_match('/^[=+\-@]/', (string) $value) ? "'" . $value : $value;

            $handle = fopen('php://temp', 'r+');
            fputcsv($handle, ['ID', 'Client', 'Email', 'Facility', 'Date', 'Start', 'End', 'Status', 'Amount', 'Payment Status', 'Receipt']);

            foreach ($reservations as $r) {
                fputcsv($handle, [
                    $r->id,
                    $escapeFormula($r->user->full_name ?? ''),
                    $r->user->email ?? '',
                    $escapeFormula($r->facility->name ?? ''),
                    $r->reservation_date->format('Y-m-d'),
                    $r->start_time,
                    $r->end_time,
                    $r->status,
                    $r->payment->amount ?? 0,
                    $r->payment->status ?? 'N/A',
                    $r->payment->receipt_number ?? '',
                ]);
            }

            rewind($handle);
            $csv = stream_get_contents($handle);
            fclose($handle);

            return response($csv, 200, [
                'Content-Type'        => 'text/csv',
                'Content-Disposition' => 'attachment; filename="cabs-report-' . now()->format('Ymd') . '.csv"',
            ]);
        }

        return response()->json($query->paginate(25));
    }
}
