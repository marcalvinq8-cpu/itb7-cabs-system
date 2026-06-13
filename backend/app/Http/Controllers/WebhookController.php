<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Services\PayMongoService;
use Illuminate\Http\Request;

class WebhookController extends Controller
{
    public function __construct(private PayMongoService $payMongo) {}

    public function handlePayMongo(Request $request)
    {
        $payload   = $request->getContent();
        $signature = $request->header('Paymongo-Signature');

        if (!$signature || !$this->payMongo->verifyWebhookSignature($payload, $signature)) {
            return response()->json(['message' => 'Invalid signature.'], 401);
        }

        $event = json_decode($payload, true);
        $type  = $event['data']['attributes']['type'] ?? null;
        $data  = $event['data']['attributes']['data'] ?? null;

        if ($type === 'payment.paid' && $data) {
            $intentId = $data['attributes']['payment_intent_id'] ?? null;

            if ($intentId) {
                $payment = Payment::with(['reservation.user', 'reservation.facility'])
                    ->where('paymongo_payment_intent_id', $intentId)
                    ->first();

                if ($payment && $payment->status !== 'paid') {
                    app(PaymentController::class)->handleSuccess($payment, $data);
                }
            }
        }

        if ($type === 'payment.failed' && $data) {
            $intentId = $data['attributes']['payment_intent_id'] ?? null;

            if ($intentId) {
                $payment = Payment::with(['reservation.user'])
                    ->where('paymongo_payment_intent_id', $intentId)
                    ->first();

                if ($payment && $payment->status !== 'paid') {
                    $payment->update(['status' => 'failed']);

                    if ($payment->reservation) {
                        app(\App\Services\NotificationService::class)::notifyUser(
                            $payment->reservation->user,
                            'payment_failed',
                            'Payment Failed',
                            "Your payment for reservation #{$payment->reservation_id} failed. Please try again.",
                            $payment->reservation_id
                        );
                    }
                }
            }
        }

        // Always return 200 so PayMongo stops retrying
        return response()->json(['message' => 'Webhook handled.'], 200);
    }
}
