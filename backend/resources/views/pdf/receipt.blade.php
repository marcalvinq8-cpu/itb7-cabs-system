<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Official Receipt – {{ $payment->receipt_number }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 13px; color: #1a1a1a; background: #fff; }

        .page { padding: 36px 48px; }

        /* Header */
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1a56db; padding-bottom: 16px; margin-bottom: 20px; }
        .header-left h1 { font-size: 22px; font-weight: 700; color: #1a56db; letter-spacing: 1px; }
        .header-left p  { font-size: 11px; color: #555; margin-top: 2px; }
        .header-right   { text-align: right; }
        .header-right .badge { background: #1a56db; color: #fff; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 4px; letter-spacing: 1px; text-transform: uppercase; }
        .header-right .receipt-no { font-size: 18px; font-weight: 700; margin-top: 6px; color: #1a1a1a; }
        .header-right .issued-date { font-size: 11px; color: #555; margin-top: 2px; }

        /* Watermark */
        .watermark {
            position: fixed; top: 50%; left: 50%;
            transform: translate(-50%, -50%) rotate(-35deg);
            font-size: 72px; font-weight: 900; color: rgba(26,86,219,0.07);
            text-transform: uppercase; letter-spacing: 6px; z-index: 0;
            pointer-events: none; white-space: nowrap;
        }

        /* Sections */
        .section { margin-bottom: 20px; }
        .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #1a56db; border-bottom: 1px solid #e0e7ff; padding-bottom: 4px; margin-bottom: 10px; }

        .two-col { display: flex; gap: 24px; }
        .two-col .col { flex: 1; }

        .field { margin-bottom: 6px; }
        .field .label { font-size: 10px; text-transform: uppercase; color: #888; letter-spacing: 0.5px; }
        .field .value { font-size: 13px; font-weight: 600; color: #1a1a1a; margin-top: 1px; }

        /* Table */
        table { width: 100%; border-collapse: collapse; }
        thead tr { background: #1a56db; color: #fff; }
        thead th { padding: 8px 10px; text-align: left; font-size: 11px; letter-spacing: 0.5px; }
        tbody tr { border-bottom: 1px solid #f0f0f0; }
        tbody td { padding: 7px 10px; font-size: 12px; }
        tbody tr:nth-child(even) { background: #f8faff; }

        /* Total box */
        .total-box { margin-top: 16px; text-align: right; }
        .total-box table { width: auto; margin-left: auto; }
        .total-box td { padding: 4px 8px; font-size: 13px; }
        .total-box .grand-total td { font-size: 16px; font-weight: 700; color: #1a56db; border-top: 2px solid #1a56db; padding-top: 8px; }

        /* Status badge */
        .status-paid { display: inline-block; background: #dcfce7; color: #16a34a; font-size: 12px; font-weight: 700; padding: 3px 12px; border-radius: 99px; border: 1px solid #86efac; }

        /* Footer */
        .footer { margin-top: 32px; border-top: 1px solid #e0e7ff; padding-top: 14px; font-size: 10px; color: #888; text-align: center; }
        .footer strong { color: #1a56db; }

        .note { background: #fffbeb; border: 1px solid #fcd34d; padding: 10px 14px; border-radius: 4px; font-size: 11px; color: #78350f; margin-top: 16px; }
    </style>
</head>
<body>
<div class="watermark">Official Receipt</div>

<div class="page">

    {{-- Header --}}
    <div class="header">
        <div class="header-left">
            <h1>CABS</h1>
            <p>Cabuyao Athletes Basic School</p>
            <p>Cabuyao, Laguna, Philippines</p>
            <p>contact@cabs.edu.ph</p>
        </div>
        <div class="header-right">
            <span class="badge">Official Receipt</span>
            <div class="receipt-no">{{ $payment->receipt_number }}</div>
            <div class="issued-date">Issued: {{ $payment->paid_at->format('F d, Y g:i A') }}</div>
        </div>
    </div>

    {{-- Client + Payment Info --}}
    <div class="two-col section">
        <div class="col">
            <div class="section-title">Client Information</div>
            <div class="field">
                <div class="label">Full Name</div>
                <div class="value">{{ $reservation->user->full_name }}</div>
            </div>
            <div class="field">
                <div class="label">Email Address</div>
                <div class="value">{{ $reservation->user->email }}</div>
            </div>
            <div class="field">
                <div class="label">Contact Number</div>
                <div class="value">{{ $reservation->user->contact_number ?? '—' }}</div>
            </div>
            <div class="field">
                <div class="label">Address</div>
                <div class="value">{{ $reservation->user->address ?? '—' }}</div>
            </div>
        </div>
        <div class="col">
            <div class="section-title">Payment Information</div>
            <div class="field">
                <div class="label">Payment Status</div>
                <div class="value"><span class="status-paid">PAID</span></div>
            </div>
            <div class="field">
                <div class="label">Payment Method</div>
                <div class="value">{{ strtoupper($payment->payment_method ?? '—') }}</div>
            </div>
            <div class="field">
                <div class="label">Transaction Reference</div>
                <div class="value">{{ $payment->paymongo_payment_intent_id ?? '—' }}</div>
            </div>
            <div class="field">
                <div class="label">Date Paid</div>
                <div class="value">{{ $payment->paid_at->format('F d, Y') }}</div>
            </div>
        </div>
    </div>

    {{-- Booking Details --}}
    <div class="section">
        <div class="section-title">Booking Details</div>
        <div class="two-col">
            <div class="col">
                <div class="field">
                    <div class="label">Facility</div>
                    <div class="value">{{ $reservation->facility->name }}</div>
                </div>
                <div class="field">
                    <div class="label">Location</div>
                    <div class="value">{{ $reservation->facility->location }}</div>
                </div>
                <div class="field">
                    <div class="label">Purpose</div>
                    <div class="value">{{ $reservation->purpose }}</div>
                </div>
            </div>
            <div class="col">
                <div class="field">
                    <div class="label">Reservation Date</div>
                    <div class="value">{{ $reservation->reservation_date->format('F d, Y') }}</div>
                </div>
                <div class="field">
                    <div class="label">Time</div>
                    <div class="value">
                        {{ \Carbon\Carbon::createFromFormat('H:i:s', $reservation->start_time)->format('g:i A') }}
                        –
                        {{ \Carbon\Carbon::createFromFormat('H:i:s', $reservation->end_time)->format('g:i A') }}
                    </div>
                </div>
                <div class="field">
                    <div class="label">Number of Participants</div>
                    <div class="value">{{ $reservation->number_of_participants }}</div>
                </div>
            </div>
        </div>
    </div>

    {{-- Amenities --}}
    @if(!empty($amenities))
    <div class="section">
        <div class="section-title">Selected Amenities</div>
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Amenity</th>
                    <th>Quantity</th>
                </tr>
            </thead>
            <tbody>
                @foreach($amenities as $index => $amenity)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>{{ $amenity['name'] }}</td>
                    <td>{{ $amenity['quantity'] }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endif

    {{-- Total --}}
    <div class="total-box">
        <table>
            <tbody>
                <tr>
                    <td>Subtotal</td>
                    <td>₱{{ number_format($payment->amount, 2) }}</td>
                </tr>
                <tr>
                    <td>Discount</td>
                    <td>₱0.00</td>
                </tr>
            </tbody>
            <tfoot>
                <tr class="grand-total">
                    <td><strong>TOTAL PAID</strong></td>
                    <td><strong>₱{{ number_format($payment->amount, 2) }}</strong></td>
                </tr>
            </tfoot>
        </table>
    </div>

    <div class="note">
        This is an official receipt issued by the Cabuyao Athletes Basic School (CABS) Online Reservation System.
        Please keep this receipt for your records. For concerns, contact us at contact@cabs.edu.ph.
    </div>

    <div class="footer">
        <strong>CABS Online Reservation, Booking & Payment System</strong><br>
        Cabuyao Athletes Basic School · Cabuyao, Laguna, Philippines · contact@cabs.edu.ph<br>
        This document is system-generated and does not require a signature.
    </div>

</div>
</body>
</html>
