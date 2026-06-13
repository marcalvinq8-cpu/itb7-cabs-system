<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PayMongoService
{
    private string $secretKey;
    private string $baseUrl = 'https://api.paymongo.com/v1';

    public function __construct()
    {
        $this->secretKey = (string) config('services.paymongo.secret_key', '');
    }

    private function headers(): array
    {
        return [
            'Authorization' => 'Basic ' . base64_encode($this->secretKey . ':'),
            'Content-Type'  => 'application/json',
            'Accept'        => 'application/json',
        ];
    }

    public function createPaymentIntent(int $amountInCentavos, string $description): array
    {
        try {
            $response = Http::withHeaders($this->headers())
                ->timeout(30)
                ->post("{$this->baseUrl}/payment_intents", [
                    'data' => [
                        'attributes' => [
                            'amount'                 => $amountInCentavos,
                            'currency'               => 'PHP',
                            'payment_method_allowed' => ['gcash', 'paymaya', 'dob', 'card'],
                            'description'            => $description,
                            'capture_type'           => 'automatic',
                        ],
                    ],
                ]);
            return $response->json() ?? [];
        } catch (\Exception $e) {
            Log::error('PayMongo createPaymentIntent exception', ['error' => $e->getMessage()]);
            return ['errors' => [['detail' => 'Could not reach PayMongo: ' . $e->getMessage()]]];
        }
    }

    public function createPaymentMethod(string $type, array $billingDetails = [], array $cardDetails = []): array
    {
        $attributes = ['type' => $type];

        if (!empty($billingDetails)) {
            $attributes['billing'] = $billingDetails;
        }

        if (!empty($cardDetails)) {
            $attributes['details'] = $cardDetails;
        }

        try {
            $response = Http::withHeaders($this->headers())
                ->timeout(30)
                ->post("{$this->baseUrl}/payment_methods", [
                    'data' => ['attributes' => $attributes],
                ]);
            return $response->json() ?? [];
        } catch (\Exception $e) {
            Log::error('PayMongo createPaymentMethod exception', ['error' => $e->getMessage()]);
            return ['errors' => [['detail' => 'Could not reach PayMongo: ' . $e->getMessage()]]];
        }
    }

    public function attachPaymentMethod(string $intentId, string $methodId, string $returnUrl): array
    {
        try {
            $response = Http::withHeaders($this->headers())
                ->timeout(30)
                ->post("{$this->baseUrl}/payment_intents/{$intentId}/attach", [
                    'data' => [
                        'attributes' => [
                            'payment_method' => $methodId,
                            'return_url'     => $returnUrl,
                        ],
                    ],
                ]);
            return $response->json() ?? [];
        } catch (\Exception $e) {
            Log::error('PayMongo attachPaymentMethod exception', ['error' => $e->getMessage()]);
            return ['errors' => [['detail' => 'Could not reach PayMongo: ' . $e->getMessage()]]];
        }
    }

    public function retrievePaymentIntent(string $intentId): array
    {
        try {
            $response = Http::withHeaders($this->headers())
                ->timeout(30)
                ->get("{$this->baseUrl}/payment_intents/{$intentId}");
            return $response->json() ?? [];
        } catch (\Exception $e) {
            Log::error('PayMongo retrievePaymentIntent exception', ['error' => $e->getMessage()]);
            return ['errors' => [['detail' => $e->getMessage()]]];
        }
    }

    public function createSource(string $type, int $amountInCentavos, string $successUrl, string $failedUrl): array
    {
        $response = Http::withHeaders($this->headers())
            ->post("{$this->baseUrl}/sources", [
                'data' => [
                    'attributes' => [
                        'amount'   => $amountInCentavos,
                        'currency' => 'PHP',
                        'type'     => $type,
                        'redirect' => [
                            'success' => $successUrl,
                            'failed'  => $failedUrl,
                        ],
                    ],
                ],
            ]);

        return $response->json();
    }

    public function createPaymentLink(int $amountInCentavos, string $description): array
    {
        try {
            $response = Http::withHeaders($this->headers())
                ->timeout(30)
                ->post("{$this->baseUrl}/payment_links", [
                    'amount'      => $amountInCentavos,
                    'currency'    => 'PHP',
                    'description' => $description,
                ]);
            return $response->json() ?? [];
        } catch (\Exception $e) {
            Log::error('PayMongo createPaymentLink exception', ['error' => $e->getMessage()]);
            return ['errors' => [['detail' => 'Could not reach PayMongo: ' . $e->getMessage()]]];
        }
    }

    public function getPaymentLinkPayments(string $linkId): array
    {
        try {
            $response = Http::withHeaders($this->headers())
                ->timeout(30)
                ->get("{$this->baseUrl}/payment_links/{$linkId}/payments");
            return $response->json() ?? [];
        } catch (\Exception $e) {
            Log::error('PayMongo getPaymentLinkPayments exception', ['error' => $e->getMessage()]);
            return ['errors' => [['detail' => $e->getMessage()]]];
        }
    }

    public function verifyWebhookSignature(string $payload, string $signature): bool
    {
        $secret = config('services.paymongo.webhook_secret');

        if (!$secret) return false;

        // Signature format: "t=TIMESTAMP,te=HMAC" (test) or "t=TIMESTAMP,li=HMAC" (live)
        $parts = [];
        foreach (explode(',', $signature) as $part) {
            [$k, $v]   = explode('=', $part, 2);
            $parts[$k] = $v;
        }

        $timestamp = $parts['t'] ?? '';
        $received  = $parts['te'] ?? $parts['li'] ?? '';
        $computed  = hash_hmac('sha256', "{$timestamp}.{$payload}", $secret);

        return $received && hash_equals($computed, $received);
    }
}
