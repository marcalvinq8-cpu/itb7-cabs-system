<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>CABS Reservation Report – {{ $generatedAt->format('Y-m-d') }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        /* DejaVu Sans (bundled with dompdf) instead of Arial/Helvetica — the core
           PDF Helvetica font dompdf falls back to has no glyph for the peso sign
           (₱, U+20B1), so it was rendering as "?". DejaVu Sans covers it. */
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 11px; color: #1a1a1a; }

        .page { padding: 28px 36px; }

        /* Header */
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #C0392B; padding-bottom: 14px; margin-bottom: 16px; }
        .header-left h1 { font-size: 20px; font-weight: 700; color: #C0392B; letter-spacing: 1px; }
        .header-left p  { font-size: 10px; color: #555; margin-top: 2px; }
        .header-right   { text-align: right; }
        .header-right .badge { display: inline-block; background: #C0392B; color: #fff; font-size: 10px; font-weight: 700; padding: 4px 12px; border-radius: 4px; letter-spacing: 1px; text-transform: uppercase; }
        .header-right .generated { font-size: 10px; color: #555; margin-top: 6px; }

        /* Filters summary */
        .filters { background: #FADBD8; border: 1px solid #f3c6c1; border-radius: 4px; padding: 8px 12px; margin-bottom: 16px; }
        .filters .title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #96281B; margin-bottom: 4px; }
        .filters .row span { display: inline-block; margin-right: 18px; font-size: 10px; color: #1C2833; }
        .filters .row span strong { color: #1a1a1a; }

        /* Summary stat cards — a table (not flex) so the 4 cards are guaranteed to
           stay on one row regardless of dompdf's flexbox quirks; table-layout:fixed
           locks each column to an even 25% width. */
        table.stats { width: 100%; table-layout: fixed; border-collapse: collapse; margin-top: 14px; }
        table.stats td { width: 25%; vertical-align: top; padding: 0 8px 0 0; }
        table.stats td:last-child { padding-right: 0; }
        .stat-card { border: 1px solid #E5E7E9; border-radius: 4px; padding: 8px 10px; overflow: hidden; }
        .stat-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.4px; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .stat-value { font-size: 14px; font-weight: 700; color: #1a1a1a; margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* Table — rendered as a series of smaller chunked tables (see below)
           rather than one giant table. dompdf's table layout engine keeps a
           full cellmap in memory, which grows steeply with row count; chunking
           keeps each table small while still giving repeating column headers
           every ~150 rows. */
        table.report { width: 100%; border-collapse: collapse; margin-bottom: 1px; }
        table.report thead tr { background: #C0392B; color: #fff; }
        table.report thead th { padding: 6px 8px; text-align: left; font-size: 9.5px; letter-spacing: 0.3px; text-transform: uppercase; }
        table.report tbody tr { border-bottom: 1px solid #f0f0f0; }
        table.report tbody td { padding: 5px 8px; font-size: 10px; vertical-align: top; }
        table.report tbody tr:nth-child(even) { background: #FBF3F2; }

        .col-id       { width: 5%; }
        .col-client   { width: 18%; }
        .col-facility { width: 14%; }
        .col-date     { width: 9%; }
        .col-time     { width: 12%; }
        .col-status   { width: 9%; }
        .col-amount   { width: 10%; text-align: right; }
        .col-payment  { width: 9%; }
        .col-receipt  { width: 14%; }

        .muted { color: #888; }
        .email { display: block; font-size: 9px; color: #888; }

        .pill { display: inline-block; padding: 1px 7px; border-radius: 99px; font-size: 9px; font-weight: 700; text-transform: capitalize; }
        .pill-completed, .pill-approved, .pill-confirmed, .pill-paid { background: #D5F5E3; color: #1E8449; }
        .pill-pending { background: #FEF9E7; color: #B7950B; }
        .pill-rejected, .pill-cancelled, .pill-failed, .pill-expired { background: #FADBD8; color: #96281B; }

        /* Footer */
        .footer { margin-top: 18px; border-top: 1px solid #e5e7e9; padding-top: 10px; font-size: 9px; color: #888; text-align: center; }
        .footer strong { color: #C0392B; }
    </style>
</head>
<body>
<div class="page">

    {{-- Header --}}
    <div class="header">
        <div class="header-left">
            <h1>CABS</h1>
            <p>Cabuyao Athletes Basic School</p>
            <p>Cabuyao, Laguna, Philippines</p>
        </div>
        <div class="header-right">
            <span class="badge">Reservation Report</span>
            <div class="generated">Generated: {{ $generatedAt->format('F d, Y g:i A') }}</div>
        </div>
    </div>

    {{-- Filters applied --}}
    <div class="filters">
        <div class="title">Filters Applied</div>
        <div class="row">
            <span>Date Range: <strong>{{ $filters['date_from'] ?? 'Any' }} &ndash; {{ $filters['date_to'] ?? 'Any' }}</strong></span>
            <span>Facility: <strong>{{ $filters['facility'] ?? 'All facilities' }}</strong></span>
            <span>Status: <strong>{{ $filters['status'] ?? 'All' }}</strong></span>
            <span>Payment: <strong>{{ $filters['payment_status'] ?? 'All' }}</strong></span>
        </div>
    </div>

    @if($truncated)
    <div class="filters" style="background:#FEF9E7; border-color:#fbe7a1;">
        <span style="font-size:10px; color:#78350f;">
            Showing the most recent <strong>{{ number_format($reservations->count()) }}</strong> of
            <strong>{{ number_format($totalMatching) }}</strong> matching records. Narrow the date range or
            filters above to export the remaining records.
        </span>
    </div>
    @endif

    {{-- Table — chunked into ~150-row tables (see the CSS comment above) --}}
    @forelse($reservations->chunk(150) as $chunk)
    <table class="report">
        <thead>
            <tr>
                <th class="col-id">#</th>
                <th class="col-client">Client</th>
                <th class="col-facility">Facility</th>
                <th class="col-date">Date</th>
                <th class="col-time">Time</th>
                <th class="col-status">Status</th>
                <th class="col-amount">Amount</th>
                <th class="col-payment">Payment</th>
                <th class="col-receipt">Receipt #</th>
            </tr>
        </thead>
        <tbody>
            @foreach($chunk as $r)
            <tr>
                <td class="col-id">{{ $r->id }}</td>
                <td class="col-client">
                    {{ $r->user->full_name ?? '—' }}
                    <span class="email">{{ $r->user->email ?? '' }}</span>
                </td>
                <td class="col-facility">{{ $r->facility->name ?? '—' }}</td>
                <td class="col-date">{{ $r->reservation_date?->format('M d, Y') ?? '—' }}</td>
                <td class="col-time">{{ substr($r->start_time, 0, 5) }} &ndash; {{ substr($r->end_time, 0, 5) }}</td>
                <td class="col-status"><span class="pill pill-{{ $r->status }}">{{ $r->status }}</span></td>
                <td class="col-amount">&#8369;{{ number_format($r->payment->amount ?? 0, 2) }}</td>
                <td class="col-payment">
                    @if($r->payment)
                        <span class="pill pill-{{ $r->payment->status }}">{{ $r->payment->status }}</span>
                    @else
                        <span class="muted">N/A</span>
                    @endif
                </td>
                <td class="col-receipt">{{ $r->payment->receipt_number ?? '—' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @empty
    <table class="report">
        <tbody>
            <tr><td style="text-align:center; padding: 16px; color:#888;">No records match the selected filters.</td></tr>
        </tbody>
    </table>
    @endforelse

    {{-- Summary — placed after the table so the totals read as the report's closing tally.
         A table (not flex) keeps all 4 cards on one row; see the CSS comment above. --}}
    <table class="stats">
        <tr>
            <td>
                <div class="stat-card">
                    <div class="stat-label">Total Records</div>
                    <div class="stat-value">{{ number_format($totalMatching) }}</div>
                </div>
            </td>
            <td>
                <div class="stat-card">
                    <div class="stat-label">Total Revenue (Paid)</div>
                    <div class="stat-value">&#8369;{{ number_format($totalRevenue, 2) }}</div>
                </div>
            </td>
            <td>
                <div class="stat-card">
                    <div class="stat-label">Completed</div>
                    <div class="stat-value">{{ number_format($statusCounts['completed'] ?? 0) }}</div>
                </div>
            </td>
            <td>
                <div class="stat-card">
                    <div class="stat-label">Pending</div>
                    <div class="stat-value">{{ number_format($statusCounts['pending'] ?? 0) }}</div>
                </div>
            </td>
        </tr>
    </table>

    <div class="footer">
        <strong>CABS Online Reservation, Booking &amp; Payment System</strong><br>
        This report is system-generated and reflects data at the time of generation.
    </div>

</div>
</body>
</html>
