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

        /* Header — logo/wordmark centered, stacked */
        .header { text-align: center; border-bottom: 3px solid #C0392B; padding-bottom: 16px; margin-bottom: 16px; }
        .header h1 { font-size: 48px; font-weight: 900; color: #C0392B; letter-spacing: 4px; line-height: 1; }
        .header p  { font-size: 10px; color: #555; margin-top: 3px; }
        .header .badge { display: inline-block; background: #C0392B; color: #fff; font-size: 10px; font-weight: 700; padding: 4px 14px; border-radius: 4px; letter-spacing: 1px; text-transform: uppercase; margin-top: 10px; }
        .header .generated { font-size: 10px; color: #555; margin-top: 6px; }

        /* "Data" section heading above the table */
        h2.section-title { font-size: 15px; font-weight: 700; color: #1a1a1a; border-left: 4px solid #C0392B; padding-left: 10px; margin-bottom: 10px; }

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

        .col-client   { width: 24%; }
        .col-facility { width: 18%; }
        .col-date     { width: 12%; }
        .col-time     { width: 16%; }
        .col-amount   { width: 13%; text-align: right; }
        .col-receipt  { width: 17%; }

        .email { display: block; font-size: 9px; color: #888; }

        /* Footer */
        .footer { margin-top: 18px; border-top: 1px solid #e5e7e9; padding-top: 10px; font-size: 9px; color: #888; text-align: center; }
        .footer strong { color: #C0392B; }
    </style>
</head>
<body>
<div class="page">

    {{-- Header — centered logo/wordmark --}}
    <div class="header">
        <h1>CABS</h1>
        <p>Cabuyao Athletes Basic School</p>
        <p>Cabuyao, Laguna, Philippines</p>
        <div class="badge">Reservation Report</div>
        <div class="generated">Generated: {{ $generatedAt->format('F d, Y g:i A') }}</div>
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

    <h2 class="section-title">Reservation Data</h2>

    {{-- Table — chunked into ~150-row tables (see the CSS comment above) --}}
    @forelse($reservations->chunk(150) as $chunk)
    <table class="report">
        <thead>
            <tr>
                <th class="col-client">Client</th>
                <th class="col-facility">Facility</th>
                <th class="col-date">Date</th>
                <th class="col-time">Time</th>
                <th class="col-amount">Amount</th>
                <th class="col-receipt">Receipt #</th>
            </tr>
        </thead>
        <tbody>
            @foreach($chunk as $r)
            <tr>
                <td class="col-client">
                    {{ $r->user->full_name ?? '—' }}
                    <span class="email">{{ $r->user->email ?? '' }}</span>
                </td>
                <td class="col-facility">{{ $r->facility->name ?? '—' }}</td>
                <td class="col-date">{{ $r->reservation_date?->format('M d, Y') ?? '—' }}</td>
                <td class="col-time">{{ substr($r->start_time, 0, 5) }} &ndash; {{ substr($r->end_time, 0, 5) }}</td>
                <td class="col-amount">&#8369;{{ number_format($r->payment->amount ?? 0, 2) }}</td>
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
