<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\FacilityController;
use App\Http\Controllers\ReservationController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WebhookController;
use App\Http\Controllers\ReceiptController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login',    [AuthController::class, 'login']);

// Public facility browsing (no auth required — for guest page)
Route::get('/public/facilities',      [FacilityController::class, 'index']);
Route::get('/public/facilities/{id}', [FacilityController::class, 'show']);

// PayMongo webhook (no auth — signature verified internally)
Route::post('/webhooks/paymongo', [WebhookController::class, 'handlePayMongo']);

// Authenticated routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout',    [AuthController::class, 'logout']);
    Route::get('/auth/user',       [AuthController::class, 'user']);
    Route::put('/auth/profile',    [AuthController::class, 'updateProfile']);
    Route::put('/auth/password',   [AuthController::class, 'changePassword']);

    // Facilities (read only for authenticated users)
    Route::get('/facilities',                         [FacilityController::class, 'index']);
    Route::get('/facilities/{id}',                    [FacilityController::class, 'show']);
    Route::get('/facilities/{id}/availability',       [FacilityController::class, 'getAvailability']);

    // Reservations
    Route::get('/reservations',                               [ReservationController::class, 'index']);
    Route::post('/reservations',                              [ReservationController::class, 'store']);
    Route::get('/reservations/{id}',                          [ReservationController::class, 'show']);
    Route::post('/reservations/{id}/cancel',                  [ReservationController::class, 'cancel']);
    Route::post('/reservations/{id}/acknowledge-terms',       [ReservationController::class, 'acknowledgeTerms']);

    // Payments
    Route::post('/payments/{reservationId}/create-link',      [PaymentController::class, 'createLink']);
    Route::post('/payments/{reservationId}/initiate',         [PaymentController::class, 'initiate']);
    Route::post('/payments/{reservationId}/select-method',    [PaymentController::class, 'selectMethod']);
    Route::get('/payments/{reservationId}/status',            [PaymentController::class, 'handleCallback']);
    Route::post('/payments/{reservationId}/test-complete',    [PaymentController::class, 'testComplete']);

    // Notifications (read-all must come before {id}/read to avoid route collision)
    Route::get('/notifications',                    [NotificationController::class, 'index']);
    Route::put('/notifications/read-all',           [NotificationController::class, 'markAllRead']);
    Route::put('/notifications/{id}/read',          [NotificationController::class, 'markRead']);

    // Receipts
    Route::get('/receipts/{reservationId}',         [ReceiptController::class, 'download']);

    // Calendar
    Route::get('/calendar/events',                  [CalendarController::class, 'events']);

    // Staff + Admin routes
    Route::middleware('role:staff,administrator')->group(function () {
        Route::get('/admin/reservations',                         [ReservationController::class, 'adminIndex']);
        Route::put('/admin/reservations/{id}/approve',            [ReservationController::class, 'approve']);
        Route::put('/admin/reservations/{id}/reject',             [ReservationController::class, 'reject']);
        Route::put('/admin/reservations/{id}/complete',           [ReservationController::class, 'complete']);
    });

    // Admin only routes
    Route::middleware('role:administrator')->group(function () {
        // Payments
        Route::get('/admin/payments',                             [PaymentController::class, 'adminIndex']);

        // Facility management
        Route::post('/admin/facilities',                          [FacilityController::class, 'store']);
        Route::put('/admin/facilities/{id}',                      [FacilityController::class, 'update']);
        Route::delete('/admin/facilities/{id}',                   [FacilityController::class, 'destroy']);
        Route::post('/admin/facilities/{id}/maintenance',         [FacilityController::class, 'updateMaintenance']);

        // Amenity management
        Route::post('/admin/amenities',                           [FacilityController::class, 'storeAmenity']);
        Route::put('/admin/amenities/{id}',                       [FacilityController::class, 'updateAmenity']);
        Route::delete('/admin/amenities/{id}',                    [FacilityController::class, 'destroyAmenity']);

        // User management
        Route::get('/admin/users',                                [UserController::class, 'index']);
        Route::post('/admin/users',                               [UserController::class, 'store']);
        Route::put('/admin/users/{id}',                           [UserController::class, 'update']);
        Route::delete('/admin/users/{id}',                        [UserController::class, 'destroy']);

        // Analytics
        Route::get('/admin/analytics/summary',                    [AnalyticsController::class, 'summary']);
        Route::get('/admin/analytics/revenue',                    [AnalyticsController::class, 'monthlyRevenue']);
        Route::get('/admin/analytics/utilization',                [AnalyticsController::class, 'facilityUtilization']);
        Route::get('/admin/analytics/trends',                     [AnalyticsController::class, 'bookingTrends']);
        Route::get('/admin/reports',                              [AnalyticsController::class, 'reports']);
    });
});
